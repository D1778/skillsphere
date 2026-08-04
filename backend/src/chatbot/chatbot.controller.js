/**
 * src/chatbot/chatbot.controller.js
 */
const chatbotService  = require('./chatbot.service');
const { sendSuccess } = require('../utils/response');

/* ════════════════════════════════════════════════
   POST /api/chatbot
   Body: { message, history }
   Role is always read from the authenticated user
   (req.user.role), never from the request body, so
   the client can't switch which key/prompt is used.
════════════════════════════════════════════════ */
const sendMessage = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    const reply = await chatbotService.getReply(req.user.role, req.user._id, message, history);
    sendSuccess(res, { data: { reply } });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage };
