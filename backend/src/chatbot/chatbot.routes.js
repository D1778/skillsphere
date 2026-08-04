/**
 * src/chatbot/chatbot.routes.js
 * Available to any signed-in user (candidate or company) — the
 * controller reads req.user.role to pick the right prompt/key, so one
 * route serves both sides of the platform.
 */
const { Router }   = require('express');
const rateLimit     = require('express-rate-limit');
const { authenticate } = require('../auth/auth.middleware');
const controller    = require('./chatbot.controller');

const router = Router();

router.use(authenticate);

// Calls an LLM and is comparatively expensive — cap it separately from
// the app-wide limiter, same pattern as roadmap generation.
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many messages, please slow down and try again shortly.' },
});

router.post('/', chatLimiter, controller.sendMessage);

module.exports = router;
