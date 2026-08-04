/**
 * src/dashboard/dashboard.service.js
 *
 * Aggregates everything the Company Dashboard shows, across every job
 * the company has posted. Nothing here is per-job — this is the
 * "zoom out" view; per-job applicant management still lives in
 * job.service.js's listApplicants().
 */
const Job     = require('../job/job.model');
const User    = require('../user/user.model');
const Profile = require('../profile/profile.model');
const { ROUND_ORDER } = require('../job/job.service');
const { getJsonCompletion } = require('../utils/gemini');

const DAY_MS = 24 * 60 * 60 * 1000;

/* ══════════════════════════════════════════════════
   SHARED HELPERS
══════════════════════════════════════════════════ */

const flattenProfileSkills = (profile) => [
  ...(profile?.skills?.languages  || []),
  ...(profile?.skills?.frameworks || []),
  ...(profile?.skills?.tools      || []),
  ...(profile?.skills?.libraries  || []),
].map((s) => s.toLowerCase().trim()).filter(Boolean);

/**
 * Cheap, local (no AI) skill-overlap score — what fraction of the job's
 * listed skills show up somewhere in the candidate's profile. Used for
 * "recent applicants" (where calling Gemini per-row would be far too
 * many requests) and as the non-AI fallback ranking when Gemini is
 * unavailable/misconfigured/rate-limited.
 */
// Normalizes punctuation/spacing only (kept conservative on purpose):
// "Node.js" / "NodeJS" / "node js" all collapse to "nodejs" and match.
// Deliberately does NOT do substring/fuzzy matching — that would wrongly
// match e.g. "Java" against "JavaScript" since one is a literal substring
// of the other. Symbols that actually distinguish skills (+, #) are kept,
// so "C++" and "C#" stay distinct from "C" and from each other.
const normalizeSkill = (s) => String(s).toLowerCase().trim().replace(/[\s.\-_/]+/g, '');

// Explicit alias table for common tech-skill spellings/abbreviations that
// normalizeSkill() alone can't unify (e.g. "React" vs "ReactJS", "JS" vs
// "JavaScript"). Keys/values here are already in normalizeSkill()'s output
// form (lowercase, no spaces/dots/dashes/underscores/slashes) since that's
// what they're matched against. This is intentionally an explicit list
// rather than fuzzy/substring matching, specifically so things like "Java"
// vs "JavaScript" never get wrongly conflated. Add more pairs here as you
// notice real mismatches — it's a flat, safe list to extend.
const SKILL_ALIASES = {
  react:        ['reactjs'],
  javascript:   ['js'],
  typescript:   ['ts'],
  nodejs:       ['node'],
  python:       ['python3', 'py'],
  'c++':        ['cpp', 'cplusplus'],
  'c#':         ['csharp'],
  postgresql:   ['postgres', 'psql'],
  mongodb:      ['mongo'],
  restapi:      ['rest', 'restful', 'restfulapi'],
  expressjs:    ['express'],
  nextjs:       ['next'],
  vuejs:        ['vue'],
  angularjs:    ['angular'],
  html:         ['html5'],
  css:          ['css3'],
  uiux:         ['uxui'],
  aws:          ['amazonwebservices'],
  gcp:          ['googlecloud', 'googlecloudplatform'],
  tailwindcss:  ['tailwind'],
  kubernetes:   ['k8s'],
  // Note: deliberately NOT aliasing sql <-> mysql — mysql is its own
  // distinct, more specific skill, not just alternate wording for "sql".
};

const SKILL_ALIAS_LOOKUP = Object.entries(SKILL_ALIASES).reduce((map, [canonical, aliases]) => {
  map[canonical] = canonical;
  aliases.forEach((alias) => { map[alias] = canonical; });
  return map;
}, {});

// normalize, then fold known aliases down to one canonical spelling before
// comparing.
const canonicalizeSkill = (s) => {
  const normalized = normalizeSkill(s);
  return SKILL_ALIAS_LOOKUP[normalized] || normalized;
};

const skillMatchPercent = (jobSkills = [], profileSkills = []) => {
  // No job skills to compare against, OR no candidate skills on file
  // (never filled Profile Builder / no profile yet) — either way there's
  // nothing to honestly compute a score from, so return "no data" (null,
  // rendered as "—") rather than a misleading 0%.
  if (!jobSkills.length || !profileSkills.length) return null;
  const profileSet = new Set(profileSkills.map(canonicalizeSkill));
  const overlap = jobSkills.filter((s) => profileSet.has(canonicalizeSkill(s))).length;
  return Math.round((overlap / jobSkills.length) * 100);
};

/* ══════════════════════════════════════════════════
   STATS ROW
══════════════════════════════════════════════════ */

const buildStats = (jobs) => {
  const now = Date.now();
  const weekAgo = now - 7 * DAY_MS;

  const activeJobs = jobs.filter((j) => j.status === 'active');
  const allApplications = jobs.flatMap((j) => j.applications.map((a) => ({ ...a.toObject?.() ?? a, jobId: j._id })));

  const shortlistedOrFurther = allApplications.filter(
    (a) => a.status !== 'rejected' && ROUND_ORDER.indexOf(a.status) >= ROUND_ORDER.indexOf('shortlisted')
  );

  const hired = allApplications.filter((a) => a.status === 'hired' && a.statusUpdatedAt);
  const avgTimeToHireDays = hired.length
    ? Math.round(
        hired.reduce((sum, a) => sum + (new Date(a.statusUpdatedAt) - new Date(a.appliedAt)) / DAY_MS, 0) / hired.length
      )
    : null;

  return {
    activeJobs: {
      value: activeJobs.length,
      delta: jobs.filter((j) => new Date(j.createdAt).getTime() >= weekAgo).length,
    },
    totalApplicants: {
      value: allApplications.length,
      delta: allApplications.filter((a) => new Date(a.appliedAt).getTime() >= weekAgo).length,
    },
    shortlisted: {
      value: shortlistedOrFurther.length,
      delta: shortlistedOrFurther.filter(
        (a) => a.statusUpdatedAt && new Date(a.statusUpdatedAt).getTime() >= weekAgo
      ).length,
    },
    avgTimeToHireDays,
  };
};

/* ══════════════════════════════════════════════════
   APPLICANTS OVER TIME (chart)
══════════════════════════════════════════════════ */

const WEEKS_SHOWN = 6;

const buildApplicantsOverTime = (jobs) => {
  const allApplications = jobs.flatMap((j) => j.applications);
  const now = new Date();
  // Bucket index 0 = oldest of the shown weeks, last = this week.
  const buckets = Array.from({ length: WEEKS_SHOWN }, (_, i) => {
    const weeksAgo = WEEKS_SHOWN - 1 - i;
    const end = new Date(now.getTime() - weeksAgo * 7 * DAY_MS);
    const start = new Date(end.getTime() - 7 * DAY_MS);
    return { start, end, count: 0, label: `W${i + 1}` };
  });

  allApplications.forEach((a) => {
    const appliedAt = new Date(a.appliedAt).getTime();
    const bucket = buckets.find((b) => appliedAt >= b.start.getTime() && appliedAt < b.end.getTime());
    if (bucket) bucket.count += 1;
  });

  return buckets.map((b) => ({ label: b.label, count: b.count }));
};

/* ══════════════════════════════════════════════════
   HIRING FUNNEL
   Cumulative — "reviewed" means "reached at least reviewed", etc. —
   which is what gives the funnel its narrowing shape. Applications
   currently marked 'rejected' only count toward "Applied" since we
   don't retain which stage they were rejected from.
══════════════════════════════════════════════════ */

const FUNNEL_STAGES = [
  { key: 'new',         label: 'Applied' },
  { key: 'reviewed',    label: 'Reviewed' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interview',   label: 'Interview' },
  { key: 'hired',       label: 'Hired' },
];

const buildHiringFunnel = (jobs) => {
  const allApplications = jobs.flatMap((j) => j.applications);
  const total = allApplications.length;

  return FUNNEL_STAGES.map((stage) => {
    const stageIndex = ROUND_ORDER.indexOf(stage.key);
    const count = allApplications.filter(
      (a) => a.status !== 'rejected' && ROUND_ORDER.indexOf(a.status) >= stageIndex
    ).length;
    return {
      key:        stage.key,
      label:      stage.label,
      count,
      percent:    total ? Math.round((count / total) * 100) : 0,
    };
  });
};

/* ══════════════════════════════════════════════════
   RECENT APPLICANTS
══════════════════════════════════════════════════ */

const RECENT_APPLICANTS_COUNT = 8;

const buildRecentApplicants = async (jobs) => {
  const flat = jobs
    .flatMap((j) => j.applications.map((a) => ({ application: a, job: j })))
    .sort((a, b) => new Date(b.application.appliedAt) - new Date(a.application.appliedAt))
    .slice(0, RECENT_APPLICANTS_COUNT);

  const candidateIds = flat.map(({ application }) => application.candidateId?._id || application.candidateId);
  const profiles = await Profile.find({ userId: { $in: candidateIds } })
    .select('userId skills')
    .lean();
  const profileByCandidate = new Map(profiles.map((p) => [String(p.userId), p]));

  return flat.map(({ application: a, job }) => {
    const candidate = a.candidateId; // populated { _id, fullName, photoURL }
    const profile = profileByCandidate.get(String(candidate?._id || candidate));
    return {
      candidateId: String(candidate?._id || candidate),
      name:        candidate?.fullName || 'Candidate',
      photoURL:    candidate?.photoURL || null,
      jobId:       String(job._id),
      jobTitle:    job.title,
      status:      a.status,
      appliedAt:   a.appliedAt,
      matchPercent: skillMatchPercent(job.skills, flattenProfileSkills(profile)),
    };
  });
};

/* ══════════════════════════════════════════════════
   AI RECOMMENDED CANDIDATES (Gemini, cached)
══════════════════════════════════════════════════ */

// How stale the cache can get before we spend another Gemini request on
// it. Free-tier Gemini quotas reset daily/per-minute and are easy to
// exhaust if every dashboard reload triggered a fresh call — most
// companies don't get enough *new* applicants in under a few hours for
// a shorter TTL to matter anyway.
const RECOMMENDATION_TTL_MS = Number(process.env.DASHBOARD_RECOMMENDATION_TTL_HOURS || 12) * 60 * 60 * 1000;
// Even an explicit "refresh" request won't call Gemini more often than
// this — protects the quota from someone repeatedly mashing a refresh
// button.
const MIN_REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const RECOMMEND_COUNT = 6;
// A candidate with essentially no skill overlap isn't a "recommendation" —
// this is enforced in code (not just asked for in the prompt) so neither
// the local fallback nor a Gemini response that ignores the instruction
// can pad the list with 0%/near-0% matches just to fill RECOMMEND_COUNT.
const MIN_RECOMMEND_MATCH_PERCENT = Number(process.env.DASHBOARD_MIN_MATCH_PERCENT || 20);
// Cap on how many applications we ever hand to Gemini in one prompt —
// keeps the request small/fast/cheap regardless of how large the
// company's applicant pool has grown.
const RECOMMEND_POOL_SIZE = 40;

const RECOMMEND_SYSTEM_PROMPT = `You are a recruiting assistant for SkillSphere, a hiring platform.

You will receive a JSON object with "applicants": a list of candidates who applied to this company's open jobs, each with an "id", the "job" they applied to (with its id, title and required skills), and the candidate's own title/skills/experience/projects.

Pick up to ${RECOMMEND_COUNT} applicants who are the STRONGEST fit for the job they applied to, ranked best first. Base this on overlapping skills, relevant experience/title, and project relevance — not application recency.

Rules:
- Only use "id" and "jobId" values that appear together in the same applicant entry in the input. Never invent one or mix them up.
- matchPercent is your own honest estimate (0-100) of how well that candidate fits that specific job.
- reason is ONE short sentence (under 15 words) on why they're a good fit.
- If fewer than ${RECOMMEND_COUNT} applicants are a reasonable fit, return fewer rather than padding with weak matches.
- Return ONLY valid JSON, no markdown, no explanation, in exactly this shape:
{ "picks": [ { "id": "<candidateId>", "jobId": "<jobId>", "matchPercent": 87, "reason": "..." } ] }`;

const buildApplicantSummaries = (jobs, profileByCandidate) => {
  const summaries = [];
  jobs
    .filter((j) => j.status === 'active')
    .forEach((job) => {
      job.applications
        .filter((a) => a.status === 'new' || a.status === 'reviewed')
        .forEach((a) => {
          const candidate = a.candidateId;
          const candidateId = String(candidate?._id || candidate);
          const profile = profileByCandidate.get(candidateId);
          if (!profile) return; // no profile to match against — skip rather than guess
          summaries.push({
            id:    candidateId,
            jobId: String(job._id),
            job: {
              id:     String(job._id),
              title:  job.title,
              skills: job.skills,
            },
            candidateTitle:    profile.personal?.title || '',
            candidateSkills:   flattenProfileSkills(profile),
            recentExperience: (profile.experiences || [])
              .filter((e) => e?.title?.trim())
              .slice(0, 2)
              .map((e) => `${e.title} at ${e.company || 'a company'}`),
            projects: (profile.projects || [])
              .filter((p) => p?.name?.trim())
              .slice(0, 2)
              .map((p) => p.name),
          });
        });
    });
  return summaries.slice(0, RECOMMEND_POOL_SIZE);
};

/**
 * Deterministic, non-AI fallback: ranks the same pool by local skill
 * overlap instead of asking Gemini. Used when Gemini is unconfigured,
 * errors out, or there's no applicant pool worth asking about.
 */
const localFallbackPicks = (summaries) =>
  summaries
    .map((s) => ({
      candidateId:  s.id,
      jobId:        s.jobId,
      matchPercent: skillMatchPercent(s.job.skills, s.candidateSkills),
      reason:       'Ranked by overlapping skills with the job listing.',
    }))
    // A candidate below the threshold (or with no scoreable skills at all)
    // isn't a real recommendation — drop rather than pad the list with them.
    .filter((p) => (p.matchPercent || 0) >= MIN_RECOMMEND_MATCH_PERCENT)
    .sort((a, b) => (b.matchPercent || 0) - (a.matchPercent || 0))
    .slice(0, RECOMMEND_COUNT);

const getGeminiCandidatePicks = async (summaries) => {
  const messages = [
    { role: 'system', content: RECOMMEND_SYSTEM_PROMPT },
    { role: 'user', content: JSON.stringify({ applicants: summaries }) },
  ];

  // Its own env var (GEMINI_API_COMPANY_DASHBOARD) — separate quota
  // from the candidate-facing "recommended jobs" feature.
  const data = await getJsonCompletion(messages, 'GEMINI_API_COMPANY_DASHBOARD');
  if (!Array.isArray(data.picks)) throw new Error('Gemini response missing picks array.');

  const validIds = new Set(summaries.map((s) => `${s.id}::${s.jobId}`));
  return data.picks
    .filter((p) => p?.id && p?.jobId && validIds.has(`${p.id}::${p.jobId}`))
    // Gemini is only *asked* not to pad with weak matches — enforce it
    // here too, since it doesn't reliably follow that on its own.
    .filter((p) => typeof p.matchPercent !== 'number' || p.matchPercent >= MIN_RECOMMEND_MATCH_PERCENT)
    .slice(0, RECOMMEND_COUNT)
    .map((p) => ({
      candidateId:  p.id,
      jobId:        p.jobId,
      matchPercent: typeof p.matchPercent === 'number' ? Math.max(0, Math.min(100, Math.round(p.matchPercent))) : null,
      reason:       typeof p.reason === 'string' ? p.reason.slice(0, 200) : '',
    }));
};

/**
 * Returns cached picks if fresh enough, otherwise asks Gemini (or falls
 * back to the local heuristic) and updates the cache. `forceRefresh`
 * still respects MIN_REFRESH_INTERVAL_MS so a refresh button can't be
 * used to spam the API past the quota.
 */
const getRecommendedCandidates = async (company, jobs, { forceRefresh = false } = {}) => {
  const cache = company.dashboardRecommendationCache || {};
  const cacheAgeMs = cache.generatedAt ? Date.now() - new Date(cache.generatedAt).getTime() : Infinity;

  const cacheIsUsable = cache.generatedAt && cache.picks?.length && cacheAgeMs < RECOMMENDATION_TTL_MS;
  const refreshAllowed = forceRefresh && cacheAgeMs >= MIN_REFRESH_INTERVAL_MS;

  if (cacheIsUsable && !refreshAllowed) {
    return { picks: cache.picks, generatedAt: cache.generatedAt, source: 'cache' };
  }

  const candidateIds = [
    ...new Set(
      jobs
        .filter((j) => j.status === 'active')
        .flatMap((j) => j.applications)
        .filter((a) => a.status === 'new' || a.status === 'reviewed')
        .map((a) => String(a.candidateId?._id || a.candidateId))
    ),
  ];

  if (!candidateIds.length) {
    // Nothing to recommend — clear the cache rather than serving stale
    // picks for applicants who may have since moved to another stage.
    return { picks: [], generatedAt: new Date(), source: 'none' };
  }

  const profiles = await Profile.find({ userId: { $in: candidateIds } }).lean();
  const profileByCandidate = new Map(profiles.map((p) => [String(p.userId), p]));
  const summaries = buildApplicantSummaries(jobs, profileByCandidate);

  let picks;
  let source;
  try {
    picks = summaries.length ? await getGeminiCandidatePicks(summaries) : [];
    source = 'gemini';
  } catch (err) {
    console.error('[Dashboard] Gemini candidate recommendation failed, using local fallback:', err.message);
    picks = localFallbackPicks(summaries);
    source = 'fallback';
  }

  const generatedAt = new Date();
  company.dashboardRecommendationCache = { generatedAt, picks };
  await company.save();

  return { picks, generatedAt, source };
};

/* ══════════════════════════════════════════════════
   MAIN ENTRY POINT
══════════════════════════════════════════════════ */

const getDashboard = async (companyId, { forceRefreshRecommendations = false } = {}) => {
  const [company, jobs] = await Promise.all([
    User.findById(companyId),
    Job.find({ companyId }).populate('applications.candidateId', 'fullName email photoURL'),
  ]);

  const stats               = buildStats(jobs);
  const applicantsOverTime  = buildApplicantsOverTime(jobs);
  const hiringFunnel        = buildHiringFunnel(jobs);
  const recentApplicants    = await buildRecentApplicants(jobs);
  const { picks, generatedAt, source } = await getRecommendedCandidates(company, jobs, {
    forceRefresh: forceRefreshRecommendations,
  });

  // Enrich the cached/fresh picks with display info (name/photo/job
  // title) — kept out of the cache itself so renamed jobs, updated
  // photos, etc. always show current data even between regenerations.
  const jobById = new Map(jobs.map((j) => [String(j._id), j]));
  const pickCandidateIds = picks.map((p) => p.candidateId);
  const pickProfiles = await Profile.find({ userId: { $in: pickCandidateIds } }).lean();
  const profileByCandidate = new Map(pickProfiles.map((p) => [String(p.userId), p]));
  const pickUsers = await User.find({ _id: { $in: pickCandidateIds } }).select('fullName photoURL').lean();
  const userByCandidate = new Map(pickUsers.map((u) => [String(u._id), u]));

  const recommendedCandidates = picks
    .map((pick) => {
      const job = jobById.get(String(pick.jobId));
      const profile = profileByCandidate.get(String(pick.candidateId));
      const user = userByCandidate.get(String(pick.candidateId));
      if (!job || !profile || !user) return null; // stale reference (job/candidate deleted since caching)

      // Looked up live from the job doc (never cached) — so this always
      // reflects the candidate's *current* pipeline stage, even though
      // the AI pick itself (matchPercent/reason) may be served from
      // cache. This is what lets the dashboard button correctly show
      // "Remove from shortlist" once you've actually shortlisted them.
      const application = job.applications.find(
        (a) => String(a.candidateId?._id || a.candidateId) === String(pick.candidateId)
      );

      return {
        candidateId:  String(pick.candidateId),
        name:         user.fullName,
        photoURL:     user.photoURL,
        title:        profile.personal?.title || '',
        location:     profile.personal?.location || '',
        skills:       flattenProfileSkills(profile).slice(0, 3),
        matchPercent: pick.matchPercent,
        reason:       pick.reason,
        jobId:        String(job._id),
        jobTitle:     job.title,
        status:       application?.status || null,
      };
    })
    .filter(Boolean);

  return {
    stats,
    applicantsOverTime,
    hiringFunnel,
    recentApplicants,
    recommendedCandidates,
    recommendationsGeneratedAt: generatedAt,
    recommendationsSource: source,
  };
};

/* ══════════════════════════════════════════════════
   CANDIDATE INSIGHTS PAGE
   Mirrors the company dashboard above, but from the candidate's side:
   aggregates every job this candidate has applied to into the stat
   cards / donut chart / recent list / upcoming schedule the Insights
   page renders. Nothing here is per-job — job.service.js's
   listMyApplications() still covers "show me my applications" as a
   flat list; this is the "zoom out" analytics view.
══════════════════════════════════════════════════ */

/* Maps the 6 real pipeline statuses (job.model.js ApplicationSchema)
   down to the 4 mutually-exclusive buckets the Insights stat cards
   show (the 5th, 'applied', is just the grand total — see buildStatusStats). */
const STATUS_BUCKET = {
  new:         'in_review',
  reviewed:    'in_review',
  shortlisted: 'shortlisted',
  interview:   'interviewed',
  hired:       'interviewed',
  rejected:    'rejected',
};

const RANGE_MS = {
  '7d':   7  * DAY_MS,
  '30d':  30 * DAY_MS,
  'year': 365 * DAY_MS,
};

/**
 * Resolves the date-range dropdown value (see InsightsPage.jsx's
 * `dateOptions`) into a concrete [start, end] window. 'all' and
 * unrecognized values return null bounds (no filtering).
 */
const resolveDateRange = ({ range, startDate, endDate } = {}) => {
  const now = new Date();

  if (range === 'custom' && (startDate || endDate)) {
    return {
      start: startDate ? new Date(startDate) : null,
      end:   endDate ? new Date(endDate) : null,
    };
  }
  if (range === 'month') {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: null };
  }
  if (RANGE_MS[range]) {
    return { start: new Date(now.getTime() - RANGE_MS[range]), end: null };
  }
  return { start: null, end: null }; // 'all' or unspecified
};

const inRange = (date, { start, end }) => {
  const d = new Date(date);
  if (start && d < start) return false;
  if (end && d > end) return false;
  return true;
};

/** Same "time ago" formatting the notification model uses, duplicated
 *  locally to keep the two modules independent. */
const formatTimeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
};

const companyInitials = (name = 'Company') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'CO';

/** Stage/date copy for the "Upcoming Schedule" card — this platform has
 *  no dedicated interview-scheduling field yet, so this approximates
 *  "what needs your attention next" from the pipeline stage + the last
 *  time it changed, rather than a literal calendar invite. */
const UPCOMING_STAGE_COPY = {
  new:         { stage: 'Waiting for Response', useAppliedAt: true },
  reviewed:    { stage: 'Under Review',          useAppliedAt: false },
  shortlisted: { stage: 'Shortlisted — Awaiting Next Step', useAppliedAt: false },
  interview:   { stage: 'Interview Round',       useAppliedAt: false },
};

const getCandidateInsights = async (candidateId, { range, startDate, endDate } = {}) => {
  const window = resolveDateRange({ range, startDate, endDate });

  const jobs = await Job.find({ 'applications.candidateId': candidateId })
    .populate('companyId', 'companyName photoURL')
    .lean();

  // Flatten each job down to just *this* candidate's application, paired
  // with the job/company info the UI needs to render a row.
  let applications = jobs
    .map((job) => {
      const app = (job.applications || []).find((a) => String(a.candidateId) === String(candidateId));
      if (!app) return null;
      return {
        id:              String(job._id),
        jobId:           String(job._id),
        role:            job.title || 'Untitled Role',
        company:         job.companyId?.companyName || 'Company',
        logo:            companyInitials(job.companyId?.companyName),
        status:          app.status,
        statusBucket:    STATUS_BUCKET[app.status] || 'in_review',
        appliedAt:       app.appliedAt,
        statusUpdatedAt: app.statusUpdatedAt || app.appliedAt,
      };
    })
    .filter(Boolean)
    .filter((a) => inRange(a.appliedAt, window));

  applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

  /* ── Stat cards ──
     'applied' is the grand total (all statuses); the other four are a
     strict partition of the 6 real statuses (see STATUS_BUCKET), so
     they always sum back up to the total. */
  const bucketCounts = { shortlisted: 0, in_review: 0, interviewed: 0, rejected: 0 };
  applications.forEach((a) => { bucketCounts[a.statusBucket] += 1; });

  const statusStats = [
    { id: 'applied',     count: applications.length },
    { id: 'shortlisted', count: bucketCounts.shortlisted },
    { id: 'in_review',   count: bucketCounts.in_review },
    { id: 'interviewed', count: bucketCounts.interviewed },
    { id: 'rejected',    count: bucketCounts.rejected },
  ];

  /* ── Top roles donut chart ── */
  const roleCounts = new Map();
  applications.forEach((a) => roleCounts.set(a.role, (roleCounts.get(a.role) || 0) + 1));
  const rankedRoles = [...roleCounts.entries()].sort((a, b) => b[1] - a[1]);

  const TOP_N = 4;
  const topRoles = rankedRoles.slice(0, TOP_N);
  const otherCount = rankedRoles.slice(TOP_N).reduce((sum, [, count]) => sum + count, 0);
  const total = applications.length || 1; // avoid /0 when there's nothing yet

  const rolesChart = [
    ...topRoles.map(([label, count]) => ({
      label, count, percent: Math.round((count / total) * 1000) / 10,
    })),
    ...(otherCount > 0
      ? [{ label: 'Other', count: otherCount, percent: Math.round((otherCount / total) * 1000) / 10 }]
      : []),
  ];

  /* ── Recent applications (top 5, already sorted newest-first) ── */
  const recentApplications = applications.slice(0, 5).map((a) => ({
    id: a.id, company: a.company, logo: a.logo, role: a.role,
    status: a.statusBucket, date: formatTimeAgo(a.appliedAt),
  }));

  /* ── Upcoming schedule: active (non-terminal) applications, most
     recently updated first — hired/rejected are resolved, so excluded. */
  const upcomingSchedule = applications
    .filter((a) => UPCOMING_STAGE_COPY[a.status])
    .sort((a, b) => new Date(b.statusUpdatedAt) - new Date(a.statusUpdatedAt))
    .slice(0, 6)
    .map((a) => {
      const copy = UPCOMING_STAGE_COPY[a.status];
      const dateSource = copy.useAppliedAt ? a.appliedAt : a.statusUpdatedAt;
      return {
        id: a.id,
        company: a.company,
        role: a.role,
        stage: copy.stage,
        date: copy.useAppliedAt
          ? `Applied on ${new Date(dateSource).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
          : new Date(dateSource).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      };
    });

  return {
    totalApplications: applications.length,
    statusStats,
    rolesChart,
    recentApplications,
    upcomingSchedule,
    // Full list (bucketed + newest-first) so the frontend's status-card
    // click-through modal can filter client-side without another call.
    applications: applications.map((a) => ({
      id: a.id, company: a.company, logo: a.logo, role: a.role,
      status: a.statusBucket, rawStatus: a.status, date: formatTimeAgo(a.appliedAt),
    })),
  };
};

module.exports = { getDashboard, getCandidateInsights };