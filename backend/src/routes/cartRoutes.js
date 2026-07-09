/**
 * cartRoutes.js
 * ----------------------------------------------------------------------------
 * All routes require authentication. Restricted to "customer" role — sellers
 * and admins don't need a shopping cart in this platform's feature set.
 */

const express = require("express");
const { getCart, addItem, updateItem, removeItem, clearCart } = require("../controllers/cartController");
const { addToCartValidationRules, updateCartItemValidationRules } = require("../validators/cartValidators");
const validateRequest = require("../middleware/validateRequest");
const protect = require("../middleware/authMiddleware");
const restrictTo = require("../middleware/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(protect, restrictTo("customer"));

router.get("/", asyncHandler(getCart));
router.post("/items", addToCartValidationRules, validateRequest, asyncHandler(addItem));
router.patch("/items/:productId", updateCartItemValidationRules, validateRequest, asyncHandler(updateItem));
router.delete("/items/:productId", asyncHandler(removeItem));
router.delete("/", asyncHandler(clearCart));

module.exports = router;