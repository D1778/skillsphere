/**
 * auth.service.js
 * All business logic for authentication.
 *
 * Sections:
 *   1. Internal helpers    — issueTokens, verifyFirebaseIdToken
 *   2. Firebase helpers    — createUser, updatePassword, deleteUser
 *   3. Service methods     — sendSignupOtp, verifySignupOtp, signup,
 *                            signin, oauthSignin, forgotPassword flow,
 *                            refreshTokens, signout
 *
 * NOTE: Clerk OTP was removed because @clerk/backend v3 dropped
 * createEmailAddressVerification / verifyEmailAddress from its API.
 * OTP is now handled by src/utils/otp.js (Nodemailer + MongoDB).
 * clerk.js config is no longer imported here; you can keep the file
 * for future Clerk features or delete it.
 */

const bcrypt   = require('bcryptjs');
const { auth } = require('../config/firebase');
const User     = require('../user/user.model');
const AppError = require('../utils/AppError');
const { sendOtp, verifyOtp } = require('../utils/otp');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateResetToken,
  verifyResetToken,
} = require('../utils/jwt');

const SALT_ROUNDS = 12;

/* ══════════════════════════════════════════════════
   1. INTERNAL HELPERS
══════════════════════════════════════════════════ */

const issueTokens = async (user) => {
  const accessToken  = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = await bcrypt.hash(refreshToken, SALT_ROUNDS);
  user.lastLoginAt  = new Date();
  await user.save();

  return { accessToken, refreshToken };
};

const verifyFirebaseIdToken = async (idToken) => {
  try {
    return await auth.verifyIdToken(idToken);
  } catch {
    throw new AppError('Invalid or expired Firebase token. Please sign in again.', 401);
  }
};

/* ══════════════════════════════════════════════════
   2. FIREBASE HELPERS
══════════════════════════════════════════════════ */

const createFirebaseUser = async (email, password) => {
  try {
    const record = await auth.createUser({ email, password });
    return record.uid;
  } catch (err) {
    if (err.code === 'auth/email-already-exists')
      throw new AppError('An account with this email already exists.', 409);
    console.error('[Firebase] createUser error:', err.message);
    throw new AppError('Failed to create auth account. Please try again.', 500);
  }
};

const updateFirebasePassword = async (firebaseUid, newPassword) => {
  try {
    // Works even for users originally created via Google/GitHub —
    // Firebase simply adds/updates the "password" sign-in provider
    // on the existing account rather than requiring it to already exist.
    await auth.updateUser(firebaseUid, { password: newPassword });
  } catch (err) {
    console.error('[Firebase] updatePassword error:', err.message);
    throw new AppError('Failed to update password. Please try again.', 500);
  }
};

const deleteFirebaseUser = async (firebaseUid) => {
  try {
    await auth.deleteUser(firebaseUid);
  } catch (err) {
    console.error('[Firebase] rollback deleteUser failed:', err.message);
  }
};

/* ══════════════════════════════════════════════════
   3. SERVICE METHODS
══════════════════════════════════════════════════ */

/**
 * SIGNUP OTP — step 1
 * Rejects immediately if the email is already registered.
 */
const sendSignupOtp = async (email) => {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing)
    throw new AppError('An account with this email already exists. Please sign in.', 409);

  await sendOtp(email.toLowerCase(), 'signup');
  // Nothing to return — frontend just needs to know the email was sent
};

/**
 * SIGNUP OTP — step 2
 * Verifies the code. No DB writes — account not created yet.
 */
const verifySignupOtp = async ({ email, code }) => {
  // Guard against race condition
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing)
    throw new AppError('An account with this email already exists. Please sign in.', 409);

  await verifyOtp(email.toLowerCase(), 'signup', code);
};

/**
 * SIGNUP — email / password (step 3 of the OTP-gated flow)
 */
const signup = async ({ email, password, role, fullName, companyName }) => {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing)
    throw new AppError('An account with this email already exists.', 409);

  const firebaseUid = await createFirebaseUser(email, password);

  let user;
  try {
    user = await User.create({
      firebaseUid,
      email:       email.toLowerCase(),
      role,
      fullName:    role === 'candidate' ? fullName.trim()    : undefined,
      companyName: role === 'company'   ? companyName.trim() : undefined,
      provider:    'email',
      isVerified:  true,
    });
  } catch (err) {
    await deleteFirebaseUser(firebaseUid);
    throw err;
  }

  const tokens = await issueTokens(user);
  return { user: user.toPublic(), ...tokens };
};

/**
 * SIGNIN — email / password
 */
const signin = async ({ idToken, role }) => {
  const decoded = await verifyFirebaseIdToken(idToken);
  const email   = decoded.email?.toLowerCase();

  if (!email)
    throw new AppError('Could not retrieve email from Firebase token.', 400);

  const user = await User.findOne({ email });
  if (!user)
    throw new AppError('No account found with this email. Please sign up.', 404);
  if (!user.isActive)
    throw new AppError('This account has been deactivated.', 403);

  if (role && user.role !== role)
    throw new AppError(
      `This account is registered as a ${user.role}. Please use the correct sign-in tab.`,
      403
    );

  const tokens = await issueTokens(user);
  return { user: user.toPublic(), ...tokens };
};

/**
 * OAUTH SIGNUP / SIGNIN — Google & GitHub
 */
const oauthSignin = async ({ idToken, provider = 'google', role, fullName, companyName }) => {
  const decoded      = await verifyFirebaseIdToken(idToken);
  const email        = decoded.email?.toLowerCase();
  const firebaseUid  = decoded.uid;
  const photoURL     = decoded.picture || null;
  const providerName = decoded.name    || null;

  if (!email)
    throw new AppError('OAuth provider did not return an email address.', 400);

  let user = await User.findOne({ email });

  if (!user) {
    if (!role || !['candidate', 'company'].includes(role))
      throw new AppError(
        'Role (candidate or company) is required for first-time sign-up.',
        400
      );

    const resolvedFullName    = fullName?.trim()    || providerName || '';
    const resolvedCompanyName = companyName?.trim() || providerName || '';

    user = await User.create({
      firebaseUid,
      email,
      role,
      fullName:    role === 'candidate' ? resolvedFullName    : undefined,
      companyName: role === 'company'   ? resolvedCompanyName : undefined,
      photoURL,
      provider,
      isVerified: true,
    });
  } else {
    if (!user.isActive)
      throw new AppError('This account has been deactivated.', 403);

    if (role && user.role !== role)
      throw new AppError(
        `This account is registered as a ${user.role}. Please use the correct sign-in tab.`,
        403
      );

    if (photoURL && user.photoURL !== photoURL) {
      user.photoURL = photoURL;
      await user.save();
    }
  }

  const tokens = await issueTokens(user);
  return { user: user.toPublic(), ...tokens };
};

/**
 * FORGOT PASSWORD — step 1
 * Silently does nothing if email isn't registered (no enumeration).
 *
 * NOTE: We no longer block this for Google/GitHub accounts. Any
 * registered account — regardless of how it originally signed up —
 * can request an OTP and set/replace an email+password credential.
 * This lets OAuth-only users "add" a password login going forward.
 */
const sendForgotPasswordOtp = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return { emailExists: false };

  await sendOtp(email.toLowerCase(), 'forgot-password');
  return { emailExists: true };
};

/**
 * FORGOT PASSWORD — step 2
 */
const verifyForgotPasswordOtp = async ({ email, code }) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new AppError('Account not found.', 404);

  await verifyOtp(email.toLowerCase(), 'forgot-password', code);

  return { resetToken: generateResetToken(user._id) };
};

/**
 * FORGOT PASSWORD — step 3
 *
 * For accounts that originally signed up via Google/GitHub (no
 * firebaseUid-linked password yet), this call adds a password
 * credential to their existing Firebase user rather than requiring
 * one to already exist. We also flip `provider` to 'email' so the
 * account is documented as having a password login available —
 * remove this line if you'd rather preserve the original signup
 * provider for display purposes only.
 */
const resetPassword = async ({ resetToken, newPassword }) => {
  let decoded;
  try {
    decoded = verifyResetToken(resetToken);
  } catch {
    throw new AppError('Reset link has expired. Please request a new OTP.', 400);
  }

  const user = await User.findById(decoded.userId);
  if (!user) throw new AppError('Account not found.', 404);

  await updateFirebasePassword(user.firebaseUid, newPassword);

  user.refreshToken = null;
  await user.save();
};

/**
 * REFRESH TOKENS
 */
const refreshTokens = async (refreshToken) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid or expired refresh token. Please sign in again.', 401);
  }

  const user = await User.findById(decoded.userId);
  if (!user?.refreshToken)
    throw new AppError('Session expired. Please sign in again.', 401);

  const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
  if (!isValid)
    throw new AppError('Invalid refresh token.', 401);

  return issueTokens(user);
};

/**
 * SIGN OUT
 */
const signout = async (refreshToken) => {
  if (!refreshToken) return;
  try {
    const decoded = verifyRefreshToken(refreshToken);
    await User.findByIdAndUpdate(decoded.userId, { refreshToken: null });
  } catch {
    // already expired — treat as signed out
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
  refreshTokens,
  signout,
};