/**
 * checkoutService.js
 * ----------------------------------------------------------------------------
 * Purpose: The most correctness-critical business logic in the whole
 *          project. Converts a cart into a paid order, safely.
 *
 * Three-step flow (matches the Phase 2 request-flow design):
 *   1. createCheckoutOrder: validate cart/stock/address, snapshot prices,
 *      create a Razorpay order, create a local Order (status: pending).
 *   2. verifyPayment: called by the frontend immediately after Razorpay's
 *      checkout widget completes — verifies the HMAC signature, then
 *      ATOMICALLY (via a MongoDB transaction) decrements stock and marks
 *      the order paid.
 *   3. handleWebhookEvent: the DURABLE backstop — Razorpay calls this
 *      server-to-server regardless of what happens in the customer's
 *      browser. Same finalize logic as step 2, but idempotent: if the
 *      order is already paid (checked via paymentIntentId), it's a no-op.
 *
 * Why a transaction for stock decrement + order finalization:
 * Without a transaction, "decrement stock" and "mark order paid" are two
 * separate writes. If the process crashed between them, we'd have a paid
 * order with un-decremented stock (overselling risk) or decremented stock
 * with an order stuck "pending" (customer paid, sees nothing). A MongoDB
 * multi-document transaction (supported on Atlas's replica-set-backed
 * clusters, including the free tier) makes both writes succeed or fail together.
 */

const mongoose = require("mongoose");
const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");
const ApiError = require("../utils/ApiError");

/**
 * Step 1: Validate cart + stock, snapshot order items, create Razorpay order
 * + local Order document (status: pending payment).
 */
const createCheckoutOrder = async (customerId, { shippingAddress, couponCode }) => {
  const cart = await Cart.findOne({ user: customerId }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  // Re-validate stock NOW, at checkout time — never trust the cart's
  // cached state (a principle established back in Phase 2's request-flow design).
  const orderItems = [];
  let itemsTotal = 0;

  for (const cartItem of cart.items) {
    const product = cartItem.product;
    if (!product || product.status !== "approved") {
      throw new ApiError(400, `Product no longer available: ${cartItem.product?.title || "unknown"}`);
    }
    if (product.stock < cartItem.quantity) {
      throw new ApiError(400, `Insufficient stock for "${product.title}". Only ${product.stock} left.`);
    }

    orderItems.push({
      product: product._id,
      seller: product.seller,
      title: product.title, // Snapshot — see Order model header comment (Phase 4)
      image: product.images[0],
      price: product.price, // AUTHORITATIVE price, re-read live here — never trust cart's priceAtAddition for the actual charge
      quantity: cartItem.quantity,
    });

    itemsTotal += product.price * cartItem.quantity;
  }

  // Optional coupon application
  let discountTotal = 0;
  let couponDoc = null;
  if (couponCode) {
    couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!couponDoc || couponDoc.expiresAt < new Date()) {
      throw new ApiError(400, "Invalid or expired coupon code");
    }
    if (couponDoc.usageLimit && couponDoc.usedCount >= couponDoc.usageLimit) {
      throw new ApiError(400, "This coupon has reached its usage limit");
    }
    if (itemsTotal < couponDoc.minOrderValue) {
      throw new ApiError(400, `Minimum order value for this coupon is ₹${couponDoc.minOrderValue}`);
    }

    discountTotal =
      couponDoc.discountType === "percentage" ? (itemsTotal * couponDoc.discountValue) / 100 : couponDoc.discountValue;

    if (couponDoc.maxDiscountAmount) {
      discountTotal = Math.min(discountTotal, couponDoc.maxDiscountAmount);
    }
  }

  const shippingFee = itemsTotal > 999 ? 0 : 49; // Simple flat-rate rule; easy to extend later
  const grandTotal = Math.round(itemsTotal - discountTotal + shippingFee);

  // Razorpay expects amount in the smallest currency unit (paise for INR).
  const razorpayOrder = await razorpay.orders.create({
    amount: grandTotal * 100,
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  });

  const order = await Order.create({
    customer: customerId,
    items: orderItems,
    shippingAddress,
    itemsTotal,
    discountTotal,
    shippingFee,
    grandTotal,
    paymentMethod: "card", // Razorpay checkout widget handles method selection client-side
    paymentStatus: "pending",
    paymentIntentId: razorpayOrder.id, // Makes webhook idempotency possible (Phase 4 unique+sparse index)
    orderStatus: "placed",
    couponApplied: couponDoc?._id || null,
  });

  return {
    localOrderId: order._id,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID, // Public key — safe to expose to frontend, needed for the checkout widget
  };
};

/**
 * Shared finalize logic used by BOTH verifyPayment (client path) and
 * handleWebhookEvent (server path) — same idempotency-safe operation,
 * callable from either trigger.
 */
const finalizeOrderPayment = async (razorpayOrderId) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const order = await Order.findOne({ paymentIntentId: razorpayOrderId }).session(session);
    if (!order) {
      throw new ApiError(404, "Order not found for this payment");
    }

    // IDEMPOTENCY CHECK: if already paid, this is a duplicate webhook
    // delivery or a redundant client call — return success without
    // re-processing (re-decrementing stock a second time would be a bug).
    if (order.paymentStatus === "paid") {
      await session.abortTransaction();
      session.endSession();
      return order;
    }

    // Atomically decrement stock for every item, but ONLY if enough stock
    // still exists — the condition inside the filter is what prevents a
    // race condition between two nearly-simultaneous checkouts for the
    // last unit of the same product.
    for (const item of order.items) {
      const result = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { session, new: true }
      );
      if (!result) {
        // Someone else bought the last unit between checkout-creation and
        // payment-confirmation. Abort the whole transaction — nothing
        // partially decrements.
        throw new ApiError(409, `Stock conflict for product ${item.product} — order cannot be fulfilled`);
      }
    }

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    await order.save({ session });

    if (order.couponApplied) {
      await Coupon.findByIdAndUpdate(order.couponApplied, { $inc: { usedCount: 1 } }, { session });
    }

    // Clear the customer's cart now that checkout is complete.
    await Cart.findOneAndUpdate({ user: order.customer }, { items: [] }, { session });

    await session.commitTransaction();
    session.endSession();
    return order;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

/**
 * Step 2: Client-side verification, called immediately after Razorpay's
 * checkout widget reports success in the browser.
 */
const verifyPayment = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  // HMAC signature verification — this is what proves the payment
  // confirmation actually came from Razorpay and wasn't forged by a
  // malicious client simply POSTing a fake "success" to our API.
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Payment verification failed: invalid signature");
  }

  return finalizeOrderPayment(razorpay_order_id);
};

/**
 * Step 3: Webhook handler — the durable, server-to-server source of truth.
 * Verifies a DIFFERENT signature (the webhook secret, not the checkout
 * secret) since Razorpay signs webhook payloads separately.
 */
const handleWebhookEvent = async (rawBody, signatureHeader) => {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (expectedSignature !== signatureHeader) {
    throw new ApiError(400, "Webhook signature verification failed");
  }

  const event = JSON.parse(rawBody);

  if (event.event === "payment.captured") {
    const razorpayOrderId = event.payload.payment.entity.order_id;
    await finalizeOrderPayment(razorpayOrderId);
  }
  // Other event types (payment.failed, refund.processed, etc.) can be
  // handled here as additional cases — kept minimal for this project's scope.
};

module.exports = { createCheckoutOrder, verifyPayment, handleWebhookEvent };