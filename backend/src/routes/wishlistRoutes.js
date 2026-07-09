const express = require("express");
const { body, param } = require("express-validator");
const { getWishlist, addProduct, removeProduct } = require("../controllers/wishlistController");
const validateRequest = require("../middleware/validateRequest");
const protect = require("../middleware/authMiddleware");
const restrictTo = require("../middleware/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(protect, restrictTo("customer"));

router.get("/", asyncHandler(getWishlist));
router.post(
  "/",
  [body("productId").isMongoId().withMessage("Valid product ID is required")],
  validateRequest,
  asyncHandler(addProduct)
);
router.delete(
  "/:productId",
  [param("productId").isMongoId()],
  validateRequest,
  asyncHandler(removeProduct)
);

module.exports = router;