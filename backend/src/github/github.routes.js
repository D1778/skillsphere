/**
 * src/github/github.routes.js
 */
const { Router } = require('express');
const { authenticate, authorize } = require('../auth/auth.middleware');
const { getMyRepos, refreshMyRepos } = require('./github.controller');

const router = Router();

router.use(authenticate, authorize('candidate'));

router.get ('/repos',         getMyRepos);
router.post('/repos/refresh', refreshMyRepos);

module.exports = router;