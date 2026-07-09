const { body, param, query } = require("express-validator");

const createProductValidationRules = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 200 }),
  body("description").trim().notEmpty().withMessage("Description is required").isLength({ max: 5000 }),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("stock").isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
  body("category").isMongoId().withMessage("Valid category ID is required"),
  body("images").isArray({ min: 1, max: 8 }).withMessage("Provide between 1 and 8 image URLs"),
  body("discountPercent").optional().isFloat({ min: 0, max: 90 }),
  body("tags").optional().isArray(),
];

const updateProductValidationRules = [
  param("productId").isMongoId().withMessage("Invalid product ID"),
  body("title").optional().trim().isLength({ max: 200 }),
  body("price").optional().isFloat({ min: 0 }),
  body("stock").optional().isInt({ min: 0 }),
  body("discountPercent").optional().isFloat({ min: 0, max: 90 }),
];

const listProductsQueryValidationRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
  query("search").optional().trim().isLength({ max: 200 }).withMessage("search term too long"),
  query("category").optional().isMongoId().withMessage("Invalid category ID"),
  query("minPrice").optional().isFloat({ min: 0 }).withMessage("minPrice must be a positive number"),
  query("maxPrice").optional().isFloat({ min: 0 }).withMessage("maxPrice must be a positive number"),
  query("minRating").optional().isFloat({ min: 0, max: 5 }).withMessage("minRating must be between 0 and 5"),
  query("inStock").optional().isBoolean().withMessage("inStock must be true or false"),
  query("sortBy")
    .optional()
    .isIn(["newest", "priceLowHigh", "priceHighLow", "rating"])
    .withMessage("Invalid sortBy value"),
];

module.exports = {
  createProductValidationRules,
  updateProductValidationRules,
  listProductsQueryValidationRules,
};