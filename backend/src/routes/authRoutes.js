/**
 * authRoutes.js
 * ----------------------------------------------------------------------------
 * Purpose: Wires up all /api/v1/auth/* endpoints.
 *
 * Security note: login gets its OWN stricter rate limiter than the global
 * one from app.js (300 req/15min). Brute-forcing passwords is exactly the
 * kind of endpoint that needs a much tighter limit — this was flagged as a
 * TODO back in Phase 3 and is implemented now that the login route exists.
 */

const express = require("express");
const rateLimit = require("express-rate-limit");

const { register, login, refreshToken, logout } = require("../controllers/authController");
const { registerValidationRules, loginValidationRules } = require("../validators/authValidators");
const validateRequest = require("../middleware/validateRequest");
const protect = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Stricter limiter: 10 attempts per 15 minutes per IP. Tight enough to
// meaningfully slow down brute force, loose enough not to lock out a real
// user who mistypes their password a few times.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many login attempts. Please try again in 15 minutes.",
});

router.post("/register", registerValidationRules, validateRequest, asyncHandler(register));
router.post("/login", loginLimiter, loginValidationRules, validateRequest, asyncHandler(login));
router.post("/refresh-token", asyncHandler(refreshToken));
router.post("/logout", protect, asyncHandler(logout));

module.exports = router;