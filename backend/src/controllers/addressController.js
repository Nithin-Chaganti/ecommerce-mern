const addressService = require("../services/addressService");
const ApiResponse = require("../utils/ApiResponse");

const getAddresses = async (req, res) => {
  const addresses = await addressService.listAddresses(req.user.id);
  return res.status(200).json(new ApiResponse(200, addresses, "Addresses fetched"));
};

const addAddress = async (req, res) => {
  const addresses = await addressService.addAddress(req.user.id, req.body);
  return res.status(201).json(new ApiResponse(201, addresses, "Address added"));
};

const updateAddress = async (req, res) => {
  const addresses = await addressService.updateAddress(req.user.id, req.params.addressId, req.body);
  return res.status(200).json(new ApiResponse(200, addresses, "Address updated"));
};

const deleteAddress = async (req, res) => {
  const addresses = await addressService.deleteAddress(req.user.id, req.params.addressId);
  return res.status(200).json(new ApiResponse(200, addresses, "Address deleted"));
};

module.exports = { getAddresses, addAddress, updateAddress, deleteAddress };