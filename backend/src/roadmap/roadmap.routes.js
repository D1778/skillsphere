/**
 * src/roadmap/roadmap.routes.js
 */
const { Router }    = require('express');
const rateLimit      = require('express-rate-limit');
const { authenticate, authorize } = require('../auth/auth.middleware');
const controller      = require('./roadmap.controller');

const router = Router();

router.use(authenticate, authorize('candidate'));

// Generation calls an LLM and is comparatively expensive — cap it
// separately from the app-wide limiter so it can't be hammered.
const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many roadmap generations, please try again later.' },
});

router.get('/', controller.getRoadmap);
router.post('/generate', generateLimiter, controller.generateRoadmap);
router.post('/load-previous', controller.loadPrevious);

module.exports = router;