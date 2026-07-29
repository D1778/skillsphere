/**
 * src/github/github.controller.js
 */
const githubService  = require('./github.service');
const Profile         = require('../profile/profile.model');
const { sendSuccess }  = require('../utils/response');

/* ════════════════════════════════════════════════
   GET /api/github/repos
   Always uses the signed-in candidate's own profile —
   no username is ever accepted from the client, so
   there's no way to make this endpoint fetch on behalf
   of an arbitrary GitHub account.

   Cache-first: once a profile has a cached fetch, this
   reads straight from the DB and never touches GitHub
   again. That's what keeps every dashboard load (and
   every sign-in) from spending a GitHub API call — only
   the first-ever fetch for a profile, or an explicit hit
   of the refresh button (see refreshMyRepos below), does.

   Soft-fails on purpose: missing/invalid GitHub link,
   account not found, or an upstream GitHub error all
   come back as { repos: [], reason } with a 200, so the
   frontend just renders its existing empty states
   instead of a hard error banner.
════════════════════════════════════════════════ */
const getMyRepos = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    const githubUrl = profile?.personal?.github;

    if (!githubUrl) {
      return sendSuccess(res, { data: { repos: [], reason: 'no-username' } });
    }

    // Already cached from a previous fetch/refresh — serve it as-is,
    // no GitHub call.
    if (profile.githubCache?.fetchedAt) {
      return sendSuccess(res, {
        data: {
          repos:     profile.githubCache.repos || [],
          fetchedAt: profile.githubCache.fetchedAt,
        },
      });
    }

    // First time ever for this profile — fetch live once and cache it
    // so every load after this one is free.
    const repos = await githubService.getTopRepos(githubUrl);
    const fetchedAt = new Date();
    await Profile.updateOne(
      { userId: req.user._id },
      { $set: { githubCache: { repos, fetchedAt } } }
    );
    sendSuccess(res, { data: { repos, fetchedAt } });
  } catch (err) {
    if (err.statusCode === 404) {
      return sendSuccess(res, { data: { repos: [], reason: 'not-found' } });
    }
    if (err.statusCode === 400) {
      return sendSuccess(res, { data: { repos: [], reason: 'no-username' } });
    }
    console.error('[GitHub] getMyRepos error:', err.message);
    sendSuccess(res, { data: { repos: [], reason: 'fetch-failed' } });
  }
};

/* ════════════════════════════════════════════════
   POST /api/github/repos/refresh
   Forces a live GitHub fetch and overwrites the cache.
   This is the ONLY path (besides a profile's very first
   fetch) that ever spends a GitHub API call — wired to
   the dashboard's manual refresh button.

   On failure, the existing cache is left untouched (we
   don't want a rate-limit blip to wipe out repos that
   were showing fine a second ago); the frontend decides
   whether to keep showing the old list based on `reason`.
════════════════════════════════════════════════ */
const refreshMyRepos = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    const githubUrl = profile?.personal?.github;

    if (!githubUrl) {
      return sendSuccess(res, { data: { repos: [], reason: 'no-username' } });
    }

    const repos = await githubService.getTopRepos(githubUrl);
    const fetchedAt = new Date();
    await Profile.updateOne(
      { userId: req.user._id },
      { $set: { githubCache: { repos, fetchedAt } } }
    );
    sendSuccess(res, { data: { repos, fetchedAt } });
  } catch (err) {
    if (err.statusCode === 404) {
      return sendSuccess(res, { data: { repos: [], reason: 'not-found' } });
    }
    if (err.statusCode === 400) {
      return sendSuccess(res, { data: { repos: [], reason: 'no-username' } });
    }
    console.error('[GitHub] refreshMyRepos error:', err.message);
    sendSuccess(res, { data: { repos: [], reason: 'fetch-failed' } });
  }
};

module.exports = { getMyRepos, refreshMyRepos };