/**
 * src/dashboard/dashboard.routes.js
 */
const { Router } = require('express');
const { authenticate, authorize } = require('../auth/auth.middleware');
const controller = require('./dashboard.controller');

const router = Router();

router.get('/', authenticate, authorize('company'), controller.getDashboard);
router.get('/insights', authenticate, authorize('candidate'), controller.getInsights);

module.exports = router;