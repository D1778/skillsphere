/**
 * src/dashboard/dashboard.controller.js
 */
const dashboardService = require('./dashboard.service');
const { sendSuccess }  = require('../utils/response');

/* GET /api/dashboard
   ?refresh=true — asks for a fresh AI recommendation pass instead of
   serving the cache, subject to the service's own minimum-interval
   guard (see dashboard.service.js) so this can't be used to spam Gemini. */
const getDashboard = async (req, res, next) => {
  try {
    const forceRefreshRecommendations = req.query.refresh === 'true';
    const data = await dashboardService.getDashboard(req.user._id, { forceRefreshRecommendations });
    sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };