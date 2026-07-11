/**
 * uploadRoutes.js
 * ----------------------------------------------------------------------------
 * All upload routes require authentication — anonymous file uploads are a
 * common abuse vector (storage-cost DoS), so every route here is protected.
 */

const express = require("express");
const { uploadImages, uploadAvatar, uploadSellerDocument } = require("../controllers/uploadController");
const { upload, uploadDocument } = require("../middleware/uploadMiddleware");
const protect = require("../middleware/authMiddleware");
const restrictTo = require("../middleware/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(protect);

// Sellers upload product images (up to 8, matching Product's schema validation)
router.post(
  "/images",
  restrictTo("seller"),
  upload.array("images", 8),
  asyncHandler(uploadImages)
);

// Any authenticated user can update their own avatar
router.post("/avatar", upload.single("avatar"), asyncHandler(uploadAvatar));

// Sellers upload their own verification document
router.post(
  "/seller-document",
  restrictTo("seller"),
  uploadDocument.single("document"),
  asyncHandler(uploadSellerDocument)
);

module.exports = router;