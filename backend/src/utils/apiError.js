/**
 * ApiError
 * ----------------------------------------------------------------------------
 * Purpose: A single, consistent error shape used everywhere in the backend
 *          (controllers, services, middleware) instead of throwing raw
 *          strings or generic Error objects.
 *
 * Why this exists:
 * Without a standard error class, every part of the codebase ends up
 * inventing its own error format ({ msg }, { message }, plain strings...).
 * That inconsistency makes the frontend's error-handling code fragile and
 * makes debugging painful. By always throwing `ApiError`, our global error
 * handler (middleware/errorHandler.js) can reliably read `statusCode` and
 * `message` off of ANY error that reaches it.
 *
 * Usage example:
 *   throw new ApiError(404, "Product not found");
 */

class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code to send to the client (e.g. 400, 401, 404, 500)
   * @param {string} message - Human-readable error message (safe to show to the client)
   * @param {Array}  errors - Optional array of field-level validation errors
   * @param {boolean} isOperational - true for "expected" errors (bad input, not found, etc.)
   *                                  vs unexpected programmer/bugs. Helps us decide later
   *                                  whether to just log-and-continue or alert/crash-restart.
   */
  constructor(statusCode, message = "Something went wrong", errors = [], isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    this.success = false;

    // Preserves the correct stack trace, pointing to where the error was
    // actually thrown rather than to this constructor.
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;