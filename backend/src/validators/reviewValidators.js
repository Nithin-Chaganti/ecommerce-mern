const { body, param } = require("express-validator");

const createReviewValidationRules = [
  body("productId").isMongoId().withMessage("Valid product ID is required"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment").optional().trim().isLength({ max: 1000 }),
];

const moderateReviewValidationRules = [
  param("reviewId").isMongoId().withMessage("Invalid review ID"),
  body("isApproved").isBoolean().withMessage("isApproved must be true or false"),
];

module.exports = { createReviewValidationRules, moderateReviewValidationRules };