const User            = require('./user.model');
const Profile         = require('../profile/profile.model');
const AppError        = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { deleteUploadedFile } = require('../utils/fileCleanup');

/* ════════════════════════════════════════════════
   GET /api/user/me
   Returns the authenticated user's full profile.
   req.user is already attached by authenticate().
════════════════════════════════════════════════ */
const getMe = async (req, res, next) => {
  try {
    // Re-fetch to get the latest data (req.user was set at token creation time)
    const user = await User.findById(req.user._id);

    if (!user) return next(new AppError('User not found.', 404));

    // Use the same toPublic() shape as signin/signup/oauth so the frontend
    // always gets a consistent { id, displayName, profileCompleted, ... }
    // object no matter which endpoint it called. Previously this returned
    // the raw Mongoose doc, so `displayName` (a virtual) was silently
    // missing and every dashboard reload showed stale/incorrect data.
    sendSuccess(res, { data: { user: user.toPublic() } });
  } catch (err) {
    next(err);
  }
};

/* ════════════════════════════════════════════════
   PATCH /api/user/me
   Update display name or photo for the signed-in user.
   Body: { fullName?, companyName?, photoURL? }
════════════════════════════════════════════════ */
const updateMe = async (req, res, next) => {
  try {
    const { fullName, companyName, photoURL, socialLinks } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return next(new AppError('User not found.', 404));

    if (user.role === 'candidate' && fullName?.trim())
      user.fullName = fullName.trim();

    if (user.role === 'company' && companyName?.trim())
      user.companyName = companyName.trim();

    if (photoURL?.trim())
      user.photoURL = photoURL.trim();

    // Merge onto the existing subdocument so saving just the LinkedIn
    // field (say) doesn't blank out a Twitter link that was already
    // there — same "load what's there first" rule as the profile
    // controller's photo/cert merges.
    if (socialLinks && typeof socialLinks === 'object') {
      user.socialLinks = {
        linkedin: socialLinks.linkedin?.trim() ?? user.socialLinks?.linkedin ?? '',
        twitter:  socialLinks.twitter?.trim()  ?? user.socialLinks?.twitter  ?? '',
      };
    }

    await user.save();

    sendSuccess(res, {
      message: 'Profile updated successfully.',
      data:    { user: user.toPublic() },
    });
  } catch (err) {
    next(err);
  }
};

/* ════════════════════════════════════════════════
   POST /api/user/me/photo
   Uploads/replaces the signed-in user's avatar (candidate headshot
   or company logo — both just live on User.photoURL). Multer has
   already written the file to /uploads and attached it as req.file
   by the time this runs.
════════════════════════════════════════════════ */
const uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No image file was uploaded. Use JPEG, PNG or WebP under 5MB.', 400));
    }

    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError('User not found.', 404));

    const previousPhotoUrl = user.photoURL || '';
    user.photoURL = `/uploads/${req.file.filename}`;
    await user.save();

    // Clean up the file this one just replaced (if it was one of ours —
    // deleteUploadedFile() ignores external/OAuth avatar URLs).
    if (previousPhotoUrl && previousPhotoUrl !== user.photoURL) {
      deleteUploadedFile(previousPhotoUrl);
    }

    sendSuccess(res, {
      message: 'Photo updated successfully.',
      data:    { user: user.toPublic() },
    });
  } catch (err) {
    next(err);
  }
};

/* ════════════════════════════════════════════════
   DELETE /api/user/me/photo
   Removes the current avatar/logo entirely — the frontend then falls
   back to the initials placeholder, same as a brand-new account that
   never uploaded one.
════════════════════════════════════════════════ */
const removePhoto = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError('User not found.', 404));

    const previousPhotoUrl = user.photoURL || '';
    user.photoURL = null;
    await user.save();

    deleteUploadedFile(previousPhotoUrl);

    sendSuccess(res, {
      message: 'Photo removed.',
      data:    { user: user.toPublic() },
    });
  } catch (err) {
    next(err);
  }
};

/* ════════════════════════════════════════════════
   DELETE /api/user/me
   Permanently deletes the signed-in user's account.
   Body: { confirmText }  — must be exactly "DELETE".
   The frontend also gates this behind a checkbox + typed
   confirmation, but the backend re-checks it too so the
   endpoint can never be hit by accident (e.g. a stray
   script or a replayed request) without the same intent.
════════════════════════════════════════════════ */
const deleteMe = async (req, res, next) => {
  try {
    if (req.body?.confirmText !== 'DELETE') {
      return next(new AppError('Type DELETE to confirm account deletion.', 400));
    }

    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError('User not found.', 404));

    // Best-effort: remove the candidate's profile doc too, so deleting
    // the account doesn't leave an orphaned profile behind. Missing/absent
    // profile (e.g. company accounts) is fine — findOneAndDelete just
    // resolves to null rather than throwing.
    try {
      await Profile.findOneAndDelete({ userId: user._id });
    } catch (profileErr) {
      console.error(`[Account deletion] Could not remove profile for user ${user._id}:`, profileErr.message);
    }

    await User.findByIdAndDelete(user._id);

    sendSuccess(res, { message: 'Account deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMe, updateMe, deleteMe, uploadPhoto, removePhoto };