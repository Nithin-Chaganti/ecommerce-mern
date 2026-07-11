const express = require("express");
const { param } = require("express-validator");
const { createCoupon, getCoupons, updateCoupon, deleteCoupon } = require("../controllers/couponController");
const { createCouponValidationRules, updateCouponValidationRules } = require("../validators/couponValidators");
const validateRequest = require("../middleware/validateRequest");
const protect = require("../middleware/authMiddleware");
const restrictTo = require("../middleware/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(protect, restrictTo("admin"));

router.post("/", createCouponValidationRules, validateRequest, asyncHandler(createCoupon));
router.get("/", asyncHandler(getCoupons));
router.patch("/:couponId", updateCouponValidationRules, validateRequest, asyncHandler(updateCoupon));
router.delete("/:couponId", [param("couponId").isMongoId()], validateRequest, asyncHandler(deleteCoupon));

module.exports = router;