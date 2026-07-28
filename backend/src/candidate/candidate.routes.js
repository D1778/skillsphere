/**
 * src/candidate/candidate.routes.js
 * Company-only: browse/search all candidates and view a candidate's
 * full SkillSphere profile.
 */
const { Router } = require('express');
const { authenticate, authorize } = require('../auth/auth.middleware');
const { listCandidates, getCandidateProfile } = require('./candidate.controller');

const router = Router();

router.use(authenticate, authorize('company'));

router.get('/',    listCandidates);
router.get('/:id', getCandidateProfile);

module.exports = router;