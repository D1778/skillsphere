/**
 * src/utils/fileCleanup.js
 *
 * Best-effort deletion of a previously-uploaded file/asset when it's
 * being replaced or removed (profile photo, avatar/logo, cert PDFs,
 * resumes, job attachments, etc.), so nothing accumulates forever.
 *
 * Handles two shapes of URL:
 *  - Cloudinary URLs (https://res.cloudinary.com/...) — everything
 *    uploaded after the Cloudinary migration
 *  - Legacy local /uploads/... URLs — anything saved before that
 *    migration, so old DB records don't error out when this runs
 *    against them
 * Any other URL (e.g. a Google OAuth avatar) is always left alone.
 *
 * Deliberately silent/non-throwing throughout: a failed cleanup (file
 * already gone, permissions hiccup, Cloudinary hiccup, etc.) should
 * never fail the request that triggered it — the DB write is what
 * matters, this is just tidying up after it.
 */
const fs         = require('fs');
const path       = require('path');
const cloudinary = require('../config/cloudinary');

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');

const deleteFromCloudinary = (url) => {
  try {
    // Cloudinary delivery URLs look like:
    // https://res.cloudinary.com/<cloud_name>/<resource_type>/upload/v169.../folder/public_id.ext
    const match = url.match(/\/([a-z]+)\/upload\/(?:v\d+\/)?(.+)$/);
    if (!match) return;

    const [, resourceType, pathAfterUpload] = match;

    // Images: Cloudinary's public_id never includes the file extension —
    // it's appended to the delivery URL separately based on the asset's
    // actual detected format. Raw files (our PDFs) are the opposite: we
    // explicitly set public_id WITH the extension at upload time (see
    // job.routes.js / profile.routes.js), so it has to stay here too or
    // destroy() will look for the wrong asset and silently no-op.
    const publicId = resourceType === 'raw'
      ? pathAfterUpload
      : pathAfterUpload.replace(/\.[^./]+$/, '');

    cloudinary.uploader.destroy(publicId, { resource_type: resourceType }, () => {
      // Ignore errors — best-effort cleanup, see file header.
    });
  } catch {
    // Never let a parsing hiccup break the request that triggered this.
  }
};

const deleteUploadedFile = (url) => {
  if (!url || typeof url !== 'string') return;

  if (url.includes('res.cloudinary.com')) {
    deleteFromCloudinary(url);
    return;
  }

  // Only ever touch files we actually served ourselves under /uploads —
  // never attempt to delete an external URL (e.g. a Google OAuth avatar).
  if (!url.startsWith('/uploads/')) return;

  const filePath = path.join(UPLOADS_ROOT, url.replace(/^\/uploads\//, ''));

  // Guard against path traversal — resolved path must stay inside uploads/.
  if (!filePath.startsWith(UPLOADS_ROOT)) return;

  fs.unlink(filePath, () => {
    // Ignore errors (ENOENT if already gone, etc.) — see file header.
  });
};

module.exports = { deleteUploadedFile };