/**
 * adminValidators.js
 * ----------------------------------------------------------------------------
 * Purpose: express-validator rule chains for admin endpoints.
 */

const { body, param } = require("express-validator");

const updateUserStatusValidationRules = [
  param("userId").isMongoId().withMessage("Invalid user ID format"),
  body("isActive").isBoolean().withMessage("isActive must be true or false"),
];

module.exports = { updateUserStatusValidationRules };