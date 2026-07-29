const jwt = require('jsonwebtoken');

/**
 * Short-lived access token (default 7d).
 * Carries userId, email, role so protected routes
 * never need an extra DB call just to know the role.
 */
const generateAccessToken = (user) =>
  jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

/**
 * Long-lived refresh token (default 30d).
 * Stored as a bcrypt hash in MongoDB for rotation & revocation.
 */
const generateRefreshToken = (user) =>
  jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

const verifyAccessToken  = (token) => jwt.verify(token, process.env.JWT_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

/**
 * Short-lived one-purpose token used between OTP verify
 * and the final password-reset step (5 min, purpose-locked).
 */
const generateResetToken = (userId) =>
  jwt.sign(
    { userId, purpose: 'password-reset' },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  );

const verifyResetToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.purpose !== 'password-reset') throw new Error('Invalid token purpose.');
  return decoded;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateResetToken,
  verifyResetToken,
};