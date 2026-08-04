/**
 * src/chatbot/chatbot.service.js
 *
 * Routes each chat message to Groq's chat completions API (same
 * OpenAI-compatible plain-fetch pattern as roadmap.service.js), using a
 * role-specific system prompt and a role-specific API key so the
 * candidate and company assistants never share a prompt or a quota.
 */

const AppError        = require('../utils/AppError');
const Profile         = require('../profile/profile.model');
const Job             = require('../job/job.model');
const User            = require('../user/user.model');
const candidatePrompt = require('./prompts/candidatePrompt');
const companyPrompt   = require('./prompts/companyPrompt');

const GROQ_API      = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL    = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const REQUEST_TIMEOUT_MS = 30000;
const MAX_HISTORY_MESSAGES = 20; // last 10 user/assistant exchanges

// Keeps only well-formed { role, content } entries and trims to the last
// 10 exchanges, so a bad payload or a long-running chat can't blow up
// the request to Groq.
const sanitizeHistory = (history) => {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content }));
};

// Joins non-empty lines under a heading, dropping the heading entirely
// when every field in the section is blank — keeps the context compact
// instead of sending a wall of empty labels to the model.
const section = (title, lines) => {
  const filled = lines.filter(Boolean);
  return filled.length ? [`${title}:`, ...filled].join('\n') : '';
};

/**
 * Pulls the candidate's profile straight from MongoDB (the same
 * `Profile` collection the profile builder / resume pages read from)
 * and formats it into a compact text block the model can ground its
 * answers in. Returns null when there's no profile yet, or nothing in
 * it worth mentioning, so the caller can skip the context message.
 */
const buildResumeContext = async (userId) => {
  const profile = await Profile.findOne({ userId }).lean();
  if (!profile) return null;

  const p = profile.personal || {};
  const sections = [
    section('Personal', [
      p.fullName && `Name: ${p.fullName}`,
      p.title && `Title: ${p.title}`,
      p.location && `Location: ${p.location}`,
      p.summary && `Summary: ${p.summary}`,
      p.portfolio && `Portfolio: ${p.portfolio}`,
      p.linkedin && `LinkedIn: ${p.linkedin}`,
      p.github && `GitHub: ${p.github}`,
    ]),
    section('Education', (profile.educations || []).map((e) =>
      `- ${[e.degree, e.field].filter(Boolean).join(' in ')}${e.institution ? ` at ${e.institution}` : ''}${e.startDate || e.endDate ? ` (${e.startDate || '?'}–${e.endDate || 'present'})` : ''}${e.gpa ? `, GPA ${e.gpa}` : ''}`.trim()
    )),
    section('Experience', (profile.experiences || []).map((e) =>
      `- ${e.title || 'Role'}${e.company ? ` at ${e.company}` : ''}${e.startDate || e.endDate ? ` (${e.startDate || '?'}–${e.current ? 'present' : (e.endDate || '?')})` : ''}${e.responsibilities ? `: ${e.responsibilities}` : ''}`
    )),
    section('Projects', (profile.projects || []).map((pr) =>
      `- ${pr.name || 'Project'}${pr.tech ? ` [${pr.tech}]` : ''}${pr.desc ? `: ${pr.desc}` : ''}`
    )),
    section('Skills', [
      profile.skills?.languages?.length && `Languages: ${profile.skills.languages.join(', ')}`,
      profile.skills?.frameworks?.length && `Frameworks: ${profile.skills.frameworks.join(', ')}`,
      profile.skills?.tools?.length && `Tools: ${profile.skills.tools.join(', ')}`,
      profile.skills?.libraries?.length && `Libraries: ${profile.skills.libraries.join(', ')}`,
    ]),
    section('Certifications', (profile.certs || []).map((c) =>
      `- ${c.name || 'Certificate'}${c.org ? ` (${c.org})` : ''}${c.issueDate ? `, ${c.issueDate}` : ''}`
    )),
    section('Awards', (profile.awards || []).map((a) =>
      `- ${a.name || 'Award'}${a.org ? ` (${a.org})` : ''}${a.year ? `, ${a.year}` : ''}`
    )),
    section('Leadership', (profile.leaders || []).map((l) =>
      `- ${l.position || 'Role'}${l.org ? ` at ${l.org}` : ''}${l.desc ? `: ${l.desc}` : ''}`
    )),
    section('Volunteering', (profile.volunteers || []).map((v) =>
      `- ${v.role || 'Role'}${v.org ? ` at ${v.org}` : ''}${v.desc ? `: ${v.desc}` : ''}`
    )),
    section('Publications', (profile.pubs || []).map((pub) =>
      `- ${pub.title || 'Publication'}${pub.conference ? ` (${pub.conference})` : ''}${pub.year ? `, ${pub.year}` : ''}`
    )),
    section('Extras', [
      profile.extras?.achievements,
      profile.extras?.interests?.length && `Interests: ${profile.extras.interests.join(', ')}`,
    ]),
  ].filter(Boolean);

  return sections.length ? sections.join('\n\n') : null;
};

// Hiring-pipeline stages tracked on each application (see job.model.js).
const APPLICATION_STATUSES = ['new', 'reviewed', 'shortlisted', 'interview', 'hired', 'rejected'];

/**
 * Pulls the signed-in company's own data from MongoDB: their account
 * info plus every job posting they own, with an applicant-status
 * breakdown per posting. This is the company-side analogue of
 * `buildResumeContext` — it never touches other companies' postings or
 * individual candidates' private details (names/emails/phones/pitches
 * stay out of it), only aggregate counts, so the existing "never reveal
 * private candidate information" guardrail in companyPrompt still holds.
 */
const buildCompanyContext = async (userId) => {
  const [company, jobs] = await Promise.all([
    User.findById(userId).select('companyName email socialLinks').lean(),
    Job.find({ companyId: userId })
      .select('title status department employmentType workplaceType city state country openings applicationDeadline skills applicantsCount applications')
      .lean(),
  ]);

  const sections = [
    section('Company', [
      company?.companyName && `Name: ${company.companyName}`,
      company?.email && `Email: ${company.email}`,
      company?.socialLinks?.linkedin && `LinkedIn: ${company.socialLinks.linkedin}`,
      company?.socialLinks?.twitter && `Twitter: ${company.socialLinks.twitter}`,
    ]),
    section('Job Postings', jobs.map((j) => {
      const counts = {};
      (j.applications || []).forEach((a) => { counts[a.status] = (counts[a.status] || 0) + 1; });
      const breakdown = APPLICATION_STATUSES.filter((s) => counts[s]).map((s) => `${s}: ${counts[s]}`).join(', ');
      const location = [j.city, j.state, j.country].filter(Boolean).join(', ');
      const deadline = j.applicationDeadline ? new Date(j.applicationDeadline).toISOString().slice(0, 10) : '';
      return `- "${j.title || 'Untitled role'}" [${j.status}]${j.department ? `, ${j.department}` : ''}${location ? `, ${location}` : ''}${j.workplaceType ? ` (${j.workplaceType})` : ''} — ${j.applicantsCount || 0} applicant(s)${breakdown ? ` [${breakdown}]` : ''}${deadline ? `, deadline ${deadline}` : ''}${j.skills?.length ? `, skills: ${j.skills.join(', ')}` : ''}`;
    })),
    section('Hiring Summary', jobs.length ? [
      `Total postings: ${jobs.length} (${jobs.filter((j) => j.status === 'active').length} active, ${jobs.filter((j) => j.status === 'draft').length} draft, ${jobs.filter((j) => j.status === 'closed').length} closed)`,
      `Total applicants across all postings: ${jobs.reduce((sum, j) => sum + (j.applicantsCount || 0), 0)}`,
    ] : []),
  ].filter(Boolean);

  return sections.length ? sections.join('\n\n') : null;
};

// role -> { system prompt, dedicated API key env var, DB context builder,
// and the intro line explaining that context to the model }
const ROLE_CONFIG = {
  candidate: {
    systemPrompt: candidatePrompt,
    apiKeyEnvVar: 'API_KEY_CANDIDATE',
    buildContext: buildResumeContext,
    contextIntro: "The signed-in candidate's profile, read from the database. Use it to answer questions about their own resume/profile/skills/experience. Never invent details beyond what's listed here, and if something isn't listed, say it isn't on their profile yet.",
  },
  company: {
    systemPrompt: companyPrompt,
    apiKeyEnvVar: 'API_KEY_COMPANY',
    buildContext: buildCompanyContext,
    contextIntro: "The signed-in company's own account and job postings, read from the database (applicant counts are aggregate status breakdowns only — no individual candidate names, emails, or notes). Use it to answer questions about their postings and hiring pipeline. Never invent details beyond what's listed here, and if something isn't listed, say it isn't available yet.",
  },
};

/**
 * Gets a reply from the assistant assigned to `role`.
 * Throws AppError for every failure mode (missing config, bad input,
 * network failure, timeout, rate limit, upstream error) so the
 * controller can just forward it to the global error handler.
 */
const getReply = async (role, userId, message, history) => {
  const config = ROLE_CONFIG[role];
  if (!config) throw new AppError('Chatbot is not available for this account type.', 403);

  if (!message?.trim()) throw new AppError('Message is required.', 400);

  const apiKey = process.env[config.apiKeyEnvVar];
  if (!apiKey) {
    throw new AppError(`Chatbot is not configured on the server (missing ${config.apiKeyEnvVar}).`, 500);
  }

  const messages = [{ role: 'system', content: config.systemPrompt }];

  // Both assistants ground their answers in the signed-in user's own
  // data, fetched fresh from MongoDB on every message so edits (profile
  // builder for candidates, job postings for companies) show up
  // immediately without needing a new chat session.
  const dbContext = await config.buildContext(userId);
  if (dbContext) {
    messages.push({ role: 'system', content: `${config.contextIntro}\n\n${dbContext}` });
  }

  messages.push(
    ...sanitizeHistory(history),
    { role: 'user', content: message.trim() },
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(GROQ_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.5,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new AppError('The assistant took too long to respond. Please try again.', 504);
    }
    throw new AppError('Could not reach the assistant. Please try again.', 502);
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 429) {
    throw new AppError('The assistant is receiving too many requests right now. Please try again shortly.', 429);
  }

  if (!res.ok) {
    console.error('[Chatbot] Groq request failed:', res.status, await res.text().catch(() => ''));
    throw new AppError('The assistant returned an error. Please try again.', 502);
  }

  const payload = await res.json();
  const reply = payload.choices?.[0]?.message?.content?.trim();

  if (!reply) {
    throw new AppError('The assistant did not return a usable response.', 502);
  }

  return reply;
};

module.exports = { getReply };
