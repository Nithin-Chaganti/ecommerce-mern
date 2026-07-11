/**
 * uploadService.js
 * ----------------------------------------------------------------------------
 * Purpose: Streams an in-memory file buffer (from Multer) directly to
 *          Cloudinary and returns the resulting secure CDN URL.
 *
 * Why upload_stream instead of writing the buffer to a temp file first:
 * Cloudinary's SDK supports piping a buffer straight into an upload stream —
 * this avoids ANY filesystem interaction on our server entirely, consistent
 * with the memory-storage decision in uploadMiddleware.js.
 */

const cloudinary = require("../config/cloudinary");
const ApiError = require("../utils/ApiError");
const { Readable } = require("stream");

/**
 * @param {Buffer} fileBuffer - raw file bytes from Multer's memory storage
 * @param {string} folder - Cloudinary folder to organize uploads (e.g. "products", "avatars")
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadBufferToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `ecommerce/${folder}`,
        resource_type: "auto", // Handles both images and PDFs (for seller documents)
      },
      (error, result) => {
        if (error) {
          return reject(new ApiError(502, `Cloudinary upload failed: ${error.message}`));
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    // Convert the buffer into a readable stream and pipe it into Cloudinary's
    // upload stream — this is what avoids ever writing to local disk.
    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Uploads multiple files in parallel (used for Product's up-to-8 images).
 */
const uploadMultipleToCloudinary = async (files, folder) => {
  const uploadPromises = files.map((file) => uploadBufferToCloudinary(file.buffer, folder));
  const results = await Promise.all(uploadPromises);
  return results.map((r) => r.url);
};

module.exports = { uploadBufferToCloudinary, uploadMultipleToCloudinary };