/**
 * Coupon.js
 * ----------------------------------------------------------------------------
 * Purpose: Discount codes, admin-managed, applied at checkout.
 *
 * Design notes:
 * - `code` is stored uppercase and unique — customers type coupon codes
 *   inconsistently (case, whitespace), so we normalize on save.
 * - `usedCount` combined with `usageLimit` supports both "single global use
 *   limit" (e.g. first 100 customers) — per-user usage limits would need a
 *   separate CouponRedemption collection, which we explicitly flag as a
 *   possible extension rather than over-building now.
 */

const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [4, "Coupon code must be at least 4 characters"],
      maxlength: [20, "Coupon code cannot exceed 20 characters"],
    },
    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: [0, "Discount value cannot be negative"],
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null, // Caps percentage-based discounts (e.g. "20% off, up to ₹500")
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiry date is required"],
    },
    usageLimit: {
      type: Number,
      default: null, // null = unlimited uses
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true, // Admin can deactivate without deleting (preserves order references)
    },
  },
  { timestamps: true }
);

// code already gets a unique index via `unique: true` above.
// Index on expiresAt+isActive supports the common "find valid, active coupons" query.
couponSchema.index({ isActive: 1, expiresAt: 1 });

module.exports = mongoose.model("Coupon", couponSchema);