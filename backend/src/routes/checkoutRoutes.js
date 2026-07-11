/**
 * checkoutRoutes.js
 * ----------------------------------------------------------------------------
 * NOTE: the webhook route is NOT mounted here in the usual way — it's
 * registered directly in app.js BEFORE the global express.json() parser,
 * because it needs raw body bytes for signature verification. See app.js
 * for the full explanation. This file only exports the two customer-facing,
 * authenticated routes.
 */

const express = require("express");
const { createOrder, verifyPayment } = require("../controllers/checkoutController");
const {
  createOrderValidationRules,
  verifyPaymentValidationRules,
} = require("../validators/checkoutValidators");
const validateRequest = require("../middleware/validateRequest");
const protect = require("../middleware/authMiddleware");
const restrictTo = require("../middleware/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(protect, restrictTo("customer"));

router.post("/create-order", createOrderValidationRules, validateRequest, asyncHandler(createOrder));
router.post("/verify-payment", verifyPaymentValidationRules, validateRequest, asyncHandler(verifyPayment));

module.exports = router;