/**
 * src/job/job.routes.js
 */
const { Router } = require('express');
const multer      = require('multer');
const path        = require('path');
const fs          = require('fs');
// Handles both export shapes across versions of this package: v3+ exports
// { CloudinaryStorage }, v1/v2 export the class directly as module.exports.
const multerStorageCloudinary = require('multer-storage-cloudinary');
const CloudinaryStorage = multerStorageCloudinary.CloudinaryStorage || multerStorageCloudinary;
const cloudinary  = require('../config/cloudinary');
const { authenticate, authorize } = require('../auth/auth.middleware');
const AppError    = require('../utils/AppError');
const controller  = require('./job.controller');

const router = Router();

/* ── Storage for the two optional job attachments (job description PDF,
   company brochure PDF). Mirrors the disk-storage pattern used for
   profile photos/certs, just pointed at its own uploads/jobs folder
   so job files don't mix with profile files. ── */
const UPLOAD_DIR = path.join(__dirname, '../../uploads/jobs');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeField = file.fieldname.replace(/[^a-zA-Z0-9_-]/g, '');
    cb(null, `${req.user?._id || 'anon'}-${safeField}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype !== 'application/pdf') {
    return cb(new AppError('Only PDF files are allowed for job attachments.', 400));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB, matches the "Max size 5MB" copy in the UI
});

const attachmentUpload = upload.fields([
  { name: 'jobDescriptionPdf', maxCount: 1 },
  { name: 'companyBrochurePdf', maxCount: 1 },
]);

/* ── Storage for candidate resume uploads (apply flow). Resumes are
   pushed straight to Cloudinary instead of local disk, so they survive
   deploys/restarts and can be fetched from anywhere via a plain https
   URL. `resource_type: 'raw'` is used because PDFs/DOC/DOCX aren't
   images — Cloudinary would otherwise try (and fail) to treat them as
   one. Looser file-type filter than the company attachments above,
   since resumes come as PDF/DOC/DOCX and are capped at 2MB (matches
   the "less than 2MB" copy in the apply modal). ── */
const RESUME_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const resumeStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder:        'skillsphere/resumes',
    resource_type: 'raw',
    // Keep the original extension in the stored public_id so the file
    // opens correctly (Cloudinary raw assets don't infer a format).
    public_id:     `${req.user?._id || 'anon'}-${Date.now()}${path.extname(file.originalname)}`,
  }),
});

const resumeUpload = multer({
  storage: resumeStorage,
  fileFilter: (_req, file, cb) => {
    if (!RESUME_MIME_TYPES.includes(file.mimetype)) {
      return cb(new AppError('Resume must be a PDF, DOC or DOCX file.', 400));
    }
    cb(null, true);
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

/* ── Candidate-facing routes ──
   Registered before the company-only `router.use` guard below, so each
   one attaches its own authenticate/authorize('candidate') instead of
   inheriting the company guard. Path shapes (/public, /public/:id,
   /:id/apply, /applications/mine) never collide with the single-segment
   company routes registered afterwards. ── */
router.get(
  '/public',
  authenticate, authorize('candidate'),
  controller.listPublicJobs
);
router.get(
  '/recommended',
  authenticate, authorize('candidate'),
  controller.listRecommendedJobs
);
router.get(
  '/public/:id',
  authenticate, authorize('candidate'),
  controller.getPublicJob
);
router.post(
  '/applications/:id/apply',
  authenticate, authorize('candidate'),
  resumeUpload.single('resume'),
  controller.applyJob
);
router.get(
  '/applications/mine',
  authenticate, authorize('candidate'),
  controller.listMyApplications
);
router.get(
  '/bookmarked',
  authenticate, authorize('candidate'),
  controller.listBookmarkedJobs
);
router.post(
  '/:id/bookmark',
  authenticate, authorize('candidate'),
  controller.toggleBookmark
);

// Every remaining job-posting route belongs to a company managing its own listings.
router.use(authenticate, authorize('company'));

router.get   ('/',    controller.listJobs);
router.post  ('/',    attachmentUpload, controller.createJob);
router.get   ('/:id', controller.getJob);
router.patch ('/:id', attachmentUpload, controller.updateJob);
router.delete('/:id', controller.deleteJob);

/* ── Applicant pipeline (viewing/managing candidates who applied) ── */
router.get  ('/:id/applicants',                      controller.listApplicants);
router.get  ('/:id/applicants/:candidateId/profile',  controller.getApplicantProfile);
router.patch('/:id/applicants/:candidateId/status',   controller.updateApplicantStatus);

module.exports = router;