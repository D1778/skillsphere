/**
 * src/roadmap/roadmap.service.js
 *
 * Generates a 4-phase career roadmap via Groq's chat completions API
 * (OpenAI-compatible endpoint, so plain fetch — no extra SDK dependency,
 * same pattern as src/github/github.service.js) and manages the
 * current/previous rotation per user.
 *
 * Every user keeps at most 2 roadmaps:
 *   - current  : the active roadmap shown on /roadmap and the dashboard
 *   - previous : whatever "current" was before the last generation
 *
 * Generating a new roadmap shifts current -> previous and discards
 * whatever was in previous before that. loadPreviousForUser() swaps
 * the two, so calling it twice in a row is a no-op (acts like undo/redo).
 */

const AppError = require('../utils/AppError');
const Roadmap  = require('./roadmap.model');

const GROQ_API      = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL     = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const MAX_ATTEMPTS   = 3;

const ALLOWED_LEVELS = new Set(['Foundational', 'Intermediate', 'Advanced', 'Mastery']);
const ALLOWED_COLORS = new Set(['blue', 'purple', 'green', 'orange']);

/* ══════════════════════════════════════════════════
   SYSTEM PROMPT
   Ported from the roadmap_generator.py reference script.
══════════════════════════════════════════════════ */
const SYSTEM_PROMPT = `You are SkillSphere AI, an expert software engineering mentor, career coach, and curriculum designer.

Your task is to generate a complete, production-ready learning roadmap for ANY technology career based ONLY on the user's target job role.

The roadmap should be suitable for self-learning and should follow the same structure regardless of the role.

The roadmap must always contain exactly FOUR learning phases:

Phase 1 -> Beginner (Foundational)
Phase 2 -> Intermediate
Phase 3 -> Advanced
Phase 4 -> Mastery

Each phase must naturally build upon the previous one. Do NOT skip prerequisites.

The roadmap should follow industry standards used by top companies such as Google, Microsoft, Amazon, Meta, Netflix, and startups.

Each phase must contain: id, title, subtitle, description, level, estimatedHours, estimatedWeeks, icon, color, topics, projects, skills, resources, outcome.

Rules:
Beginner phase should teach the fundamentals.
Intermediate phase should teach real-world development.
Advanced phase should teach scalable production systems.
Mastery phase should prepare the learner for interviews, leadership, architecture, optimization, and professional engineering.

Topics: minimum 6, maximum 10.
Projects: minimum 2, maximum 3, portfolio worthy, increasing difficulty.
Skills: minimum 6, maximum 10.
Resources: exactly 3, a mix of Books, Courses and Documentation.

Allowed level values: Foundational, Intermediate, Advanced, Mastery.
Allowed colors: blue, purple, green, orange.
Choose Lucide icon names (e.g. code, server, brain, cloud, container, shield, database, cpu).

Estimate realistic study durations (example: Beginner 40h/4wk, Intermediate 60h/6wk, Advanced 80h/8wk, Mastery 100h/10wk) and calculate totalHours, totalWeeks, and stats { phases, focusAreas, skills }.

Return ONLY valid JSON. Do not write explanations. Do not use markdown. Do not use code blocks.

Return exactly this JSON schema:

{
  "title":"Career Roadmap",
  "targetRole":"",
  "totalHours":0,
  "totalWeeks":0,
  "stats":{ "phases":4, "focusAreas":0, "skills":0 },
  "phases":[
    {
      "id":1,
      "title":"",
      "subtitle":"",
      "description":"",
      "icon":"",
      "color":"",
      "level":"",
      "estimatedHours":0,
      "estimatedWeeks":0,
      "topics":[],
      "projects":[{ "title":"", "description":"" }],
      "skills":[],
      "resources":[{ "type":"", "title":"", "author":"" }],
      "outcome":""
    }
  ]
}

The roadmap should adapt automatically depending on the requested job role (Frontend, Backend, Full Stack, DevOps, Cloud Engineer, AI Engineer, ML Engineer, Cybersecurity, Mobile Developer, Game Developer, Data Scientist, Product Manager, etc). If the role is unknown, intelligently generate the closest professional roadmap. Every roadmap should feel like it was designed by a senior engineering manager.`;

/* ══════════════════════════════════════════════════
   VALIDATION
   Mirrors validate_roadmap() from the Python reference.
══════════════════════════════════════════════════ */
function validateRoadmap(data) {
  const requiredTop = ['title', 'targetRole', 'totalHours', 'totalWeeks', 'stats', 'phases'];
  for (const key of requiredTop) {
    if (!(key in data)) throw new Error(`Roadmap JSON missing top-level key: ${key}`);
  }

  if (!Array.isArray(data.phases) || data.phases.length !== 4) {
    throw new Error(`Expected exactly 4 phases, got ${data.phases?.length}`);
  }

  const phaseFields = [
    'id', 'title', 'subtitle', 'description', 'level', 'estimatedHours',
    'estimatedWeeks', 'icon', 'color', 'topics', 'projects', 'skills',
    'resources', 'outcome',
  ];

  data.phases.forEach((phase) => {
    for (const field of phaseFields) {
      if (!(field in phase)) throw new Error(`Phase ${phase.id} missing field: ${field}`);
    }
    if (!ALLOWED_LEVELS.has(phase.level))
      throw new Error(`Phase ${phase.id} has invalid level: ${phase.level}`);
    if (!ALLOWED_COLORS.has(phase.color))
      throw new Error(`Phase ${phase.id} has invalid color: ${phase.color}`);
    if (!(phase.topics.length >= 6 && phase.topics.length <= 10))
      throw new Error(`Phase ${phase.id} topics count out of range: ${phase.topics.length}`);
    if (!(phase.projects.length >= 2 && phase.projects.length <= 3))
      throw new Error(`Phase ${phase.id} projects count out of range: ${phase.projects.length}`);
    if (!(phase.skills.length >= 6 && phase.skills.length <= 10))
      throw new Error(`Phase ${phase.id} skills count out of range: ${phase.skills.length}`);
    if (phase.resources.length !== 3)
      throw new Error(`Phase ${phase.id} must have exactly 3 resources, got ${phase.resources.length}`);
  });
}

/* ══════════════════════════════════════════════════
   GROQ CALL — retries on invalid JSON, same as the
   Python reference (up to MAX_ATTEMPTS).
══════════════════════════════════════════════════ */
async function callGroq(targetRole) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AppError('Roadmap generation is not configured on the server (missing GROQ_API_KEY).', 500);
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: targetRole },
  ];

  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
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
          temperature: 0.4,
          response_format: { type: 'json_object' },
        }),
      });
    } catch (networkErr) {
      throw new AppError('Could not reach the roadmap generation service. Please try again.', 502);
    }

    if (!res.ok) {
      console.error('[Roadmap] Groq request failed:', res.status, await res.text().catch(() => ''));
      throw new AppError('Roadmap generation service returned an error. Please try again.', 502);
    }

    const payload = await res.json();
    const raw = payload.choices?.[0]?.message?.content;

    try {
      const data = JSON.parse(raw);
      validateRoadmap(data);
      return data;
    } catch (err) {
      lastError = err;
      if (attempt === MAX_ATTEMPTS) break;
      messages.push({ role: 'assistant', content: raw ?? '' });
      messages.push({
        role: 'user',
        content:
          `That JSON was invalid: ${err.message}. Return the corrected, complete JSON only, ` +
          'following the exact schema and count rules (topics 6-10, projects 2-3, skills 6-10, ' +
          'resources exactly 3). Do not omit any phase or field.',
      });
    }
  }

  console.error('[Roadmap] Model failed to produce valid output:', lastError?.message);
  throw new AppError('Failed to generate a valid roadmap. Please try again.', 502);
}

/* ══════════════════════════════════════════════════
   SERVICE METHODS
══════════════════════════════════════════════════ */

const getForUser = async (userId) => {
  const doc = await Roadmap.findOne({ userId });
  return { current: doc?.current || null, previous: doc?.previous || null };
};

const generateForUser = async (userId, targetRole) => {
  if (!targetRole?.trim()) throw new AppError('Target role is required.', 400);

  const data = await callGroq(targetRole.trim());
  data.generatedAt = new Date();

  let doc = await Roadmap.findOne({ userId });
  if (!doc) doc = new Roadmap({ userId });

  // Rotate: whatever was current becomes previous (silently discarding
  // whatever was in previous before), and the fresh roadmap becomes current.
  doc.previous = doc.current || null;
  doc.current  = data;
  await doc.save();

  return { current: doc.current, previous: doc.previous };
};

const loadPreviousForUser = async (userId) => {
  const doc = await Roadmap.findOne({ userId });
  if (!doc?.previous) throw new AppError('No previous roadmap to load.', 404);

  // Swap current <-> previous. Calling this again flips back, so it
  // doubles as a harmless undo rather than a one-way action.
  const swap   = doc.current;
  doc.current  = doc.previous;
  doc.previous = swap;
  await doc.save();

  return { current: doc.current, previous: doc.previous };
};

module.exports = { getForUser, generateForUser, loadPreviousForUser };