const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const authRoutes    = require('./auth/auth.routes');
const userRoutes    = require('./user/user.routes');
const profileRoutes = require('./profile/profile.routes');
const githubRoutes  = require('./github/github.routes');
const roadmapRoutes = require('./roadmap/roadmap.routes');
const jobRoutes      = require('./job/job.routes');
const candidateRoutes = require('./candidate/candidate.routes');
const AppError      = require('./utils/AppError');

const app = express();

// helmet()'s default Cross-Origin-Resource-Policy is 'same-origin', which
// blocks the browser from rendering <img src="http://localhost:5000/uploads/..">
// when the page itself is served from a different origin (e.g. the Vite
// dev server on :5173). That's exactly our setup — the frontend and API
// run on different ports/origins, and profile photos, company logos,
// certs, etc. are all loaded directly from the backend. Relaxing this to
// 'cross-origin' is what fixes the "ERR_BLOCKED_BY_RESPONSE.NotSameOrigin"
// console error on those images. This only affects the CORP response
// header (safe to loosen for public, non-sensitive static assets); it
// does not disable any other helmet protection.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

/* ── Serve uploaded files ── */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/* ── Rate limiters ──
   IMPORTANT: globalLimiter runs on every single request regardless of
   route, so it was previously sharing one 100-req/15min bucket between
   routine dashboard traffic (roadmap, GitHub repos, profile, several
   requests per page load) and sensitive auth endpoints. Burning through
   it on the candidate side would then silently block unrelated auth
   calls like signup/send-otp for the next 15 minutes, from any account.
   Sized generously here since it's meant as a DDoS backstop, not a
   per-feature throttle — routes that actually need tighter limits
   (auth, roadmap generation) get their own dedicated limiter instead. */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 600,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 30,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

app.use(globalLimiter);

app.get('/health', (_req, res) => res.json({ success: true, message: 'SkillSphere API is running ✅' }));

app.use('/api/auth',    authLimiter, authRoutes);
app.use('/api/user',    userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/github',  githubRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/jobs',    jobRoutes);
app.use('/api/candidates', candidateRoutes);

app.use((req, _res, next) => next(new AppError(`Route ${req.originalUrl} not found.`, 404)));

app.use((err, _req, res, _next) => {
  console.error(`[Error] ${err.message}`);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Internal server error.' });
});

module.exports = app;