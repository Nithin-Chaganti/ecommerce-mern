const couponService = require("../services/couponService");
const ApiResponse = require("../utils/ApiResponse");

const createCoupon = async (req, res) => {
  const coupon = await couponService.createCoupon(req.body);
  return res.status(201).json(new ApiResponse(201, coupon, "Coupon created"));
};

const getCoupons = async (req, res) => {
  const coupons = await couponService.listCoupons();
  return res.status(200).json(new ApiResponse(200, coupons, "Coupons fetched"));
};

const updateCoupon = async (req, res) => {
  const coupon = await couponService.updateCoupon(req.params.couponId, req.body);
  return res.status(200).json(new ApiResponse(200, coupon, "Coupon updated"));
};

const deleteCoupon = async (req, res) => {
  await couponService.deleteCoupon(req.params.couponId);
  return res.status(200).json(new ApiResponse(200, null, "Coupon deleted"));
};

module.exports = { createCoupon, getCoupons, updateCoupon, deleteCoupon };