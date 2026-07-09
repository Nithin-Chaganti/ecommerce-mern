const reviewService = require("../services/reviewService");
const ApiResponse = require("../utils/ApiResponse");

const createReview = async (req, res) => {
  const review = await reviewService.createReview(req.user.id, req.body);
  return res.status(201).json(new ApiResponse(201, review, "Review submitted"));
};

const getProductReviews = async (req, res) => {
  const { page, limit } = req.query;
  const result = await reviewService.listProductReviews(req.params.productId, { page, limit });
  return res.status(200).json(new ApiResponse(200, result, "Reviews fetched"));
};

const moderateReview = async (req, res) => {
  const review = await reviewService.moderateReview(req.params.reviewId, req.body.isApproved);
  return res.status(200).json(new ApiResponse(200, review, "Review moderation updated"));
};

module.exports = { createReview, getProductReviews, moderateReview };