/**
 * uploadMiddleware.js
 * ----------------------------------------------------------------------------
 * Purpose: Configures Multer to receive multipart/form-data file uploads
 *          INTO MEMORY (never written to our server's disk), then validated
 *          and forwarded to Cloudinary by the upload service.
 *
 * Why memory storage, not disk storage:
 * 1. Render/Railway containers are often ephemeral — a file written to local
 *    disk could simply vanish on the next redeploy/restart.
 * 2. We immediately re-upload to Cloudinary anyway, so writing to disk first
 *    would just be a wasted intermediate step with its own cleanup burden
 *    (orphaned temp files if the process crashes mid-upload).
 *
 * Security notes:
 * - `fileFilter` checks MIME type, but MIME type alone is CLIENT-SUPPLIED and
 *   can be spoofed (e.g. renaming a .exe to .jpg with a faked Content-Type).
 *   This is a first line of defense, not the only one — Cloudinary itself
 *   validates the actual file content server-side before accepting it.
 * - `limits.fileSize` caps upload size to prevent large-payload abuse/DoS.
 */

const multer = require("multer");
const ApiError = require("../utils/ApiError");

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per file

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new ApiError(400, "Only JPEG, PNG, and WEBP images are allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 8 }, // Matches Product's 8-image max (Phase 4)
});

// PDF allowed additionally for seller verification documents (a separate,
// more permissive filter since GST certificates/ID proofs are often PDFs).
const documentFileFilter = (req, file, cb) => {
  const allowed = [...ALLOWED_MIME_TYPES, "application/pdf"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new ApiError(400, "Only JPEG, PNG, WEBP, or PDF files are allowed"), false);
  }
  cb(null, true);
};

const uploadDocument = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
});

module.exports = { upload, uploadDocument };