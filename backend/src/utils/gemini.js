/**
 * src/utils/gemini.js
 *
 * Thin wrapper around Gemini's OpenAI-compatible chat completions
 * endpoint (https://ai.google.dev/gemini-api/docs/openai), mirroring the
 * plain-fetch pattern already used for Groq in roadmap.service.js — no
 * extra SDK dependency, just Node's built-in fetch (Node 18+).
 *
 * Used anywhere a structured JSON response is needed out of an LLM.
 * Currently: job.service.js's Gemini-based "recommended for you" ranking.
 */

const AppError = require('./AppError');

const GEMINI_API   = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const MAX_ATTEMPTS = 2;

/**
 * Sends a chat-style `messages` array (same shape as OpenAI/Groq) to
 * Gemini and returns the parsed JSON object from its response.
 *
 * Retries once (MAX_ATTEMPTS) if the model returns invalid JSON, feeding
 * the parse error back to it — same self-correction trick used for the
 * roadmap generator. Throws AppError on missing config, network failure,
 * an upstream error, or output that's still not valid JSON after retrying.
 */
const getJsonCompletion = async (messages) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError('Gemini is not configured on the server (missing GEMINI_API_KEY).', 500);
  }

  const conversation = [...messages];
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res;
    try {
      res = await fetch(GEMINI_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GEMINI_MODEL,
          messages: conversation,
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });
    } catch {
      throw new AppError('Could not reach Gemini. Please try again.', 502);
    }

    if (!res.ok) {
      console.error('[Gemini] request failed:', res.status, await res.text().catch(() => ''));
      throw new AppError('Gemini returned an error. Please try again.', 502);
    }

    const payload = await res.json();
    const raw = payload.choices?.[0]?.message?.content;

    try {
      return JSON.parse(raw);
    } catch (err) {
      lastError = err;
      if (attempt === MAX_ATTEMPTS) break;
      conversation.push({ role: 'assistant', content: raw ?? '' });
      conversation.push({
        role: 'user',
        content: `That wasn't valid JSON: ${err.message}. Return the corrected JSON only — no markdown, no explanation.`,
      });
    }
  }

  console.error('[Gemini] failed to produce valid JSON:', lastError?.message);
  throw new AppError('Gemini did not return a usable response.', 502);
};

module.exports = { getJsonCompletion };