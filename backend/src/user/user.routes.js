const { Router }                    = require('express');
const multer                        = require('multer');
// Handles both export shapes across versions of this package: v3+ exports
// { CloudinaryStorage }, v1/v2 export the class directly as module.exports.
const multerStorageCloudinary       = require('multer-storage-cloudinary');
const CloudinaryStorage             = multerStorageCloudinary.CloudinaryStorage || multerStorageCloudinary;
const cloudinary                    = require('../config/cloudinary');
const controller                    = require('./user.controller');
const { authenticate, authorize }   = require('../auth/auth.middleware');

/* ── Storage for avatar/company logo uploads. Pushed to Cloudinary
   instead of local disk — same reason as everywhere else in this app:
   Render's filesystem is wiped on every deploy/restart. Left as
   resource_type 'image' (the default), so Cloudinary auto-generates
   the public_id without the file extension baked in, same as any other
   image asset. ── */
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, _file) => ({
    folder: 'skillsphere/avatars',
    public_id: `${req.user?._id || 'anon'}-${Date.now()}`,
  }),
});

const upload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router = Router();

// All user routes require a valid JWT
router.use(authenticate);

/* ── Profile ──────────────────────────────────── */
router.get   ('/me', controller.getMe);
router.patch ('/me', controller.updateMe);
router.delete('/me', controller.deleteMe);

/* ── Avatar / company logo upload ──
   Separate multipart endpoint (rather than folding this into PATCH
   /me) so the plain-JSON updateMe route above stays untouched — the
   frontend keeps sending simple `{ fullName, companyName, ... }`
   bodies there, and only this one call needs a file field. */
router.post  ('/me/photo', upload.single('photo'), controller.uploadPhoto);
router.delete('/me/photo', controller.removePhoto);

/* ── Role-gated route stubs ───────────────────────
   Uncomment and add controllers as you build out
   the rest of the app.

   // Company: view candidate list
   router.get('/candidates', authorize('company'), candidateController.list);

   // Candidate: browse job listings
   router.get('/jobs', authorize('candidate'), jobController.list);

   // Candidate: apply to a job
   router.post('/jobs/:id/apply', authorize('candidate'), jobController.apply);
─────────────────────────────────────────────────── */

module.exports = router;