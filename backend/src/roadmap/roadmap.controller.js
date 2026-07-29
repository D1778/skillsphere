/**
 * src/roadmap/roadmap.controller.js
 */
const roadmapService  = require('./roadmap.service');
const { sendSuccess } = require('../utils/response');

/* ════════════════════════════════════════════════
   GET /api/roadmap
   Returns { current, previous } — either may be null.
════════════════════════════════════════════════ */
const getRoadmap = async (req, res, next) => {
  try {
    const result = await roadmapService.getForUser(req.user._id);
    sendSuccess(res, { data: result });
  } catch (err) {
    next(err);
  }
};

/* ════════════════════════════════════════════════
   POST /api/roadmap/generate
   Body: { targetRole }
   Generates a new roadmap, rotates current -> previous
   (discarding the old previous), returns the updated pair.
════════════════════════════════════════════════ */
const generateRoadmap = async (req, res, next) => {
  try {
    const { targetRole } = req.body;
    const result = await roadmapService.generateForUser(req.user._id, targetRole);
    sendSuccess(res, { message: 'Roadmap generated successfully.', data: result });
  } catch (err) {
    next(err);
  }
};

/* ════════════════════════════════════════════════
   POST /api/roadmap/load-previous
   Swaps current <-> previous. 404s if there's no
   previous roadmap saved yet.
════════════════════════════════════════════════ */
const loadPrevious = async (req, res, next) => {
  try {
    const result = await roadmapService.loadPreviousForUser(req.user._id);
    sendSuccess(res, { message: 'Previous roadmap restored.', data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getRoadmap, generateRoadmap, loadPrevious };