/**
 * sellerRoutes.js
 * ----------------------------------------------------------------------------
 * Purpose: Wires up /api/v1/seller/* endpoints — self-service only in this
 * phase. Product/order management routes are added in Phase 7 onward,
 * following this exact same protect + restrictTo("seller","admin") pattern,
 * PLUS a resource-ownership check inside the service layer (e.g.
 * `if (product.seller.toString() !== req.user.id) throw new ApiError(403, ...)`)
 * before allowing any update/delete — that ownership check is what Phase 6's
 * role middleware alone CANNOT provide (see roleMiddleware.js header comment).
 */

const express = require("express");
const {
  getMyProfile,
  updateSellerProfile,
  listSellerOrders,
  updateOrderItemStatus,
  getSellerAnalytics,
} = require("../controllers/sellerController");
const protect = require("../middleware/authMiddleware");
const restrictTo = require("../middleware/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Admin is included here too — a common real-world pattern where admins can
// view/impersonate-check seller-facing data for support purposes.
router.use(protect, restrictTo("seller", "admin"));

router.get("/profile", asyncHandler(getMyProfile));
router.patch("/profile", asyncHandler(updateSellerProfile));
router.get("/orders", asyncHandler(listSellerOrders));
router.patch("/orders/:orderId/items/:itemId/status", asyncHandler(updateOrderItemStatus));
router.get("/analytics", asyncHandler(getSellerAnalytics));

module.exports = router;