/**
 * validateRequest.js
 * ----------------------------------------------------------------------------
 * Purpose: Runs express-validator's collected validation results and, if any
 *          failed, converts them into our standard ApiError shape — so every
 *          validation failure across the whole API returns the SAME response
 *          format as any other error.
 *
 * Usage pattern: attach express-validator rule chains as middleware, then
 * this handler as the final middleware before the controller:
 *
 *   router.post("/register", registerValidationRules, validateRequest, asyncHandler(register));
 */

const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Map express-validator's error format into a simpler { field, message } shape
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return next(new ApiError(400, "Validation failed", formattedErrors));
  }

  next();
};

module.exports = validateRequest;