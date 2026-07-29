/**
 * src/job/job.model.js
 *
 * One document per job posting. Always owned by a `companyId` (a User
 * with role 'company'). A job lives in one of three states:
 *   - draft  : being edited, not visible to candidates
 *   - active : published, visible to candidates, accepting applications
 *   - closed : no longer accepting applications, kept for records
 */

const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema(
  {
    url:          { type: String, default: null },
    originalName: { type: String, default: null },
  },
  { _id: false }
);

/**
 * One entry per candidate who has applied. Lives inside the job so
 * "already applied" / "applicant count" / deadline checks never need a
 * second collection. Candidate-facing responses never see this array
 * directly (see job.service.js) — only whether *this* candidate is in it.
 */
const ApplicationSchema = new mongoose.Schema(
  {
    candidateId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appliedAt:     { type: Date, default: Date.now },

    /* Hiring-pipeline stage. Rounds progress in order (see ROUND_ORDER in
       job.service.js); 'rejected' is reachable from any active stage and
       'hired' is the terminal success state. */
    status: {
      type: String,
      enum: ['new', 'reviewed', 'shortlisted', 'interview', 'hired', 'rejected'],
      default: 'new',
    },
    statusUpdatedAt: { type: Date, default: null },

    /* Employer-question answers, mirrors the apply form */
    phone:         { type: String, default: '' },
    relocate:      { type: String, enum: ['yes', 'no', null], default: null },
    noticePeriod:  { type: String, default: '' },
    pitch:         { type: String, default: '' },
    topChoice:     { type: Boolean, default: false },
    followCompany: { type: Boolean, default: false },

    /* Resume: either the candidate's SkillSphere profile (shared with
       consent) or a one-off uploaded file. */
    resumeSource: { type: String, enum: ['profile', 'upload'], required: true },
    resumeUrl:    { type: String, default: null },
    resumeName:   { type: String, default: null },
  },
  { _id: false }
);

const JobSchema = new mongoose.Schema(
  {
    companyId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    /* ── Basic information ── */
    title:          { type: String, default: '', trim: true },
    department:     { type: String, default: '', trim: true },
    jobCategory:    { type: String, default: '', trim: true },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
      default: 'Full-time',
    },

    /* ── Location ── */
    workplaceType: {
      type: String,
      enum: ['On-site', 'Hybrid', 'Remote'],
      default: 'Hybrid',
    },
    city:    { type: String, default: '', trim: true },
    state:   { type: String, default: '', trim: true },
    country: { type: String, default: '', trim: true },

    /* ── Job description (structured, plain text) ── */
    jobSummary:       { type: String, default: '', maxlength: 500 },
    responsibilities: { type: String, default: '', maxlength: 1000 },
    requirements:      { type: String, default: '', maxlength: 1000 },
    preferredSkills:   { type: String, default: '', maxlength: 500 },

    /* ── Skills ── */
    skills: { type: [String], default: [] },

    /* ── Experience & education ── */
    minExperience:  { type: Number, default: null },
    maxExperience:  { type: Number, default: null },
    educationLevel: {
      type: String,
      enum: [
        'No strict requirement',
        'High School or equivalent',
        "Bachelor's Degree",
        "Master's Degree",
        'PhD or equivalent',
      ],
      default: 'No strict requirement',
    },

    /* ── Salary ── */
    salaryType: {
      type: String,
      enum: ['Annual', 'Monthly', 'Hourly', 'Weekly'],
      default: 'Annual',
    },
    salary: {
      min:      { type: Number, default: null },
      max:      { type: Number, default: null },
      currency: { type: String, enum: ['USD', 'EUR', 'GBP', 'INR', 'AUD'], default: 'INR' },
    },

    /* ── Hiring details ── */
    openings:            { type: Number, default: 1, min: 1 },
    applicationDeadline: { type: Date, default: null },
    joiningDate:         { type: Date, default: null },

    /* ── Benefits (fixed checklist items + freeform "other" entries,
       all flattened into one list of strings) ── */
    perks: { type: [String], default: [] },

    /* ── Attachments (optional PDFs) ── */
    attachments: {
      jobDescriptionPdf:  { type: AttachmentSchema, default: () => ({}) },
      companyBrochurePdf: { type: AttachmentSchema, default: () => ({}) },
    },

    /* ── Lifecycle ── */
    status:      { type: String, enum: ['draft', 'active', 'closed'], default: 'draft', index: true },
    publishedAt: { type: Date, default: null },

    applicantsCount: { type: Number, default: 0 },

    /* ── Applications (candidate side) ── */
    applications: { type: [ApplicationSchema], default: [] },
  },
  { timestamps: true }
);

JobSchema.index({ title: 'text', jobCategory: 'text', department: 'text', skills: 'text' });

/**
 * Shapes a job document for API responses: `_id` -> `id`, `__v` stripped.
 * Mirrors the toPublic() convention used on the User model.
 */
JobSchema.methods.toPublic = function () {
  const { _id, __v, ...rest } = this.toObject();
  return { id: _id, ...rest };
};

/**
 * Candidate-facing shape: never leaks the full `applications` list (other
 * candidates' phone numbers, pitches, etc.) — only whether the requesting
 * candidate has applied, plus deadline/company info useful to them.
 */
JobSchema.methods.toCandidateView = function (candidateId) {
  const { _id, __v, applications, companyId, ...rest } = this.toObject();

  const mine = candidateId
    ? applications.find((a) => String(a.candidateId) === String(candidateId))
    : null;

  const isExpired = !!(this.applicationDeadline && new Date(this.applicationDeadline) < new Date());

  return {
    id: _id,
    ...rest,
    company: companyId && typeof companyId === 'object'
      ? {
          id:          companyId._id,
          name:        companyId.companyName || 'Company',
          logoUrl:     companyId.photoURL || null,
          socialLinks: companyId.socialLinks || {},
        }
      : { id: companyId, name: 'Company', logoUrl: null, socialLinks: {} },
    isExpired,
    hasApplied: !!mine,
    myApplication: mine || null,
  };
};

module.exports = mongoose.model('Job', JobSchema);