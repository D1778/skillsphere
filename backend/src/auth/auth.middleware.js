const { verifyAccessToken } = require('../utils/jwt');
const { auth } = require('../config/firebase');
const User                  = require('../user/user.model');
const AppError              = require('../utils/AppError');

/* ════════════════════════════════════════════════
   authenticate
   Protects any route that needs a signed-in user.
   Reads the JWT from Authorization: Bearer <token>
   and attaches the full MongoDB user to req.user.
════════════════════════════════════════════════ */
const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer '))
      return next(new AppError('No token provided. Please sign in.', 401));

    const token   = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User
      .findById(decoded.userId)
      .select('-refreshToken -clerkEmailAddressId');

    if (!user)          return next(new AppError('User no longer exists.', 401));
    if (!user.isActive) return next(new AppError('Account has been deactivated.', 403));

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return next(new AppError('Token expired. Please sign in again.', 401));
    if (err.name === 'JsonWebTokenError')
      return next(new AppError('Invalid token.', 401));
    next(err);
  }
};

/* ════════════════════════════════════════════════
   verifyFirebaseToken
   Used specifically on the /signin and /oauth routes
   before the service layer runs, to do a fast Firebase
   check without touching MongoDB.
   Attaches decoded Firebase claims to req.firebaseUser.
════════════════════════════════════════════════ */
const verifyFirebaseToken = async (req, _res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken)
      return next(new AppError('Firebase ID token is required.', 400));

    req.firebaseUser = await auth.verifyIdToken(idToken);
    next();
  } catch {
    next(new AppError('Invalid or expired Firebase token.', 401));
  }
};

/* ════════════════════════════════════════════════
   authorize(...roles)
   Role-based access guard. Always called AFTER
   authenticate so req.user is available.

   Usage:
     router.get('/jobs', authenticate, authorize('candidate'), handler);
     router.get('/applicants', authenticate, authorize('company'), handler);
     router.get('/admin', authenticate, authorize('candidate','company'), handler);
════════════════════════════════════════════════ */
const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role))
    return next(
      new AppError(`Access denied. Required role: ${roles.join(' or ')}.`, 403)
    );
  next();
};

module.exports = { authenticate, verifyFirebaseToken, authorize };