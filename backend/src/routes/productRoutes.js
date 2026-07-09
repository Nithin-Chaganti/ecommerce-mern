/**
 * productRoutes.js
 * ----------------------------------------------------------------------------
 * Route layout deliberately separates PUBLIC browsing from SELLER management
 * from ADMIN moderation, even though they all touch the same Product model —
 * each has a fundamentally different access rule.
 */

const express = require("express");
const {
  createProduct,
  getPublicProducts,
  getProductById,
  getOwnProducts,
  updateOwnProduct,
  deleteOwnProduct,
  setApprovalStatus,
} = require("../controllers/productController");
const {
  createProductValidationRules,
  updateProductValidationRules,
  listProductsQueryValidationRules,
} = require("../validators/productValidators");
const { body, param } = require("express-validator");
const validateRequest = require("../middleware/validateRequest");
const protect = require("../middleware/authMiddleware");
const restrictTo = require("../middleware/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// ---------------------------------------------------------------------------
// Public routes — anyone can browse
// ---------------------------------------------------------------------------
router.get("/", listProductsQueryValidationRules, validateRequest, asyncHandler(getPublicProducts));
router.get("/:productId", asyncHandler(getProductById));

// ---------------------------------------------------------------------------
// Seller routes — manage own products only
// ---------------------------------------------------------------------------
router.post(
  "/",
  protect,
  restrictTo("seller"),
  createProductValidationRules,
  validateRequest,
  asyncHandler(createProduct)
);
router.get("/mine/list", protect, restrictTo("seller"), asyncHandler(getOwnProducts));
router.patch(
  "/:productId",
  protect,
  restrictTo("seller"),
  updateProductValidationRules,
  validateRequest,
  asyncHandler(updateOwnProduct)
);
router.delete("/:productId", protect, restrictTo("seller"), asyncHandler(deleteOwnProduct));

// ---------------------------------------------------------------------------
// Admin routes — moderation
// ---------------------------------------------------------------------------
router.patch(
  "/:productId/approval",
  protect,
  restrictTo("admin"),
  [param("productId").isMongoId(), body("status").isIn(["approved", "rejected"])],
  validateRequest,
  asyncHandler(setApprovalStatus)
);

module.exports = router;