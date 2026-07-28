/**
 * src/job/job.service.js
 *
 * A job is created and edited as a 'draft' with no required fields —
 * candidates never see it, so it can be as incomplete as the company
 * wants while they're mid-edit. The moment `status` is set to 'active'
 * (via create or update), validateForPublish() runs and the job must
 * be fully filled out. This mirrors exactly what the frontend wizard
 * already checks client-side, just re-asserted server-side so the API
 * can't be used to publish an incomplete listing directly.
 */

const AppError = require('../utils/AppError');
const Job      = require('./job.model');
const Profile  = require('../profile/profile.model');
const User     = require('../user/user.model');
const { getJsonCompletion } = require('../utils/gemini');

const EDITABLE_FIELDS = [
  'title', 'department', 'jobCategory', 'employmentType',
  'workplaceType', 'city', 'state', 'country',
  'jobSummary', 'responsibilities', 'requirements', 'preferredSkills',
  'skills',
  'minExperience', 'maxExperience', 'educationLevel',
  'salaryType',
  'openings', 'applicationDeadline', 'joiningDate',
  'perks',
];

/* ── helpers ─────────────────────────────────────── */

const pickFields = (body) => {
  const update = {};
  for (const key of EDITABLE_FIELDS) {
    if (body[key] !== undefined) update[key] = body[key];
  }
  if (update.minExperience !== undefined) {
    update.minExperience = update.minExperience === '' ? null : Number(update.minExperience);
  }
  if (update.maxExperience !== undefined) {
    update.maxExperience = update.maxExperience === '' ? null : Number(update.maxExperience);
  }
  if (update.applicationDeadline === '') update.applicationDeadline = null;
  if (update.joiningDate === '') update.joiningDate = null;
  return update;
};

// minSalary / maxSalary / currency arrive flat from the frontend form
// and get folded into the nested `salary` subdocument here.
const buildSalary = (body, existing) => {
  if (body.minSalary === undefined && body.maxSalary === undefined && body.currency === undefined) {
    return existing || { min: null, max: null, currency: 'INR' };
  }
  return {
    min:      body.minSalary !== undefined && body.minSalary !== '' ? Number(body.minSalary) : (existing?.min ?? null),
    max:      body.maxSalary !== undefined && body.maxSalary !== '' ? Number(body.maxSalary) : (existing?.max ?? null),
    currency: body.currency || existing?.currency || 'INR',
  };
};

// Multer (upload.fields) hands us `req.files = { jobDescriptionPdf: [file], companyBrochurePdf: [file] }`.
// Only the fields that actually arrived with a new file get overwritten —
// re-saving a job without re-uploading keeps whatever was there before.
const buildAttachments = (files, existing) => {
  const attachments = {
    jobDescriptionPdf:  existing?.jobDescriptionPdf  || { url: null, originalName: null },
    companyBrochurePdf: existing?.companyBrochurePdf || { url: null, originalName: null },
  };

  if (files?.jobDescriptionPdf?.[0]) {
    const f = files.jobDescriptionPdf[0];
    attachments.jobDescriptionPdf = { url: `/uploads/jobs/${f.filename}`, originalName: f.originalname };
  }
  if (files?.companyBrochurePdf?.[0]) {
    const f = files.companyBrochurePdf[0];
    attachments.companyBrochurePdf = { url: `/uploads/jobs/${f.filename}`, originalName: f.originalname };
  }

  return attachments;
};

const validateForPublish = (data) => {
  if (!data.title?.trim())        throw new AppError('Job title is required.', 400);
  if (!data.jobCategory?.trim())  throw new AppError('Job category is required.', 400);
  if (!data.employmentType)       throw new AppError('Employment type is required.', 400);
  if (!data.workplaceType)        throw new AppError('Work mode is required.', 400);
  if (!data.country?.trim())      throw new AppError('Country is required.', 400);
  if (!data.jobSummary?.trim())       throw new AppError('A job summary is required.', 400);
  if (!data.responsibilities?.trim()) throw new AppError('Responsibilities are required.', 400);
  if (!data.requirements?.trim())     throw new AppError('Requirements / qualifications are required.', 400);
  if (!data.skills?.length)
    throw new AppError('At least one required skill is needed.', 400);
  if (!data.openings || data.openings < 1)
    throw new AppError('Number of openings is required.', 400);
  if (!data.applicationDeadline)
    throw new AppError('An application deadline is required.', 400);
  if (data.salary?.min == null || data.salary?.max == null)
    throw new AppError('Salary range is required.', 400);
};

/* ── service methods ─────────────────────────────── */

const listForCompany = async (companyId, status) => {
  const query = { companyId };
  if (status) query.status = status;
  const jobs = await Job.find(query).sort({ updatedAt: -1 });
  return jobs.map((j) => j.toPublic());
};

const getOne = async (companyId, jobId) => {
  const job = await Job.findOne({ _id: jobId, companyId }).catch(() => null);
  if (!job) throw new AppError('Job not found.', 404);
  return job.toPublic();
};

const create = async (companyId, body, files) => {
  const fields = pickFields(body);
  fields.salary = buildSalary(body, null);
  fields.attachments = buildAttachments(files, null);

  const status = body.status === 'active' ? 'active' : 'draft';
  if (status === 'active') validateForPublish(fields);

  const job = await Job.create({
    ...fields,
    companyId,
    status,
    publishedAt: status === 'active' ? new Date() : null,
  });

  return job.toPublic();
};

const update = async (companyId, jobId, body, files) => {
  const job = await Job.findOne({ _id: jobId, companyId }).catch(() => null);
  if (!job) throw new AppError('Job not found.', 404);

  const fields = pickFields(body);
  Object.assign(job, fields);
  job.salary = buildSalary(body, job.salary);
  job.attachments = buildAttachments(files, job.attachments);

  const wasActive  = job.status === 'active';
  const nextStatus = ['draft', 'active', 'closed'].includes(body.status) ? body.status : job.status;

  if (nextStatus === 'active') {
    validateForPublish(job.toObject());
    if (!wasActive) job.publishedAt = new Date();
  }
  job.status = nextStatus;

  await job.save();
  return job.toPublic();
};

const remove = async (companyId, jobId) => {
  const result = await Job.findOneAndDelete({ _id: jobId, companyId });
  if (!result) throw new AppError('Job not found.', 404);
};

/* ══════════════════════════════════════════════════
   CANDIDATE-FACING
══════════════════════════════════════════════════ */

/**
 * GET /api/jobs/public — search + browse every active listing.
 * query: q (role/company/skill text), employmentType, workplaceType, location
 */
const listPublic = async (candidateId, query = {}) => {
  const filter = { status: 'active' };

  if (query.employmentType) filter.employmentType = query.employmentType;
  if (query.workplaceType)  filter.workplaceType  = query.workplaceType;

  const q = (query.q || '').trim();
  const loc = (query.location || '').trim();
  const andClauses = [];

  if (loc) {
    andClauses.push({
      $or: [
        { city:    { $regex: loc, $options: 'i' } },
        { state:   { $regex: loc, $options: 'i' } },
        { country: { $regex: loc, $options: 'i' } },
        { workplaceType: { $regex: loc, $options: 'i' } },
      ],
    });
  }
  if (q) {
    const rx = { $regex: q, $options: 'i' };
    andClauses.push({ $or: [{ title: rx }, { jobCategory: rx }, { department: rx }, { skills: rx }] });
  }
  if (andClauses.length) filter.$and = andClauses;

  const jobs = await Job.find(filter)
    .sort({ publishedAt: -1 })
    .populate('companyId', 'companyName photoURL socialLinks');

  return jobs.map((j) => j.toCandidateView(candidateId));
};

/* GET /api/jobs/public/:id */
const getPublicOne = async (candidateId, jobId) => {
  const job = await Job.findById(jobId)
    .populate('companyId', 'companyName photoURL socialLinks')
    .catch(() => null);

  if (!job) throw new AppError('Job not found.', 404);

  // Candidates may only ever view active jobs, unless they already
  // applied (so it stays visible under "My applications" even after
  // the company closes it or the deadline passes).
  const alreadyApplied = job.applications.some((a) => String(a.candidateId) === String(candidateId));
  if (job.status !== 'active' && !alreadyApplied) {
    throw new AppError('This job is no longer available.', 404);
  }

  return job.toCandidateView(candidateId);
};

/* POST /api/jobs/:id/apply */
const applyToJob = async (candidate, jobId, body, file) => {
  const job = await Job.findById(jobId).catch(() => null);
  if (!job) throw new AppError('Job not found.', 404);

  if (job.status !== 'active')
    throw new AppError('This job is not currently accepting applications.', 400);

  if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date())
    throw new AppError('The application deadline for this job has passed.', 400);

  if (job.applications.some((a) => String(a.candidateId) === String(candidate._id)))
    throw new AppError('You have already applied to this job.', 409);

  if (!candidate.profileCompleted)
    throw new AppError('Please complete the required fields in your profile before applying.', 400);

  const shareProfile = body.shareProfileAsResume === true || body.shareProfileAsResume === 'true';

  let resumeSource, resumeUrl, resumeName;
  if (file) {
    resumeSource = 'upload';
    resumeUrl    = `/uploads/resumes/${file.filename}`;
    resumeName   = file.originalname;
  } else if (shareProfile) {
    resumeSource = 'profile';
    resumeUrl    = null;
    resumeName   = null;
  } else {
    throw new AppError('Upload a resume or consent to share your profile as your resume.', 400);
  }

  if (body.consent !== true && body.consent !== 'true')
    throw new AppError('You must confirm and consent before submitting your application.', 400);

  job.applications.push({
    candidateId:   candidate._id,
    phone:         body.phone || '',
    relocate:      body.relocate || null,
    noticePeriod:  body.noticePeriod || '',
    pitch:         body.pitch || '',
    topChoice:     body.topChoice === true || body.topChoice === 'true',
    followCompany: body.followCompany === true || body.followCompany === 'true',
    resumeSource,
    resumeUrl,
    resumeName,
  });
  job.applicantsCount = job.applications.length;

  await job.save();
  return job.toCandidateView(candidate._id);
};

/* GET /api/jobs/applications/mine */
const listMyApplications = async (candidateId) => {
  const jobs = await Job.find({ 'applications.candidateId': candidateId })
    .populate('companyId', 'companyName photoURL socialLinks')
    .sort({ updatedAt: -1 });

  return jobs.map((j) => j.toCandidateView(candidateId));
};

/* ══════════════════════════════════════════════════
   CANDIDATE-FACING — BOOKMARKS
   Persisted on User.bookmarkedJobs instead of component state, so a
   bookmark survives page refreshes/new sessions. ══════════════════════════════════════════════════ */

/* POST /api/jobs/:id/bookmark — toggles bookmark state, returns the new state */
const toggleBookmark = async (candidateId, jobId) => {
  const job = await Job.findById(jobId).catch(() => null);
  if (!job) throw new AppError('Job not found.', 404);

  const user = await User.findById(candidateId);
  if (!user) throw new AppError('User not found.', 404);

  const alreadyBookmarked = user.bookmarkedJobs.some((id) => String(id) === String(jobId));

  if (alreadyBookmarked) {
    user.bookmarkedJobs = user.bookmarkedJobs.filter((id) => String(id) !== String(jobId));
  } else {
    user.bookmarkedJobs.push(jobId);
  }

  await user.save();

  return { jobId: String(jobId), bookmarked: !alreadyBookmarked };
};

/* GET /api/jobs/bookmarked — full job objects for every bookmarked listing */
const listBookmarked = async (candidateId) => {
  const user = await User.findById(candidateId).select('bookmarkedJobs');
  if (!user || !user.bookmarkedJobs.length) return [];

  const jobs = await Job.find({ _id: { $in: user.bookmarkedJobs } })
    .populate('companyId', 'companyName photoURL socialLinks')
    .sort({ updatedAt: -1 });

  // A bookmarked job may since have been deleted by the company — those
  // simply won't come back from the $in query above, so nothing extra
  // to filter out here.
  return jobs.map((j) => j.toCandidateView(candidateId));
};

/* ══════════════════════════════════════════════════
   CANDIDATE-FACING — RECOMMENDATIONS
══════════════════════════════════════════════════ */

const RECOMMEND_COUNT      = 3;
// How many recent active listings we hand to Gemini per request — keeps
// the prompt small and fast rather than shipping every open job in the DB.
const RECOMMEND_POOL_SIZE  = 25;

const RECOMMEND_SYSTEM_PROMPT = `You are a job-matching engine for SkillSphere, a career platform.

You will receive a JSON object with:
- "candidate": a summary of the candidate's title, location, skills, recent experience and projects.
- "jobs": a list of currently open job listings, each with an "id".

Pick up to ${RECOMMEND_COUNT} listings from "jobs" that are the BEST fit for this candidate, ranked from best to worst match. Base the ranking on overlapping skills, relevant title/experience, and category/domain alignment — not just recency.

Rules:
- Only use "id" values that appear in the provided "jobs" list. Never invent an id.
- If fewer than ${RECOMMEND_COUNT} jobs are a reasonable fit, return fewer rather than padding with weak matches.
- Return ONLY valid JSON, no markdown, no explanation, in exactly this shape:
{ "recommendedJobIds": ["<id>", "<id>", "<id>"] }`;

/**
 * Reduces a full profile document down to the handful of signals that
 * actually matter for matching, so we're not shipping resume-length text
 * (bios, coursework, full descriptions) to the model on every dashboard load.
 */
const buildCandidateSummary = (profile) => ({
  title:    profile.personal?.title    || '',
  location: profile.personal?.location || '',
  skills: [
    ...(profile.skills?.languages  || []),
    ...(profile.skills?.frameworks || []),
    ...(profile.skills?.tools      || []),
    ...(profile.skills?.libraries  || []),
  ].filter((s) => s?.trim()),
  recentExperience: (profile.experiences || [])
    .filter((e) => e?.title?.trim())
    .slice(0, 2)
    .map((e) => `${e.title} at ${e.company || 'a company'}`),
  projects: (profile.projects || [])
    .filter((p) => p?.name?.trim())
    .slice(0, 3)
    .map((p) => `${p.name}${p.tech ? ` (${p.tech})` : ''}`),
});

const buildJobSummaries = (jobs) => jobs.map((j) => ({
  id:             String(j._id),
  title:          j.title,
  company:        j.companyId?.companyName || 'Company',
  category:       j.jobCategory,
  employmentType: j.employmentType,
  workplaceType:  j.workplaceType,
  skills:         j.skills,
  summary:        (j.jobSummary || '').slice(0, 200),
}));

/**
 * Asks Gemini to rank the given job pool against the candidate summary
 * and returns an ordered array of job IDs (best match first). Throws if
 * Gemini is unreachable/misconfigured or returns something unusable —
 * the caller (listRecommended) is responsible for falling back gracefully.
 */
const getGeminiJobRanking = async (profile, jobs) => {
  const messages = [
    { role: 'system', content: RECOMMEND_SYSTEM_PROMPT },
    {
      role: 'user',
      content: JSON.stringify({
        candidate: buildCandidateSummary(profile),
        jobs:      buildJobSummaries(jobs),
      }),
    },
  ];

  const data = await getJsonCompletion(messages);
  if (!Array.isArray(data.recommendedJobIds)) {
    throw new Error('Gemini response missing recommendedJobIds array.');
  }
  return data.recommendedJobIds.slice(0, RECOMMEND_COUNT);
};

/**
 * GET /api/jobs/recommended
 *
 * Pulls the most recent active jobs the candidate hasn't already applied
 * to, asks Gemini to rank the best-fitting few against the candidate's
 * skills/profile, and returns the top matches in the same shape as every
 * other candidate-facing job list (toCandidateView).
 *
 * Soft-fails by design, same philosophy as github.controller.js: a
 * missing profile, no skills yet, a missing GEMINI_API_KEY, or an
 * upstream Gemini error should never break the dashboard — they just
 * fall back to the newest open listings instead of an error banner.
 */
const listRecommended = async (candidateId) => {
  const profile = await Profile.findOne({ userId: candidateId }).lean();

  const pool = await Job.find({
    status: 'active',
    'applications.candidateId': { $ne: candidateId },
  })
    .sort({ publishedAt: -1 })
    .limit(RECOMMEND_POOL_SIZE)
    .populate('companyId', 'companyName photoURL socialLinks');

  if (!pool.length) return [];

  const newestFallback = () => pool.slice(0, RECOMMEND_COUNT).map((j) => j.toCandidateView(candidateId));

  const hasSignal = !!(
    profile?.skills?.languages?.length  ||
    profile?.skills?.frameworks?.length ||
    profile?.skills?.tools?.length      ||
    profile?.skills?.libraries?.length  ||
    profile?.personal?.title?.trim()
  );
  // No profile signal yet to personalize against — newest listings are
  // a more honest "recommendation" than an LLM guessing from nothing.
  if (!hasSignal) return newestFallback();

  try {
    const rankedIds = await getGeminiJobRanking(profile, pool);

    const byId = new Map(pool.map((j) => [String(j._id), j]));
    const ranked = rankedIds.map((id) => byId.get(String(id))).filter(Boolean);

    // Gemini returned bad/duplicate/too-few ids — top up with the newest
    // remaining jobs so the row is never sparser than it needs to be.
    const seen = new Set(ranked.map((j) => String(j._id)));
    for (const job of pool) {
      if (ranked.length >= RECOMMEND_COUNT) break;
      if (!seen.has(String(job._id))) {
        ranked.push(job);
        seen.add(String(job._id));
      }
    }

    return ranked.slice(0, RECOMMEND_COUNT).map((j) => j.toCandidateView(candidateId));
  } catch (err) {
    console.error('[Jobs] Gemini recommendation failed, falling back to newest listings:', err.message);
    return newestFallback();
  }
};

/* ══════════════════════════════════════════════════
   COMPANY-FACING — APPLICANT PIPELINE
══════════════════════════════════════════════════ */

// Forward order of the hiring pipeline. 'rejected' is intentionally left
// out — it's reachable from any of these stages, not a step within them.
const ROUND_ORDER = ['new', 'reviewed', 'shortlisted', 'interview', 'hired'];
const APPLICATION_STATUSES = [...ROUND_ORDER, 'rejected'];

/**
 * GET /api/jobs/:id/applicants
 * Returns the job's key details plus every applicant, enriched with the
 * candidate's name/email/photo (populated from User — the raw application
 * subdocument only stores candidateId). Newest applications first.
 */
const listApplicants = async (companyId, jobId) => {
  const job = await Job.findOne({ _id: jobId, companyId })
    .populate('applications.candidateId', 'fullName email photoURL')
    .catch(() => null);
  if (!job) throw new AppError('Job not found.', 404);

  const applicants = job.applications
    .slice()
    .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
    .map((a) => ({
      candidateId:    a.candidateId?._id || a.candidateId,
      name:           a.candidateId?.fullName || 'Candidate',
      email:          a.candidateId?.email || '',
      photoURL:       a.candidateId?.photoURL || null,
      status:         a.status,
      statusUpdatedAt: a.statusUpdatedAt,
      appliedAt:      a.appliedAt,
      phone:          a.phone,
      relocate:       a.relocate,
      noticePeriod:   a.noticePeriod,
      pitch:          a.pitch,
      topChoice:      a.topChoice,
      followCompany:  a.followCompany,
      resumeSource:   a.resumeSource,
      resumeUrl:      a.resumeUrl,
      resumeName:     a.resumeName,
    }));

  return {
    job: {
      id:                  job._id,
      title:               job.title,
      status:              job.status,
      employmentType:      job.employmentType,
      workplaceType:       job.workplaceType,
      city:                job.city,
      state:               job.state,
      country:             job.country,
      publishedAt:         job.publishedAt,
      applicationDeadline: job.applicationDeadline,
      applicantsCount:     job.applicantsCount,
    },
    applicants,
  };
};

/**
 * GET /api/jobs/:id/applicants/:candidateId/profile
 * Only ever callable by the company that owns the job, and only for a
 * candidate who actually applied to it with resumeSource: 'profile' —
 * this is what powers the eye icon when the candidate shared their
 * SkillSphere profile instead of uploading a resume file.
 */
const getApplicantProfile = async (companyId, jobId, candidateId) => {
  const job = await Job.findOne({ _id: jobId, companyId }).catch(() => null);
  if (!job) throw new AppError('Job not found.', 404);

  const application = job.applications.find((a) => String(a.candidateId) === String(candidateId));
  if (!application) throw new AppError('Applicant not found for this job.', 404);
  if (application.resumeSource !== 'profile')
    throw new AppError('This applicant submitted a resume file, not a shared profile.', 400);

  const profile = await Profile.findOne({ userId: candidateId }).lean();
  if (!profile) throw new AppError('Candidate profile not found.', 404);
  return profile;
};

/**
 * PATCH /api/jobs/:id/applicants/:candidateId/status
 * Moves an applicant to a new pipeline stage (or rejects them). No
 * forward-only enforcement server-side — a company might need to walk a
 * status back after a mis-click — the ROUND_ORDER is only used to compute
 * "next round" on the frontend/here for the button label.
 */
const updateApplicantStatus = async (companyId, jobId, candidateId, status) => {
  if (!APPLICATION_STATUSES.includes(status))
    throw new AppError('Invalid application status.', 400);

  const job = await Job.findOne({ _id: jobId, companyId }).catch(() => null);
  if (!job) throw new AppError('Job not found.', 404);

  const application = job.applications.find((a) => String(a.candidateId) === String(candidateId));
  if (!application) throw new AppError('Applicant not found for this job.', 404);

  application.status = status;
  application.statusUpdatedAt = new Date();
  await job.save();

  return { candidateId, status: application.status, statusUpdatedAt: application.statusUpdatedAt };
};

module.exports = {
  listForCompany, getOne, create, update, remove,
  listPublic, getPublicOne, applyToJob, listMyApplications,
  listRecommended, toggleBookmark, listBookmarked,
  listApplicants, getApplicantProfile, updateApplicantStatus, ROUND_ORDER,
};