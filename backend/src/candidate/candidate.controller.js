/**
 * src/candidate/candidate.controller.js
 *
 * Company-facing candidate discovery.
 * Only surfaces candidates who have BOTH:
 *   - profile.isComplete === true   (finished the profile builder)
 *   - profile.consent.recruiter === true  (opted in to being visible
 *     to recruiters — set on final submit in the profile builder)
 * This mirrors the existing `consent` field already on Profile, so no
 * schema change is needed and candidates keep control over visibility.
 */
const Profile  = require('../profile/profile.model');
const User     = require('../user/user.model');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

/* ── Helpers ─────────────────────────────────────── */

// Dates are stored as "YYYY-MM" strings (see MonthYearPicker). Returns
// a comparable Date or null if unparseable/empty.
const parseYearMonth = (str) => {
  if (!str || typeof str !== 'string') return null;
  const match = str.trim().match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, 1);
};

// Sums up all experience entries into a total years figure (handles
// overlapping/ongoing roles reasonably — this is a discovery-list
// summary stat, not a precise HR calculation).
const computeExperienceYears = (experiences = []) => {
  const now = new Date();
  let totalMonths = 0;

  experiences.forEach((exp) => {
    const start = parseYearMonth(exp.startDate);
    if (!start) return;
    const end = exp.current ? now : (parseYearMonth(exp.endDate) || now);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (months > 0) totalMonths += months;
  });

  return Math.round((totalMonths / 12) * 10) / 10; // one decimal place
};

const flattenSkills = (skills = {}) => {
  const { languages = [], frameworks = [], tools = [], libraries = [] } = skills;
  return [...languages, ...frameworks, ...tools, ...libraries].filter(Boolean);
};

const experienceBucketMatches = (years, bucket) => {
  if (bucket === '0 - 1 years')  return years >= 0 && years < 1;
  if (bucket === '1 - 3 years')  return years >= 1 && years < 3;
  if (bucket === '3 - 5 years')  return years >= 3 && years < 5;
  if (bucket === '5+ years')     return years >= 5;
  return true;
};

/**
 * Shapes a Profile+User pair into the summary card shape the
 * Candidates list page renders.
 */
const toSummary = (profile, user, experienceYears) => {
  const skills = flattenSkills(profile.skills);
  return {
    id: String(user._id),
    name: profile.personal?.fullName || user.fullName || 'Unnamed Candidate',
    role: profile.personal?.title || '',
    avatar: profile.personal?.photoUrl || user.photoURL || null,
    location: profile.personal?.location || '',
    skills,
    experience: experienceYears,
    verified: !!user.isVerified,
    linkedin: profile.personal?.linkedin || '',
    github: profile.personal?.github || '',
    email: profile.personal?.email || user.email,
    joinedAt: user.createdAt,
    updatedAt: profile.updatedAt,
  };
};

/* ── GET /api/candidates ── */
const listCandidates = async (req, res, next) => {
  try {
    const {
      search = '',
      skills = '',
      location = '',
      experience = '',   // comma-separated bucket labels
      sortBy = 'Recently Joined',
      page = 1,
      limit = 10,
    } = req.query;

    const skillList    = skills.split(',').map((s) => s.trim()).filter(Boolean);
    const locationList = location.split(',').map((s) => s.trim()).filter(Boolean);
    const expBuckets   = experience.split(',').map((s) => s.trim()).filter(Boolean);
    const pageNum   = Math.max(1, parseInt(page, 10) || 1);
    const limitNum  = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));

    // Base DB-level filter: only opted-in, complete profiles.
    const query = { isComplete: true, 'consent.recruiter': true };
    if (locationList.length) {
      query['personal.location'] = { $regex: locationList.join('|'), $options: 'i' };
    }
    if (skillList.length) {
      const skillRegexes = skillList.map((s) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
      query.$or = [
        { 'skills.languages':  { $in: skillRegexes } },
        { 'skills.frameworks': { $in: skillRegexes } },
        { 'skills.tools':      { $in: skillRegexes } },
        { 'skills.libraries':  { $in: skillRegexes } },
      ];
    }

    const profiles = await Profile.find(query)
      .populate('userId', 'fullName email photoURL isVerified isActive role createdAt')
      .lean();

    let candidates = profiles
      .filter((p) => p.userId && p.userId.role === 'candidate' && p.userId.isActive)
      .map((p) => ({ profile: p, user: p.userId, experienceYears: computeExperienceYears(p.experiences) }));

    // Free-text search across name / title / skills.
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      candidates = candidates.filter(({ profile, user }) => {
        const name  = (profile.personal?.fullName || user.fullName || '').toLowerCase();
        const title = (profile.personal?.title || '').toLowerCase();
        const skillsFlat = flattenSkills(profile.skills).join(' ').toLowerCase();
        return name.includes(q) || title.includes(q) || skillsFlat.includes(q);
      });
    }

    // Experience bucket filter.
    if (expBuckets.length) {
      candidates = candidates.filter(({ experienceYears }) =>
        expBuckets.some((bucket) => experienceBucketMatches(experienceYears, bucket))
      );
    }

    // Sort.
    candidates.sort((a, b) => {
      if (sortBy === 'Name (A-Z)') {
        const nameA = a.profile.personal?.fullName || a.user.fullName || '';
        const nameB = b.profile.personal?.fullName || b.user.fullName || '';
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'Highest Experience') return b.experienceYears - a.experienceYears;
      // Recently Joined (default)
      return new Date(b.user.createdAt) - new Date(a.user.createdAt);
    });

    const total = candidates.length;
    const start = (pageNum - 1) * limitNum;
    const pageItems = candidates.slice(start, start + limitNum);

    const results = pageItems.map(({ profile, user, experienceYears }) => toSummary(profile, user, experienceYears));

    sendSuccess(res, {
      data: {
        candidates: results,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.max(1, Math.ceil(total / limitNum)),
        },
      },
    });
  } catch (err) { next(err); }
};

/* ── GET /api/candidates/:id ── */
const getCandidateProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('fullName email photoURL isVerified isActive role createdAt');
    if (!user || user.role !== 'candidate' || !user.isActive) {
      return next(new AppError('Candidate not found.', 404));
    }

    const profile = await Profile.findOne({ userId: id }).lean();
    if (!profile || !profile.isComplete || !profile.consent?.recruiter) {
      return next(new AppError('This candidate\'s profile is not available to recruiters.', 404));
    }

    const experienceYears = computeExperienceYears(profile.experiences);

    sendSuccess(res, {
      data: {
        profile: {
          ...profile,
          experienceYears,
          user: {
            id:          String(user._id),
            email:       user.email,
            photoURL:    user.photoURL,
            isVerified:  user.isVerified,
            joinedAt:    user.createdAt,
          },
        },
      },
    });
  } catch (err) { next(err); }
};

module.exports = { listCandidates, getCandidateProfile };