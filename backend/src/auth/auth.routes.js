const { Router } = require('express');

const controller = require('./auth.controller');
const validate   = require('./auth.validation');
const { verifyFirebaseToken } = require('./auth.middleware');

const router = Router();

/* ── Email signup — 3-step OTP-gated flow ───────────────────
   Step 1: send-otp    → Clerk emails a 6-digit code
   Step 2: verify-otp  → confirm code (no account created yet)
   Step 3: signup      → create Firebase user + MongoDB record
─────────────────────────────────────────────────────────── */
router.post('/signup/send-otp',   validate.validateSendSignupOtp,    controller.sendSignupOtp);
router.post('/signup/verify-otp', validate.validateVerifySignupOtp,  controller.verifySignupOtp);
router.post('/signup',            validate.validateSignup,            controller.signup);

/* ── Email/password signin ──────────────────────────────────
   Client calls Firebase first, sends us the ID token.
─────────────────────────────────────────────────────────── */
router.post('/signin',  validate.validateSignin,  verifyFirebaseToken, controller.signin);

/* ── OAuth (Google + GitHub) ──────────────────────────────── */
router.post('/oauth',   validate.validateOAuth,   verifyFirebaseToken, controller.oauthSignin);

/* ── Forgot password (3-step) ───────────────────────────────
   Step 1 → send-otp    : Clerk OTP email
   Step 2 → verify-otp  : validate code → return resetToken
   Step 3 → reset       : use resetToken to set new password
─────────────────────────────────────────────────────────── */
router.post('/forgot-password/send-otp',   validate.validateSendOtp,       controller.sendForgotPasswordOtp);
router.post('/forgot-password/verify-otp', validate.validateVerifyOtp,     controller.verifyForgotPasswordOtp);
router.post('/forgot-password/reset',      validate.validateResetPassword,  controller.resetPassword);

/* ── Token management ───────────────────────────────────────*/
router.post('/refresh', validate.validateRefresh, controller.refreshAccessToken);
router.post('/signout',                           controller.signout);

module.exports = router;