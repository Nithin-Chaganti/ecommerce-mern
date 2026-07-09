/**
 * roleMiddleware.js
 * ----------------------------------------------------------------------------
 * Purpose: AUTHORIZATION layer — decides whether an already-authenticated
 *          user (req.user, attached by `protect` in Phase 5) is ALLOWED to
 *          access a given route, based on role.
 *
 * CRITICAL distinction (a favorite interview question):
 *   - `protect` (Phase 5)   = authentication = "who are you?"
 *   - `restrictTo` (this)   = authorization  = "are you allowed here?"
 * They are separate middlewares, always used TOGETHER in that order:
 *   router.get("/admin/users", protect, restrictTo("admin"), asyncHandler(listUsers));
 *
 * IMPORTANT LIMITATION this middleware does NOT solve:
 * `restrictTo("seller")` only proves "this user IS a seller" — it does NOT
 * prove "this seller owns THIS SPECIFIC product". That's a resource-ownership
 * check and must happen separately, inside the service layer, using the
 * actual resource's owner field vs req.user.id (demonstrated in Phase 7's
 * Product update/delete logic). Conflating the two is a classic security bug
 * (see Phase 2 debugging scenario #1 — an IDOR vulnerability).
 */

const ApiError = require("../utils/ApiError");

/**
 * @param {...string} allowedRoles - roles permitted to access the route, e.g. restrictTo("admin")
 */
const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    // Defensive check: restrictTo must always run AFTER protect. If req.user
    // is missing, that's a developer mistake (wrong middleware order), not a
    // legitimate "unauthorized" case — but we still fail safely either way.
    if (!req.user) {
      return next(new ApiError(401, "Not authenticated"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      // 403 Forbidden: the user IS authenticated, they're just not permitted
      // here. This is distinct from 401 Unauthorized (not authenticated at all).
      return next(
        new ApiError(403, `Role '${req.user.role}' is not permitted to access this resource`)
      );
    }

    next();
  };
};

module.exports = restrictTo;