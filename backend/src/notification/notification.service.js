/**
 * src/notification/notification.service.js
 *
 * Generic read/write helpers (list/markRead/markAllRead/unreadCount) plus
 * a set of small factory functions — one per real-world event — that the
 * rest of the app calls from wherever that event actually happens
 * (job.service.js, candidate.controller.js, etc.). Keeping the factories
 * here means every other module just calls e.g.
 * `notifyApplicationSubmitted({...})` without knowing about categories,
 * icons, or colors.
 *
 * Every create*() helper is fire-and-forget from the caller's point of
 * view: it never throws past this file. A notification failing to save
 * should never break the actual action (applying to a job, viewing a
 * profile, etc.), so every factory wraps its write in try/catch and just
 * logs on failure.
 */

const Notification = require('./notification.model');

/* ── Generic CRUD ─────────────────────────────────── */

const list = async (recipientId, { category, page = 1, limit = 30 } = {}) => {
  const query = { recipientId };
  if (category && category !== 'All') query.category = category;

  const pageNum  = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 30));

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipientId, read: false }),
  ]);

  return {
    notifications: items.map((n) => n.toPublic()),
    unreadCount,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.max(1, Math.ceil(total / limitNum)) },
  };
};

const getUnreadCount = async (recipientId) =>
  Notification.countDocuments({ recipientId, read: false });

const markRead = async (recipientId, notificationId) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: notificationId, recipientId },
    { $set: { read: true } },
    { new: true }
  );
  return notif ? notif.toPublic() : null;
};

const markAllRead = async (recipientId) => {
  await Notification.updateMany({ recipientId, read: false }, { $set: { read: true } });
  return { unreadCount: 0 };
};

/* ── Internal write helper ───────────────────────────
   Every factory below funnels through this so failures are swallowed
   uniformly and never bubble up into the caller's request. */
const safeCreate = async (payload) => {
  try {
    return await Notification.create(payload);
  } catch (err) {
    console.error('[Notifications] failed to create:', err.message);
    return null;
  }
};

/* ══════════════════════════════════════════════════
   CANDIDATE-FACING EVENTS
══════════════════════════════════════════════════ */

/**
 * 1. Company moves the candidate to a new pipeline stage
 *    (shortlisted / rejected / interview / hired / reviewed).
 */
const STATUS_COPY = {
  reviewed: {
    icon: 'clock', color: 'orange', category: 'Job Applications',
    title: (job, company) => `Your application for ${job} at ${company} is under review`,
    detail: () => "We'll update you as soon as there's progress.",
  },
  shortlisted: {
    icon: 'briefcase', color: 'emerald', category: 'Job Applications',
    title: (job, company) => `Your application for ${job} at ${company} has been shortlisted!`,
    detail: () => 'Great job! The recruiter will contact you soon.',
  },
  interview: {
    icon: 'clock', color: 'purple', category: 'Job Applications',
    title: (job, company) => `You've been moved to the interview round for ${job} at ${company}`,
    detail: () => 'Keep an eye on your email for scheduling details.',
  },
  hired: {
    icon: 'star', color: 'yellow', category: 'Achievements',
    title: (job, company) => `Congratulations! You've been hired for ${job} at ${company}`,
    detail: () => 'Wishing you the best in your new role.',
    badgeText: 'Hired',
  },
  rejected: {
    icon: 'briefcase', color: 'orange', category: 'Job Applications',
    title: (job, company) => `Your application for ${job} at ${company} was not successful this time`,
    detail: () => "Don't be discouraged — new roles matching your profile are added regularly.",
  },
};

const notifyApplicationStatusChanged = async ({ candidateId, jobId, jobTitle, companyName, status }) => {
  const copy = STATUS_COPY[status];
  if (!copy) return null; // e.g. 'new' — nothing to announce
  const job = jobTitle || 'a job';
  const company = companyName || 'a company';

  return safeCreate({
    recipientId: candidateId,
    jobId,
    type:      'application_status',
    category:  copy.category,
    title:     copy.title(job, company),
    detail:    copy.detail(),
    icon:      copy.icon,
    color:     copy.color,
    badgeText: copy.badgeText || null,
    link:      `/jobs?applicationId=${jobId}`,
  });
};

/** 2. A company views the candidate's profile (e.g. via applicant pipeline
 *     or the candidate discovery page). Debounced so repeated refreshes
 *     by the same company on the same day don't spam the candidate. */
const notifyProfileViewed = async ({ candidateId, viewerCompanyId, companyName }) => {
  if (String(candidateId) === String(viewerCompanyId)) return null; // no self-notify

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await Notification.findOne({
    recipientId: candidateId,
    type: 'profile_view',
    actorId: viewerCompanyId,
    createdAt: { $gte: since },
  });
  if (recent) return null; // already notified about this viewer today

  return safeCreate({
    recipientId: candidateId,
    actorId:  viewerCompanyId,
    type:     'profile_view',
    category: 'Profile Activity',
    title:    `${companyName || 'A company'} viewed your profile`,
    detail:   'Recruiters who view your profile may reach out about opportunities.',
    icon:     'eye',
    color:    'indigo',
    link:     '/profile',
  });
};

/** 3. Candidate successfully applies to a job. */
const notifyApplicationSubmitted = async ({ candidateId, jobId, jobTitle, companyName }) => {
  return safeCreate({
    recipientId: candidateId,
    jobId,
    type:     'application_submitted',
    category: 'Job Applications',
    title:    `You applied to ${jobTitle || 'a job'} at ${companyName || 'a company'}`,
    detail:   'Your application has been submitted successfully.',
    icon:     'briefcase',
    color:    'cyan',
    link:     `/jobs?applicationId=${jobId}`,
  });
};

/* ══════════════════════════════════════════════════
   COMPANY-FACING EVENTS
══════════════════════════════════════════════════ */

/** A candidate applies to one of the company's jobs. */
const notifyNewApplicant = async ({ companyId, candidateId, candidateName, jobId, jobTitle }) => {
  return safeCreate({
    recipientId: companyId,
    actorId: candidateId,
    jobId,
    type:     'new_application',
    category: 'Job Applications',
    title:    `${candidateName || 'A candidate'} applied to ${jobTitle || 'your job posting'}`,
    detail:   'Review their profile and resume in the applicant pipeline.',
    icon:     'person',
    color:    'indigo',
    link:     `/company/jobs/${jobId}/applicants`,
  });
};

/** A job posting's application deadline is approaching / it was published —
 *  kept generic so it's easy to call from job.service.js as new lifecycle
 *  events are added later. */
const notifyJobPublished = async ({ companyId, jobId, jobTitle }) => {
  return safeCreate({
    recipientId: companyId,
    jobId,
    type:     'job_published',
    category: 'System',
    title:    `${jobTitle || 'Your job posting'} is now live`,
    detail:   'Candidates can now discover and apply to this listing.',
    icon:     'search',
    color:    'cyan',
    link:     `/company/jobs/${jobId}`,
  });
};

module.exports = {
  list,
  getUnreadCount,
  markRead,
  markAllRead,
  notifyApplicationStatusChanged,
  notifyProfileViewed,
  notifyApplicationSubmitted,
  notifyNewApplicant,
  notifyJobPublished,
};