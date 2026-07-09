const express = require("express");
const {
  createReview,
  getProductReviews,
  moderateReview,
} = require("../controllers/reviewController");
const {
  createReviewValidationRules,
  moderateReviewValidationRules,
} = require("../validators/reviewValidators");
const validateRequest = require("../middleware/validateRequest");
const protect = require("../middleware/authMiddleware");
const restrictTo = require("../middleware/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Public: anyone can read approved reviews for a product
router.get("/product/:productId", asyncHandler(getProductReviews));

// Customer: create a review
router.post(
  "/",
  protect,
  restrictTo("customer"),
  createReviewValidationRules,
  validateRequest,
  asyncHandler(createReview)
);

// Admin: moderate (hide/unhide) a review
router.patch(
  "/:reviewId/moderate",
  protect,
  restrictTo("admin"),
  moderateReviewValidationRules,
  validateRequest,
  asyncHandler(moderateReview)
);

module.exports = router;