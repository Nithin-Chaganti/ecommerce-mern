/**
 * tokenUtils.js
 * ----------------------------------------------------------------------------
 * Purpose: Centralizes all JWT signing/verification logic so token format,
 *          expiry, and secrets are defined in exactly ONE place.
 *
 * Design notes:
 * - Access token: short-lived (15 min), sent in the JSON response body. The
 *   frontend keeps it in memory (NOT localStorage — localStorage is readable
 *   by any injected script, i.e. vulnerable to XSS token theft).
 * - Refresh token: long-lived (7 days), sent ONLY as an httpOnly, secure,
 *   sameSite cookie — never exposed to frontend JS at all. This is the
 *   single biggest XSS-mitigation decision in the whole auth system.
 * - Both tokens carry only `id` and `role` in the payload — never sensitive
 *   data like email or password, since JWT payloads are base64-encoded, NOT
 *   encrypted, and can be decoded by anyone who intercepts the token.
 */

const jwt = require("jsonwebtoken");

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

/**
 * Signs a short-lived access token.
 * @param {{ id: string, role: string }} payload
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

/**
 * Signs a long-lived refresh token.
 * @param {{ id: string, role: string }} payload
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * Standard cookie options for the refresh token cookie.
 * Centralized here so login, refresh, and logout all use IDENTICAL options —
 * a mismatch (e.g. different `path`) between setting and clearing a cookie
 * is a very common bug that silently leaves stale cookies behind.
 */
const refreshTokenCookieOptions = {
  httpOnly: true, // Not readable by client-side JS — mitigates XSS token theft
  secure: process.env.NODE_ENV === "production", // HTTPS-only in production
  sameSite: "strict", // Mitigates CSRF — cookie not sent on cross-site requests
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matching REFRESH_TOKEN_EXPIRY
  path: "/api/v1/auth", // Cookie only sent to auth routes, not the entire API surface
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  refreshTokenCookieOptions,
};