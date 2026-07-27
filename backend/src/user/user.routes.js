const { Router }                    = require('express');
const controller                    = require('./user.controller');
const { authenticate, authorize }   = require('../auth/auth.middleware');

const router = Router();

// All user routes require a valid JWT
router.use(authenticate);

/* ── Profile ──────────────────────────────────── */
router.get   ('/me', controller.getMe);
router.patch ('/me', controller.updateMe);
router.delete('/me', controller.deleteMe);

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