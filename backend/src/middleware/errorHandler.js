/**
 * errorHandler.js
 * ----------------------------------------------------------------------------
 * Purpose: Express's global error-handling middleware. This is the LAST
 *          middleware in the chain (registered in app.js after all routes).
 *          Every error thrown anywhere in the app — whether via `next(err)`,
 *          an asyncHandler catch, or Express itself — ends up here.
 *
 * Why centralize this:
 * Without a single global handler, error responses end up inconsistent
 * across routes (some return { message }, some { error }, some crash the
 * process entirely). Centralizing guarantees ONE response shape for every
 * error in the whole API, and lets us hide sensitive stack traces in
 * production while showing them in development.
 *
 * Security note:
 * We never leak stack traces or internal error details to the client in
 * production — that can expose file paths, library versions, or internal
 * logic to an attacker.
 */

const ApiError = require("../utils/ApiError");

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  // If the error isn't already one of our ApiError instances (e.g. a raw
  // Mongoose CastError, a JSON parse error, a Multer file-upload error, etc.),
  // normalize it into one so the response shape stays consistent no matter
  // where the error came from.
  if (!(error instanceof ApiError)) {
    // Multer throws its own error class for upload issues (file too large,
    // too many files, etc.) — these are CLIENT mistakes, not server failures,
    // so they should be 400s, not the generic 500 fallback below.
    if (error.name === "MulterError") {
      error = new ApiError(400, `File upload error: ${error.message}`, [], true);
    } else {
      const statusCode = error.statusCode || 500;
      const message = error.message || "Internal Server Error";
      error = new ApiError(statusCode, message, [], false);
    }
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    // Stack traces are only ever exposed in non-production environments.
    ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
  };

  // Log server-side always (even in production) so we retain visibility
  // into what actually went wrong, without exposing that detail to the client.
  if (error.statusCode >= 500) {
    console.error("Server Error:", error);
  } else {
    console.warn("Client Error:", error.message);
  }

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler;