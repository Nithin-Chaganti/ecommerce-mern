/**
 * notFoundHandler.js
 * ----------------------------------------------------------------------------
 * Purpose: Catches requests to routes that don't exist (e.g. a typo'd
 *          endpoint or a deprecated route someone still calls).
 *
 * Why a separate middleware from errorHandler:
 * Express doesn't call errorHandler automatically for unmatched routes —
 * it just hangs or returns Express's default (ugly, HTML) 404 page. This
 * middleware is registered AFTER all real routes but BEFORE errorHandler,
 * so it converts "no route matched" into a proper ApiError that flows
 * through our standard error response shape.
 */

const ApiError = require("../utils/ApiError");

const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = notFoundHandler;