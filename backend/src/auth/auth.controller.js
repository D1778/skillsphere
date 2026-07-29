const authService     = require('./auth.service');
const { sendSuccess } = require('../utils/response');

/* ════════════════════════════════════════════════
   POST /api/auth/signup/send-otp
   Body: { email }
════════════════════════════════════════════════ */
const sendSignupOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.sendSignupOtp(email);
    sendSuccess(res, {
      message: 'Verification code sent to your email.',
    });
  } catch (err) {
    next(err);
  }
};

/* ════════════════════════════════════════════════
   POST /api/auth/signup/verify-otp
   Body: { email, code }
════════════════════════════════════════════════ */
const verifySignupOtp = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    await authService.verifySignupOtp({ email, code });
    sendSuccess(res, {
      message: 'Email verified.',
      data:    { verified: true },
    });
  } catch (err) {
    next(err);
  }
};

/* ════════════════════════════════════════════════
   POST /api/auth/signup
   Body: { email, password, role, fullName?, companyName? }
════════════════════════════════════════════════ */
const signup = async (req, res, next) => {
  try {
    const { email, password, role, fullName, companyName } = req.body;
    const result = await authService.signup({ email, password, role, fullName, companyName });
    sendSuccess(res, {
      statusCode: 201,
      message:    'Account created successfully.',
      data:       result,
    });
  } catch (err) {
    next(err);
  }
};

/* ════════════════════════════════════════════════
   POST /api/auth/signin
   Body: { idToken, role }
════════════════════════════════════════════════ */
const signin = async (req, res, next) => {
  try {
    const { idToken, role } = req.body;
    const result = await authService.signin({ idToken, role });
    sendSuccess(res, {
      message: 'Signed in successfully.',
      data:    result,
    });
  } catch (err) {
    next(err);
  }
};

/* ════════════════════════════════════════════════
   POST /api/auth/oauth
   Body: { idToken, role, provider, companyName? }
════════════════════════════════════════════════ */
const oauthSignin = async (req, res, next) => {
  try {
    const { idToken, role, provider, companyName } = req.body;
    const result = await authService.oauthSignin({ idToken, role, provider, companyName });
    sendSuccess(res, {
      message: 'OAuth sign-in successful.',
      data:    result,
    });
  } catch (err) {
    next(err);
  }
};

/* ════════════════════════════════════════════════
   POST /api/auth/forgot-password/send-otp
   Body: { email }
════════════════════════════════════════════════ */
const sendForgotPasswordOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.sendForgotPasswordOtp(email);
    // Always return the same message regardless of whether the email exists
    // to prevent user enumeration
    sendSuccess(res, {
      message: 'If that email exists, an OTP has been sent.',
    });
  } catch (err) {
    next(err);
  }
};

/* ════════════════════════════════════════════════
   POST /api/auth/forgot-password/verify-otp
   Body: { email, code }
════════════════════════════════════════════════ */
const verifyForgotPasswordOtp = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const result = await authService.verifyForgotPasswordOtp({ email, code });
    sendSuccess(res, {
      message: 'OTP verified successfully.',
      data:    result, // { resetToken }
    });
  } catch (err) {
    next(err);
  }
};

/* ════════════════════════════════════════════════
   POST /api/auth/forgot-password/reset
   Body: { resetToken, newPassword }
════════════════════════════════════════════════ */
const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;
    await authService.resetPassword({ resetToken, newPassword });
    sendSuccess(res, {
      message: 'Password reset successfully. Please sign in.',
    });
  } catch (err) {
    next(err);
  }
};

/* ════════════════════════════════════════════════
   POST /api/auth/refresh
   Body: { refreshToken }
════════════════════════════════════════════════ */
const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshTokens(refreshToken);
    sendSuccess(res, {
      message: 'Tokens refreshed.',
      data:    tokens,
    });
  } catch (err) {
    next(err);
  }
};

/* ════════════════════════════════════════════════
   POST /api/auth/signout
   Body: { refreshToken }
════════════════════════════════════════════════ */
const signout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.signout(refreshToken);
    sendSuccess(res, { message: 'Signed out successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sendSignupOtp,
  verifySignupOtp,
  signup,
  signin,
  oauthSignin,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
  refreshAccessToken,
  signout,
};