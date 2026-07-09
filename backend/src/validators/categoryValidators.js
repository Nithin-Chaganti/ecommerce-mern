const { body, param } = require("express-validator");

const createCategoryValidationRules = [
  body("name").trim().notEmpty().withMessage("Category name is required").isLength({ max: 100 }),
  body("parentCategory").optional({ nullable: true }).isMongoId().withMessage("Invalid parent category ID"),
];

const updateCategoryValidationRules = [
  param("categoryId").isMongoId().withMessage("Invalid category ID"),
  body("name").optional().trim().isLength({ max: 100 }),
  body("isActive").optional().isBoolean(),
];

module.exports = { createCategoryValidationRules, updateCategoryValidationRules };