/**
 * src/utils/fileCleanup.js
 *
 * Best-effort deletion of a previously-uploaded file when it's being
 * replaced or removed (profile photo, company logo, cert PDFs, etc.),
 * so /uploads doesn't just accumulate orphaned files forever.
 *
 * Deliberately silent/non-throwing: a failed cleanup (file already
 * gone, permissions hiccup, etc.) should never fail the request that
 * triggered it — the DB write is what matters, this is just tidying up.
 */
const fs   = require('fs');
const path = require('path');

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');

const deleteUploadedFile = (relativeUrl) => {
  if (!relativeUrl || typeof relativeUrl !== 'string') return;
  // Only ever touch files we actually served ourselves under /uploads —
  // never attempt to delete an external URL (e.g. a Google OAuth avatar).
  if (!relativeUrl.startsWith('/uploads/')) return;

  const filePath = path.join(UPLOADS_ROOT, relativeUrl.replace(/^\/uploads\//, ''));

  // Guard against path traversal — resolved path must stay inside uploads/.
  if (!filePath.startsWith(UPLOADS_ROOT)) return;

  fs.unlink(filePath, () => {
    // Ignore errors (ENOENT if already gone, etc.) — see note above.
  });
};

module.exports = { deleteUploadedFile };