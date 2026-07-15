const express = require("express");
const { param, query } = require("express-validator");
const { getMyOrders, getMyOrderById, cancelMyOrder } = require("../controllers/orderController");
const validateRequest = require("../middleware/validateRequest");
const protect = require("../middleware/authMiddleware");
const restrictTo = require("../middleware/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(protect, restrictTo("customer"));

router.get(
  "/mine",
  [query("page").optional().isInt({ min: 1 }), query("limit").optional().isInt({ min: 1, max: 50 })],
  validateRequest,
  asyncHandler(getMyOrders)
);
router.get("/:orderId", [param("orderId").isMongoId()], validateRequest, asyncHandler(getMyOrderById));
router.patch("/:orderId/cancel", [param("orderId").isMongoId()], validateRequest, asyncHandler(cancelMyOrder));

module.exports = router;