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

/* GET /api/dashboard/insights?range=7d|30d|month|year|all|custom&startDate=&endDate=
   Candidate-only. Powers the Insights page (status cards, top-roles
   donut, recent applications, upcoming schedule). */
const getInsights = async (req, res, next) => {
  try {
    const { range, startDate, endDate } = req.query;
    const data = await dashboardService.getCandidateInsights(req.user._id, { range, startDate, endDate });
    sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard, getInsights };