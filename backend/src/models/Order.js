/**
 * Order.js
 * ----------------------------------------------------------------------------
 * Purpose: The single most important collection for correctness. Represents
 *          a completed (or in-progress) purchase.
 *
 * CRITICAL design decision: Order items are EMBEDDED SNAPSHOTS, not live
 * references to Product documents.
 *
 * Why: if a seller later changes a product's price, title, or deletes it
 * entirely, a historical order must still show EXACTLY what the customer
 * paid and for what — for legal, accounting, and customer-trust reasons.
 * We snapshot `title`, `price`, and `image` onto each order item at the
 * moment of purchase. We still keep a `product` reference too (for
 * "buy again" links), but we NEVER read price/title live from Product for
 * an existing order.
 *
 * Payment idempotency: `paymentIntentId` has a unique index specifically so
 * that if a payment gateway webhook fires twice for the same event, a
 * second attempt to mark the same order "paid" can be detected and safely
 * ignored (enforced in the webhook handler service in Phase 10, but the
 * unique index here is the DB-level backstop).
 */

const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // Denormalized so seller order queries don't need to populate Product first
    },
    title: { type: String, required: true }, // Snapshot at time of purchase
    image: { type: String, required: true }, // Snapshot at time of purchase
    price: { type: Number, required: true }, // Snapshot — the ACTUAL price paid, immutable
    quantity: { type: Number, required: true, min: 1 },
    itemStatus: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled"],
      default: "processing",
      // Per-item status matters because in a multi-vendor order, different
      // sellers' items may ship/arrive at different times.
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "An order must contain at least one item",
      },
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "India" },
    },
    itemsTotal: { type: Number, required: true },
    discountTotal: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "wallet"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentIntentId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple docs with null (before payment intent is created) without violating uniqueness
    },
    orderStatus: {
      type: String,
      enum: ["placed", "confirmed", "shipped", "delivered", "cancelled"],
      default: "placed",
    },
    couponApplied: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------
// Supports "customer views their own order history, newest first"
orderSchema.index({ customer: 1, createdAt: -1 });

// Supports "seller views orders containing their items" — indexing into the
// embedded array's seller field.
orderSchema.index({ "items.seller": 1, createdAt: -1 });

// paymentIntentId already gets a unique+sparse index via the schema options above.

module.exports = mongoose.model("Order", orderSchema);