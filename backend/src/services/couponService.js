/**
 * couponService.js
 * ----------------------------------------------------------------------------
 * Purpose: Admin-only coupon management — the Coupon model has existed since
 *          Phase 4 and been consumed at checkout since Phase 10, but no CRUD
 *          existed for admins to actually create/manage them until now.
 */

const Coupon = require("../models/Coupon");
const ApiError = require("../utils/ApiError");

const createCoupon = async (payload) => {
  const existing = await Coupon.findOne({ code: payload.code.toUpperCase() });
  if (existing) {
    throw new ApiError(409, "A coupon with this code already exists");
  }
  return Coupon.create(payload);
};

const listCoupons = async () => {
  return Coupon.find().sort({ createdAt: -1 });
};

const updateCoupon = async (couponId, updates) => {
  const coupon = await Coupon.findByIdAndUpdate(couponId, updates, { new: true, runValidators: true });
  if (!coupon) throw new ApiError(404, "Coupon not found");
  return coupon;
};

const deleteCoupon = async (couponId) => {
  const deleted = await Coupon.findByIdAndDelete(couponId);
  if (!deleted) throw new ApiError(404, "Coupon not found");
};

module.exports = { createCoupon, listCoupons, updateCoupon, deleteCoupon };