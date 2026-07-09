/**
 * authMiddleware.js
 * ----------------------------------------------------------------------------
 * Purpose: Verifies the access token on incoming requests and attaches the
 *          decoded identity to `req.user`. This is AUTHENTICATION only
 *          ("who are you") — role-based AUTHORIZATION ("are you allowed to
 *          do this") is built on top of this in Phase 6, kept as a
 *          separate `roleMiddleware` so the two concerns don't get conflated
 *          (a very common interview question: "what's the difference?").
 *
 * Token transport convention: Authorization: Bearer <accessToken>
 * (NOT read from a cookie — only the refresh token uses a cookie; the
 * access token is sent by the frontend explicitly on each request, kept
 * in memory, never persisted to any storage).
 */

const { verifyAccessToken } = require("../utils/tokenUtils");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Not authenticated: no access token provided");
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    // Distinguish an EXPIRED token from an otherwise INVALID one — the
    // frontend uses this distinction to decide whether to silently call
    // /auth/refresh-token or force a full re-login.
    if (err.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired");
    }
    throw new ApiError(401, "Invalid access token");
  }

  // Re-check the user still exists and is active on EVERY request (not just
  // trusting the token payload) — catches the edge case where an admin
  // deactivates a user mid-session; their still-valid (unexpired) access
  // token would otherwise keep working until it naturally expires.
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new ApiError(401, "Account no longer active");
  }

  req.user = { id: user._id.toString(), role: user.role };
  next();
});

module.exports = protect;