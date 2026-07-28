/**
 * src/job/job.controller.js
 * req.user is already the company account, attached by authenticate().
 *
 * create/update are hit with multipart/form-data (so the two optional
 * PDF attachments can ride along): the JSON job fields arrive as a
 * single stringified `data` field, and files arrive on req.files via
 * the upload.fields() middleware in job.routes.js.
 */
const jobService      = require('./job.service');
const { sendSuccess } = require('../utils/response');
const AppError         = require('../utils/AppError');

const parseBody = (req) => {
  if (typeof req.body.data === 'string') {
    try {
      return JSON.parse(req.body.data);
    } catch {
      throw new AppError('Invalid job data payload.', 400);
    }
  }
  return req.body;
};

/* GET /api/jobs?status=draft|active|closed */
const listJobs = async (req, res, next) => {
  try {
    const jobs = await jobService.listForCompany(req.user._id, req.query.status);
    sendSuccess(res, { data: { jobs } });
  } catch (err) {
    next(err);
  }
};

/* GET /api/jobs/:id */
const getJob = async (req, res, next) => {
  try {
    const job = await jobService.getOne(req.user._id, req.params.id);
    sendSuccess(res, { data: { job } });
  } catch (err) {
    next(err);
  }
};

/* POST /api/jobs — body.status: 'draft' (default) | 'active' */
const createJob = async (req, res, next) => {
  try {
    const body = parseBody(req);
    const job = await jobService.create(req.user._id, body, req.files);
    sendSuccess(res, {
      statusCode: 201,
      message:    job.status === 'active' ? 'Job published successfully.' : 'Draft saved.',
      data:       { job },
    });
  } catch (err) {
    next(err);
  }
};

/* PATCH /api/jobs/:id — same body shape as create; status transitions here too */
const updateJob = async (req, res, next) => {
  try {
    const body = parseBody(req);
    const job = await jobService.update(req.user._id, req.params.id, body, req.files);
    sendSuccess(res, {
      message: job.status === 'active' ? 'Job published successfully.' : 'Job updated.',
      data:    { job },
    });
  } catch (err) {
    next(err);
  }
};

/* DELETE /api/jobs/:id */
const deleteJob = async (req, res, next) => {
  try {
    await jobService.remove(req.user._id, req.params.id);
    sendSuccess(res, { message: 'Job deleted.' });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════
   CANDIDATE-FACING
══════════════════════════════════════════════════ */

/* GET /api/jobs/public?q=&employmentType=&workplaceType=&location= */
const listPublicJobs = async (req, res, next) => {
  try {
    const jobs = await jobService.listPublic(req.user._id, req.query);
    sendSuccess(res, { data: { jobs } });
  } catch (err) {
    next(err);
  }
};

/* GET /api/jobs/public/:id */
const getPublicJob = async (req, res, next) => {
  try {
    const job = await jobService.getPublicOne(req.user._id, req.params.id);
    sendSuccess(res, { data: { job } });
  } catch (err) {
    next(err);
  }
};

/* POST /api/jobs/:id/apply — multipart, optional `resume` file */
const applyJob = async (req, res, next) => {
  try {
    const body = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
    const job  = await jobService.applyToJob(req.user, req.params.id, body, req.file);
    sendSuccess(res, { statusCode: 201, message: 'Application submitted successfully.', data: { job } });
  } catch (err) {
    next(err);
  }
};

/* GET /api/jobs/recommended */
const listRecommendedJobs = async (req, res, next) => {
  try {
    const jobs = await jobService.listRecommended(req.user._id);
    sendSuccess(res, { data: { jobs } });
  } catch (err) {
    next(err);
  }
};

/* GET /api/jobs/applications/mine */
const listMyApplications = async (req, res, next) => {
  try {
    const jobs = await jobService.listMyApplications(req.user._id);
    sendSuccess(res, { data: { jobs } });
  } catch (err) {
    next(err);
  }
};

/* POST /api/jobs/:id/bookmark — toggles on/off, persisted on the user doc */
const toggleBookmark = async (req, res, next) => {
  try {
    const result = await jobService.toggleBookmark(req.user._id, req.params.id);
    sendSuccess(res, {
      message: result.bookmarked ? 'Job bookmarked.' : 'Bookmark removed.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/* GET /api/jobs/bookmarked */
const listBookmarkedJobs = async (req, res, next) => {
  try {
    const jobs = await jobService.listBookmarked(req.user._id);
    sendSuccess(res, { data: { jobs } });
  } catch (err) {
    next(err);
  }
};

/* ══════════════════════════════════════════════════
   COMPANY-FACING — APPLICANT PIPELINE
══════════════════════════════════════════════════ */

/* GET /api/jobs/:id/applicants */
const listApplicants = async (req, res, next) => {
  try {
    const result = await jobService.listApplicants(req.user._id, req.params.id);
    sendSuccess(res, { data: result });
  } catch (err) {
    next(err);
  }
};

/* GET /api/jobs/:id/applicants/:candidateId/profile */
const getApplicantProfile = async (req, res, next) => {
  try {
    const profile = await jobService.getApplicantProfile(req.user._id, req.params.id, req.params.candidateId);
    sendSuccess(res, { data: { profile } });
  } catch (err) {
    next(err);
  }
};

/* PATCH /api/jobs/:id/applicants/:candidateId/status — Body: { status } */
const updateApplicantStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await jobService.updateApplicantStatus(
      req.user._id, req.params.id, req.params.candidateId, status
    );
    sendSuccess(res, { message: 'Applicant status updated.', data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listJobs, getJob, createJob, updateJob, deleteJob,
  listPublicJobs, getPublicJob, applyJob, listMyApplications, listRecommendedJobs,
  toggleBookmark, listBookmarkedJobs,
  listApplicants, getApplicantProfile, updateApplicantStatus,
};