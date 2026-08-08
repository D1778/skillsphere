/**
 * src/profile/profile.routes.js
 */
const { Router } = require('express');
const multer     = require('multer');
const path       = require('path');
// Handles both export shapes across versions of this package: v3+ exports
// { CloudinaryStorage }, v1/v2 export the class directly as module.exports.
const multerStorageCloudinary = require('multer-storage-cloudinary');
const CloudinaryStorage = multerStorageCloudinary.CloudinaryStorage || multerStorageCloudinary;
const cloudinary = require('../config/cloudinary');
const { authenticate, authorize } = require('../auth/auth.middleware');
const { getProfile, updateProfile } = require('./profile.controller');

/* ── Storage for profile photo + cert PDFs. Pushed to Cloudinary instead
   of local disk — same reason as everywhere else: Render's filesystem
   is wiped on every deploy/restart. One multer instance handles both
   field types, so resource_type is branched per-file: the photo is an
   image (Cloudinary auto-generates its public_id without an extension),
   cert PDFs are 'raw' with the extension baked into the public_id
   explicitly (raw assets don't infer a format the way images do). ── */
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isCert = file.fieldname.startsWith('certPdf_');
    return {
      folder:        isCert ? 'skillsphere/certs' : 'skillsphere/avatars',
      resource_type: isCert ? 'raw' : 'image',
      public_id:     isCert
        ? `${req.user?._id || 'anon'}-${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
        : `${req.user?._id || 'anon'}-${Date.now()}`,
    };
  },
});

const upload = multer({
  storage: profileStorage,
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