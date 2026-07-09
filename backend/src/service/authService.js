/**
 * authService.js
 * ----------------------------------------------------------------------------
 * Purpose: All authentication BUSINESS LOGIC lives here — controllers stay
 *          thin and only handle HTTP request/response shaping (per our
 *          layered architecture decision from Phase 2).
 *
 * Why logic isn't in the controller:
 * Keeping logic here means we can unit-test registration/login rules
 * (e.g. "duplicate email rejected", "wrong password rejected") without
 * spinning up Express at all — just call these functions directly in Jest.
 */

const User = require("../models/User");
const SellerProfile = require("../models/SellerProfile");
const ApiError = require("../utils/ApiError");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/tokenUtils");

/**
 * Registers a new user (customer or seller).
 * For sellers, also creates an associated SellerProfile with pending approval status.
 */
const registerUser = async ({ name, email, password, role = "customer", storeName }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    // 409 Conflict is the semantically correct status for "resource already exists"
    throw new ApiError(409, "An account with this email already exists");
  }

  // Note: password hashing happens automatically in User's pre("save") hook —
  // we deliberately do NOT hash it here too, to avoid double-hashing bugs.
  const user = await User.create({ name, email, password, role });

  if (role === "seller") {
    await SellerProfile.create({
      user: user._id,
      storeName,
      approvalStatus: "pending", // Seller cannot list products until admin approves (Phase 6/7)
    });
  }

  return user;
};

/**
 * Authenticates a user by email/password and issues a token pair.
 */
const loginUser = async ({ email, password }) => {
  // Explicitly select password since the schema excludes it by default.
  const user = await User.findOne({ email }).select("+password");

  // Deliberately vague error message — "Invalid credentials" for BOTH "no such
  // user" and "wrong password". Being specific (e.g. "no account with that
  // email") leaks which emails are registered — an account enumeration
  // vulnerability that's a very common junior-dev mistake.
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "This account has been deactivated. Contact support.");
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const tokenPayload = { id: user._id, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Persist the refresh token so we can invalidate it server-side on logout —
  // a pure stateless JWT can't be revoked before its natural expiry otherwise.
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false }); // Skip full re-validation for a metadata-only update

  return { user, accessToken, refreshToken };
};

/**
 * Issues a new access token given a valid, still-registered refresh token.
 */
const refreshAccessToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token missing");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(incomingRefreshToken);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded.id).select("+refreshToken");

  // CRITICAL check: the refresh token must match what's stored on the user.
  // This is what makes logout actually work — logout clears user.refreshToken,
  // so even a still-cryptographically-valid (unexpired) old token is rejected
  // once it no longer matches what's stored.
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is no longer valid, please log in again");
  }

  const newAccessToken = generateAccessToken({ id: user._id, role: user.role });
  return newAccessToken;
};

/**
 * Logs a user out by invalidating their stored refresh token.
 */
const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
};

module.exports = { registerUser, loginUser, refreshAccessToken, logoutUser };