/**
 * src/github/github.service.js
 *
 * Talks to GitHub's public REST API using a server-side token
 * (GITHUB_TOKEN env var), instead of the frontend calling
 * api.github.com directly. Unauthenticated requests are capped at
 * 60/hour per IP; an authenticated token (even with zero scopes,
 * since we only ever read public data) raises that to 5,000/hour.
 *
 * Uses Node's built-in fetch (Node 18+) — no extra dependency needed.
 */

const AppError = require('../utils/AppError');

const GITHUB_API = 'https://api.github.com';

const githubHeaders = () => ({
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
});

/**
 * Extracts a username from whatever format the profile's GitHub field
 * might be in — a full URL, a URL with trailing slash/path, or just
 * the bare username.
 */
const extractUsername = (input) => {
  if (!input) return null;
  const trimmed = input.trim().replace(/\/+$/, '');
  const match = trimmed.match(/github\.com\/([^/?#]+)/i);
  if (match) return match[1];
  if (/^[a-zA-Z0-9-]+$/.test(trimmed)) return trimmed;
  return null;
};

const formatRepo = (r, langs) => ({
  id:               r.id,
  name:             r.name,
  description:      r.description,
  html_url:         r.html_url,
  stargazers_count: r.stargazers_count,
  forks_count:      r.forks_count,
  langs,
});

/**
 * Returns the top 5 most-recently-pushed, non-fork public repos for a
 * GitHub username (or profile URL), each annotated with its top 3
 * languages by byte count.
 */
const getTopRepos = async (githubUrlOrUsername) => {
  const username = extractUsername(githubUrlOrUsername);
  if (!username) throw new AppError('No valid GitHub username provided.', 400);

  const reposRes = await fetch(
    `${GITHUB_API}/users/${username}/repos?sort=pushed&direction=desc&per_page=6`,
    { headers: githubHeaders() }
  );

  if (!reposRes.ok) {
    if (reposRes.status === 404) throw new AppError('GitHub user not found.', 404);
    console.error('[GitHub] repos fetch failed:', reposRes.status);
    throw new AppError('Failed to fetch GitHub repositories.', 502);
  }

  const allRepos = await reposRes.json();
  const top = allRepos.filter((r) => !r.fork).slice(0, 5);

  const withLangs = await Promise.all(top.map(async (r) => {
    try {
      const langRes = await fetch(r.languages_url, { headers: githubHeaders() });
      const langData = langRes.ok ? await langRes.json() : {};
      const langs = Object.entries(langData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name);
      return formatRepo(r, langs);
    } catch {
      return formatRepo(r, r.language ? [r.language] : []);
    }
  }));

  return withLangs;
};

module.exports = { getTopRepos, extractUsername };