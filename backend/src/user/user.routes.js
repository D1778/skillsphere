const { Router }                    = require('express');
const multer                        = require('multer');
const path                          = require('path');
const fs                            = require('fs');
const controller                    = require('./user.controller');
const { authenticate, authorize }   = require('../auth/auth.middleware');

/* ── Multer: save avatar/logo uploads to /uploads ──
   Same shared folder + naming scheme as the profile module, so both
   sets of uploads are served from the one static /uploads route. */
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