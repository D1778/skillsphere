const AppError = require('../utils/AppError');

/* ── helpers ─────────────────────────────────────── */
const requireField = (val, name) => {
  if (val === undefined || val === null || (typeof val === 'string' && !val.trim()))
    throw new AppError(`${name} is required.`, 400);
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const wrap = (fn) => (req, res, next) => {
  try { fn(req, res, next); } catch (err) { next(err); }
};

/* ════════════════════════════════════════════════════
   validateSendSignupOtp
   POST /api/auth/signup/send-otp
   Body: { email }
════════════════════════════════════════════════════ */
const validateSendSignupOtp = wrap((req, _res, next) => {
  const { email } = req.body;
  requireField(email, 'Email');
  if (!isValidEmail(email))
    throw new AppError('Please enter a valid email address.', 400);
  next();
});

/* ════════════════════════════════════════════════════
   validateVerifySignupOtp
   POST /api/auth/signup/verify-otp
   Body: { email, code }
   (clerkEmailAddressId removed — OTP is now self-hosted)
════════════════════════════════════════════════════ */
const validateVerifySignupOtp = wrap((req, _res, next) => {
  const { email, code } = req.body;
  requireField(email, 'Email');
  requireField(code,  'OTP code');
  if (!/^\d{6}$/.test(String(code)))
    throw new AppError('OTP code must be exactly 6 digits.', 400);
  next();
});

/* ════════════════════════════════════════════════════
   validateSignup
   POST /api/auth/signup
   Body: { email, password, role, fullName?, companyName? }
════════════════════════════════════════════════════ */
const validateSignup = wrap((req, _res, next) => {
  const { email, password, role, fullName, companyName } = req.body;

  requireField(email,    'Email');
  requireField(password, 'Password');
  requireField(role,     'Role');

  if (!isValidEmail(email))
    throw new AppError('Please enter a valid email address.', 400);

  if (!['candidate', 'company'].includes(role))
    throw new AppError('Role must be either candidate or company.', 400);

  if (password.length < 8)
    throw new AppError('Password must be at least 8 characters.', 400);

  if (role === 'candidate' && !fullName?.trim())
    throw new AppError('Full name is required for candidates.', 400);

  if (role === 'company' && !companyName?.trim())
    throw new AppError('Company name is required for companies.', 400);

  next();
});

/* ════════════════════════════════════════════════════
   validateSignin
   POST /api/auth/signin
   Body: { idToken, role? }
════════════════════════════════════════════════════ */
const validateSignin = wrap((req, _res, next) => {
  requireField(req.body.idToken, 'Firebase ID token');
  next();
});

/* ════════════════════════════════════════════════════
   validateOAuth
   POST /api/auth/oauth
════════════════════════════════════════════════════ */
const validateOAuth = wrap((req, _res, next) => {
  const { idToken, provider, role, fullName, companyName } = req.body;

  requireField(idToken,  'Firebase ID token');
  requireField(provider, 'Provider');

  if (!['google', 'github'].includes(provider))
    throw new AppError('Provider must be google or github.', 400);

  if (role && !['candidate', 'company'].includes(role))
    throw new AppError('Role must be either candidate or company.', 400);

  if (role === 'candidate' && fullName !== undefined && !fullName.trim())
    throw new AppError('Full name cannot be empty.', 400);

  if (role === 'company' && companyName !== undefined && !companyName.trim())
    throw new AppError('Company name cannot be empty.', 400);

  next();
});

/* ════════════════════════════════════════════════════
   validateSendOtp  (forgot password)
   Body: { email }
════════════════════════════════════════════════════ */
const validateSendOtp = wrap((req, _res, next) => {
  const { email } = req.body;
  requireField(email, 'Email');
  if (!isValidEmail(email))
    throw new AppError('Please enter a valid email address.', 400);
  next();
});

/* ════════════════════════════════════════════════════
   validateVerifyOtp  (forgot password)
   Body: { email, code }
   (clerkEmailAddressId removed — OTP is now self-hosted)
════════════════════════════════════════════════════ */
const validateVerifyOtp = wrap((req, _res, next) => {
  const { email, code } = req.body;
  requireField(email, 'Email');
  requireField(code,  'OTP code');
  if (!/^\d{6}$/.test(String(code)))
    throw new AppError('OTP code must be exactly 6 digits.', 400);
  next();
});

/* ════════════════════════════════════════════════════
   validateResetPassword
   Body: { resetToken, newPassword }
════════════════════════════════════════════════════ */
const validateResetPassword = wrap((req, _res, next) => {
  const { resetToken, newPassword } = req.body;
  requireField(resetToken,  'Reset token');
  requireField(newPassword, 'New password');
  if (newPassword.length < 8)
    throw new AppError('Password must be at least 8 characters.', 400);
  next();
});

/* ════════════════════════════════════════════════════
   validateRefresh
   Body: { refreshToken }
════════════════════════════════════════════════════ */
const validateRefresh = wrap((req, _res, next) => {
  requireField(req.body.refreshToken, 'Refresh token');
  next();
});

module.exports = {
  validateSendSignupOtp,
  validateVerifySignupOtp,
  validateSignup,
  validateSignin,
  validateOAuth,
  validateSendOtp,
  validateVerifyOtp,
  validateResetPassword,
  validateRefresh,
};