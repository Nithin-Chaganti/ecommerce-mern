const checkoutService = require("../services/checkoutService");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const createOrder = async (req, res) => {
  const result = await checkoutService.createCheckoutOrder(req.user.id, req.body);
  return res.status(201).json(new ApiResponse(201, result, "Checkout order created"));
};

const verifyPayment = async (req, res) => {
  const order = await checkoutService.verifyPayment(req.body);
  return res.status(200).json(new ApiResponse(200, order, "Payment verified, order confirmed"));
};

/**
 * Webhook handler — note this reads `req.rawBody`, NOT `req.body`. The raw
 * (unparsed) request bytes are required to compute the HMAC signature
 * correctly; even whitespace differences from JSON.stringify would break
 * verification. See app.js for how rawBody is captured for this route only.
 */
const razorpayWebhook = async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];

  if (!req.rawBody) {
    throw new ApiError(500, "Raw body not captured for webhook verification");
  }

  await checkoutService.handleWebhookEvent(req.rawBody, signature);

  // Razorpay expects a 200 response to consider the webhook delivered
  // successfully — otherwise it will retry, which our idempotency check
  // handles safely anyway, but acknowledging promptly is still correct practice.
  return res.status(200).json({ received: true });
};

module.exports = { createOrder, verifyPayment, razorpayWebhook };