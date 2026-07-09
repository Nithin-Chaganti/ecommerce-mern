/**
 * authController.js
 * ----------------------------------------------------------------------------
 * Purpose: Thin HTTP layer for auth endpoints — parses requests, calls
 *          authService for all actual logic, shapes responses. No business
 *          logic should ever be added directly here (see Phase 2 layered
 *          architecture decision).
 */

const authService = require("../services/authService");
const ApiResponse = require("../utils/ApiResponse");
const { refreshTokenCookieOptions } = require("../utils/tokenUtils");

const register = async (req, res) => {
  const { name, email, password, role, storeName } = req.body;
  const user = await authService.registerUser({ name, email, password, role, storeName });

  // Never return the password hash, even though select:false already
  // excludes it from queries — being explicit here is a cheap extra safety net.
  const safeUser = { id: user._id, name: user.name, email: user.email, role: user.role };

  return res
    .status(201)
    .json(new ApiResponse(201, safeUser, "Registration successful. You can now log in."));
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.loginUser({ email, password });

  // Refresh token goes ONLY in an httpOnly cookie — never in the JSON body,
  // so client-side JS can never read or leak it.
  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

  const safeUser = { id: user._id, name: user.name, email: user.email, role: user.role };

  return res
    .status(200)
    .json(new ApiResponse(200, { user: safeUser, accessToken }, "Login successful"));
};

const refreshToken = async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;
  const newAccessToken = await authService.refreshAccessToken(incomingRefreshToken);

  return res
    .status(200)
    .json(new ApiResponse(200, { accessToken: newAccessToken }, "Access token refreshed"));
};

const logout = async (req, res) => {
  // req.user is attached by the `protect` middleware — logout requires a
  // valid access token, so we know exactly which user's refresh token to clear.
  await authService.logoutUser(req.user.id);

  // Clear the cookie using the EXACT SAME options it was set with (path,
  // sameSite, secure) — mismatched options silently fail to clear the cookie.
  res.clearCookie("refreshToken", refreshTokenCookieOptions);

  return res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
};

module.exports = { register, login, refreshToken, logout };