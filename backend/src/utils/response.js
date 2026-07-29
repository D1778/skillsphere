/**
 * Consistent response shape across all controllers.
 *
 * Success:  { success: true,  message, data? }
 * Error:    { success: false, message }        ← handled by global error handler
 */

const sendSuccess = (res, { statusCode = 200, message = 'OK', data = undefined } = {}) => {
  const body = { success: true, message };
  if (data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
};

module.exports = { sendSuccess };