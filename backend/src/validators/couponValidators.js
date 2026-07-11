const { body, param } = require("express-validator");

const createCouponValidationRules = [
  body("code").trim().isLength({ min: 4, max: 20 }).withMessage("Code must be 4-20 characters"),
  body("discountType").isIn(["percentage", "flat"]).withMessage("discountType must be percentage or flat"),
  body("discountValue").isFloat({ min: 0 }).withMessage("discountValue must be a positive number"),
  body("minOrderValue").optional().isFloat({ min: 0 }),
  body("maxDiscountAmount").optional({ nullable: true }).isFloat({ min: 0 }),
  body("expiresAt").isISO8601().withMessage("expiresAt must be a valid date"),
  body("usageLimit").optional({ nullable: true }).isInt({ min: 1 }),
];

const updateCouponValidationRules = [
  param("couponId").isMongoId(),
  body("isActive").optional().isBoolean(),
  body("expiresAt").optional().isISO8601(),
];

module.exports = { createCouponValidationRules, updateCouponValidationRules };