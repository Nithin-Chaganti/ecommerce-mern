const { body } = require("express-validator");

const createOrderValidationRules = [
  body("shippingAddress.fullName").trim().notEmpty().withMessage("Full name is required"),
  body("shippingAddress.phone").trim().notEmpty().withMessage("Phone is required"),
  body("shippingAddress.street").trim().notEmpty().withMessage("Street is required"),
  body("shippingAddress.city").trim().notEmpty().withMessage("City is required"),
  body("shippingAddress.state").trim().notEmpty().withMessage("State is required"),
  body("shippingAddress.pincode").trim().notEmpty().withMessage("Pincode is required"),
  body("couponCode").optional().trim().isLength({ max: 20 }),
];

const verifyPaymentValidationRules = [
  body("razorpay_order_id").notEmpty().withMessage("razorpay_order_id is required"),
  body("razorpay_payment_id").notEmpty().withMessage("razorpay_payment_id is required"),
  body("razorpay_signature").notEmpty().withMessage("razorpay_signature is required"),
];

module.exports = { createOrderValidationRules, verifyPaymentValidationRules };