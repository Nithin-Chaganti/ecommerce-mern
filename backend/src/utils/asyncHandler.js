/**
 * asyncHandler
 * ----------------------------------------------------------------------------
 * Purpose: Express does NOT automatically catch errors thrown inside async
 *          route handlers. Without this wrapper, every controller would need
 *          its own try/catch block that calls next(err) manually — repetitive
 *          and easy to forget (a forgotten try/catch = an unhandled promise
 *          rejection = potential server crash).
 *
 * How it works:
 *   asyncHandler takes a controller function and returns a NEW function.
 *   That new function calls the original controller and, if it rejects
 *   (throws), automatically forwards the error to Express's `next()`,
 *   which routes it to our global error handler middleware.
 *
 * Usage example:
 *   router.get("/health", asyncHandler(healthController.check));
 *
 * Alternative approaches considered:
 *   - express-async-errors package (patches Express globally) — works, but
 *     "magic" global patching is harder to explain in an interview than an
 *     explicit wrapper you wrote yourself. We prefer explicit here for
 *     learning value.
 */

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;