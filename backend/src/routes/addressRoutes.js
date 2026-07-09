const express = require("express");
const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} = require("../controllers/addressController");
const {
  addAddressValidationRules,
  addressIdParamValidationRules,
} = require("../validators/addressValidators");
const validateRequest = require("../middleware/validateRequest");
const protect = require("../middleware/authMiddleware");
const restrictTo = require("../middleware/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(protect, restrictTo("customer"));

router.get("/", asyncHandler(getAddresses));
router.post("/", addAddressValidationRules, validateRequest, asyncHandler(addAddress));
router.patch("/:addressId", addressIdParamValidationRules, validateRequest, asyncHandler(updateAddress));
router.delete("/:addressId", addressIdParamValidationRules, validateRequest, asyncHandler(deleteAddress));

module.exports = router;