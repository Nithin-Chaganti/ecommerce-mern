/**
 * uploadController.js
 * ----------------------------------------------------------------------------
 * Purpose: Thin HTTP layer for all file upload endpoints. Kept generic
 *          (not tied to Product specifically) so the same image-upload
 *          endpoint can be reused for any future feature needing images.
 */

const { uploadMultipleToCloudinary, uploadBufferToCloudinary } = require("../services/uploadService");
const User = require("../models/User");
const SellerProfile = require("../models/SellerProfile");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

/**
 * Generic image upload — returns URLs for the frontend to include in a
 * subsequent Product create/update request. Kept as a separate step (rather
 * than uploading images AS PART OF the product-creation request) so the
 * frontend can show upload progress/previews before the seller finalizes
 * the rest of the product form.
 */
const uploadImages = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "At least one image file is required");
  }

  const urls = await uploadMultipleToCloudinary(req.files, "products");
  return res.status(200).json(new ApiResponse(200, { urls }, "Images uploaded successfully"));
};

/**
 * Avatar upload — uploads AND immediately updates the requesting user's
 * own avatarUrl in one step, since an avatar always belongs to exactly
 * one place (no "preview before attaching" step needed like product images).
 */
const uploadAvatar = async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "An image file is required");
  }

  const { url } = await uploadBufferToCloudinary(req.file.buffer, "avatars");

  const user = await User.findByIdAndUpdate(req.user.id, { avatarUrl: url }, { new: true });

  return res.status(200).json(new ApiResponse(200, { avatarUrl: user.avatarUrl }, "Avatar updated"));
};

/**
 * Seller verification document upload — updates the requesting seller's
 * OWN SellerProfile only (req.user.id, never a client-supplied seller ID —
 * same ownership-by-construction pattern used throughout this project).
 */
const uploadSellerDocument = async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "A document file is required");
  }

  const { url } = await uploadBufferToCloudinary(req.file.buffer, "seller-documents");

  const profile = await SellerProfile.findOneAndUpdate(
    { user: req.user.id },
    { verificationDocumentUrl: url },
    { new: true }
  );

  if (!profile) {
    throw new ApiError(404, "Seller profile not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { verificationDocumentUrl: profile.verificationDocumentUrl }, "Document uploaded"));
};

module.exports = { uploadImages, uploadAvatar, uploadSellerDocument };