const { body, param } = require("express-validator");

const addToCartValidationRules = [
  body("productId").isMongoId().withMessage("Valid product ID is required"),
  body("quantity").optional().isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
];

const updateCartItemValidationRules = [
  param("productId").isMongoId().withMessage("Invalid product ID"),
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
];

module.exports = { addToCartValidationRules, updateCartItemValidationRules };