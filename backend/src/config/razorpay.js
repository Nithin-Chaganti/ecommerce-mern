/**
 * razorpay.js
 * ----------------------------------------------------------------------------
 * Purpose: Configures the Razorpay SDK instance, used to create orders and
 *          (indirectly, via webhook secret) verify payment authenticity.
 */

const Razorpay = require("razorpay");

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpayInstance;