/**
 * categoryRoutes.js
 * ----------------------------------------------------------------------------
 * Public: GET (anyone browsing the store needs to see categories, logged in or not)
 * Admin only: POST, PATCH, DELETE
 */

const express = require("express");
const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const {
  createCategoryValidationRules,
  updateCategoryValidationRules,
} = require("../validators/categoryValidators");
const validateRequest = require("../middleware/validateRequest");
const protect = require("../middleware/authMiddleware");
const restrictTo = require("../middleware/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Public route — no auth required
router.get("/", asyncHandler(getCategories));

// Admin-only routes below
router.post(
  "/",
  protect,
  restrictTo("admin"),
  createCategoryValidationRules,
  validateRequest,
  asyncHandler(createCategory)
);
router.patch(
  "/:categoryId",
  protect,
  restrictTo("admin"),
  updateCategoryValidationRules,
  validateRequest,
  asyncHandler(updateCategory)
);
router.delete("/:categoryId", protect, restrictTo("admin"), asyncHandler(deleteCategory));

module.exports = router;