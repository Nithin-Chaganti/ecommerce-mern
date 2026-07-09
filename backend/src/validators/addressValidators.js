const { body, param } = require("express-validator");

const addAddressValidationRules = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("phone").trim().notEmpty().withMessage("Phone number is required"),
  body("street").trim().notEmpty().withMessage("Street is required"),
  body("city").trim().notEmpty().withMessage("City is required"),
  body("state").trim().notEmpty().withMessage("State is required"),
  body("pincode").trim().notEmpty().withMessage("Pincode is required"),
  body("isDefault").optional().isBoolean(),
];

const addressIdParamValidationRules = [param("addressId").isMongoId().withMessage("Invalid address ID")];

module.exports = { addAddressValidationRules, addressIdParamValidationRules };