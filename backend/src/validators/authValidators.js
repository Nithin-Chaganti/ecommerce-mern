/**
 * authValidators.js
 * ----------------------------------------------------------------------------
 * Purpose: express-validator rule chains for every auth endpoint. Kept
 *          separate from the controller so validation rules are reusable
 *          and easy to unit test independently of Express request/response.
 */

const { body } = require("express-validator");

const registerValidationRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),

  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),

  body("role")
    .optional()
    .isIn(["customer", "seller"])
    .withMessage("Role must be either customer or seller"), // admin accounts are seeded, never self-registered

  // Only required when role === "seller" — conditional validation.
  body("storeName")
    .if(body("role").equals("seller"))
    .trim()
    .notEmpty()
    .withMessage("Store name is required for seller registration"),
];

const loginValidationRules = [
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

module.exports = { registerValidationRules, loginValidationRules };