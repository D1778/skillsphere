/**
 * src/profile/profile.controller.js
 */
const Profile   = require('./profile.model');
const User      = require('../user/user.model');
const AppError  = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const path      = require('path');

/* ── GET /api/profile ── */
const getProfile = async (req, res, next) => {
  try {
    let profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = await Profile.create({ userId: req.user._id });
    }
    sendSuccess(res, { data: { profile } });
  } catch (err) { next(err); }
};

/* ── PATCH /api/profile (autosave + final submit) ── */
const updateProfile = async (req, res, next) => {
  try {
    const body = JSON.parse(req.body.data || '{}');
    const { isComplete, ...rest } = body;

    const update = { ...rest, lastAutosavedAt: new Date() };

    // Handle photo upload — merge into the `personal` object itself,
    // don't set a dotted 'personal.photoUrl' path alongside the whole
    // `personal` object (Mongo rejects writing to a parent + child path
    // in the same $set).
    //
    // IMPORTANT: a photo-only save (no `personal` in the request body,
    // e.g. just changing the avatar) used to overwrite the whole
    // `personal` subdocument with just { photoUrl }, silently wiping
    // fullName/title/etc. Load the existing document first so we always
    // merge on top of what's actually saved, not just what this request sent.
    if (req.files?.photo?.[0]) {
      const existing = update.personal
        ? null
        : await Profile.findOne({ userId: req.user._id }).select('personal').lean();
      update.personal = {
        ...(existing?.personal || {}),
        ...(update.personal || {}),
        photoUrl: `/uploads/${req.files.photo[0].filename}`,
      };
    }

    // Handle cert PDF uploads — keyed by certIndex.
    // Same rule: merge into the `certs` array elements instead of using
    // dotted 'certs.N.certPdfUrl' paths alongside the whole `certs` array.
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        const match = key.match(/^certPdf_(\d+)$/);
        if (match) {
          const idx = parseInt(match[1]);
          if (Array.isArray(update.certs) && update.certs[idx]) {
            update.certs[idx] = {
              ...update.certs[idx],
              certPdfUrl: `/uploads/${req.files[key][0].filename}`,
            };
          }
        }
      });
    }

    // If this is a final submit mark complete and update user flag
    if (isComplete === true) {
      update.isComplete = true;
      update.consent = {
        storage:   body.consent?.storage   ?? false,
        recruiter: body.consent?.recruiter ?? false,
      };
      await User.findByIdAndUpdate(req.user._id, { profileCompleted: true });
    }

    const profile = await Profile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    sendSuccess(res, { message: isComplete ? 'Profile completed.' : 'Draft saved.', data: { profile } });
  } catch (err) { next(err); }
};

module.exports = { getProfile, updateProfile };