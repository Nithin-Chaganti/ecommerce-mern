/**
 * Review.js
 * ----------------------------------------------------------------------------
 * Purpose: Customer reviews and ratings on products. Also stores the
 *          sentiment analysis result (Phase 13 AI feature) once computed.
 *
 * Design decisions:
 * - Referenced to both Product and User (customer) — reviews need to be
 *   queried both "all reviews for product X" and "all reviews by user Y",
 *   so embedding on either parent would break the other query pattern.
 * - Unique compound index on (product, customer) enforces "one review per
 *   customer per product" at the DB level — prevents review spam without
 *   needing extra application-level checks on every write.
 * - `sentimentScore`/`sentimentLabel` are populated by the `sentiment` npm
 *   package in a post-save hook (Phase 13) — kept nullable now since AI
 *   features aren't built until later.
 */

const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, "Review comment cannot exceed 1000 characters"],
    },
    isApproved: {
      type: Boolean,
      default: true, // Admin can moderate/hide a review by setting this false
    },
    sentimentScore: {
      type: Number,
      default: null, // Populated in Phase 13 by the `sentiment` npm package
    },
    sentimentLabel: {
      type: String,
      enum: ["positive", "neutral", "negative", null],
      default: null,
    },
  },
  { timestamps: true }
);

// Enforces "one review per customer per product" at the database level.
reviewSchema.index({ product: 1, customer: 1 }, { unique: true });

// Supports "all reviews for product X, newest first" (product listing page).
reviewSchema.index({ product: 1, createdAt: -1 });

/**
 * Phase 7 addition: recomputes the denormalized ratingsAverage/ratingsCount
 * cached on Product (decided in Phase 4 — see DECISION_LOG.md) whenever a
 * review is created, updated, or deleted. Only APPROVED reviews count,
 * keeping moderated-out reviews from skewing the public-facing average.
 *
 * Implemented as a static (called explicitly from reviewService) rather than
 * a post-save hook — this avoids requiring the Product model at the top of
 * this file purely for a side effect, and keeps the recompute trigger
 * visible in the service layer where the rest of the review business logic lives.
 */
reviewSchema.statics.recomputeProductRating = async function (productId) {
  const Product = mongoose.model("Product");

  const stats = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), isApproved: true } },
    { $group: { _id: "$product", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const { avgRating = 0, count = 0 } = stats[0] || {};

  await Product.findByIdAndUpdate(productId, {
    ratingsAverage: avgRating,
    ratingsCount: count,
  });
};

module.exports = mongoose.model("Review", reviewSchema);