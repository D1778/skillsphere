/**
 * src/profile/profile.routes.js
 */
const { Router } = require('express');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const { authenticate, authorize } = require('../auth/auth.middleware');
const { getProfile, updateProfile } = require('./profile.controller');

/* ── Multer: save to /uploads ── */
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp','application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Accept photo + up to 10 cert PDFs
const uploadFields = upload.fields([
  { name: 'photo',      maxCount: 1  },
  ...Array.from({ length: 10 }, (_, i) => ({ name: `certPdf_${i}`, maxCount: 1 })),
]);

const router = Router();

router.use(authenticate, authorize('candidate'));

router.get ('/',  getProfile);
router.patch('/', uploadFields, updateProfile);

module.exports = router;