/**
 * reviewService.js
 * ----------------------------------------------------------------------------
 * Purpose: Business logic for product reviews. Enforces "one review per
 *          customer per product" (backstopped at the DB level by Review's
 *          unique compound index from Phase 4) and triggers the Product
 *          rating cache recompute after any create/moderate action.
 */

const Review = require("../models/Review");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");

const createReview = async (customerId, { productId, rating, comment }) => {
  const product = await Product.findById(productId);
  if (!product || product.status !== "approved") {
    throw new ApiError(404, "Product not found");
  }

  let review;
  try {
    review = await Review.create({ product: productId, customer: customerId, rating, comment });
  } catch (err) {
    // MongoDB duplicate-key error code — this is the DB-level backstop for
    // "one review per customer per product" catching a race condition that
    // could slip past an application-level pre-check (see Phase 4 debugging
    // scenario #2 for the full explanation of why this matters).
    if (err.code === 11000) {
      throw new ApiError(409, "You have already reviewed this product");
    }
    throw err;
  }

  await Review.recomputeProductRating(productId);
  return review;
};

const listProductReviews = async (productId, { page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const filter = { product: productId, isApproved: true };

  const [reviews, totalCount] = await Promise.all([
    Review.find(filter).populate("customer", "name").skip(skip).limit(limit).sort({ createdAt: -1 }),
    Review.countDocuments(filter),
  ]);

  return {
    reviews,
    pagination: { currentPage: Number(page), totalPages: Math.ceil(totalCount / limit), totalCount },
  };
};

/**
 * Admin moderation: hide/unhide a review. Rating cache must be recomputed
 * afterward since hiding a review changes which reviews count toward the average.
 */
const moderateReview = async (reviewId, isApproved) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, "Review not found");

  review.isApproved = isApproved;
  await review.save();

  await Review.recomputeProductRating(review.product);
  return review;
};

module.exports = { createReview, listProductReviews, moderateReview };