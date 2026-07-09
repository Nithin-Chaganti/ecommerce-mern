/**
 * addressService.js
 * ----------------------------------------------------------------------------
 * Purpose: Manage a customer's saved address sub-documents on their own User
 *          document. Every operation scoped to req.user.id — same
 *          "nothing to spoof" ownership pattern used throughout this project.
 */

const User = require("../models/User");
const ApiError = require("../utils/ApiError");

const listAddresses = async (userId) => {
  const user = await User.findById(userId);
  return user.addresses;
};

const addAddress = async (userId, addressData) => {
  const user = await User.findById(userId);

  // If this is marked default, or it's the very first address, unset any
  // existing default so we never end up with two "default" addresses at once.
  if (addressData.isDefault || user.addresses.length === 0) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
    addressData.isDefault = true;
  }

  user.addresses.push(addressData);
  await user.save({ validateBeforeSave: false });
  return user.addresses;
};

const updateAddress = async (userId, addressId, updates) => {
  const user = await User.findById(userId);
  const address = user.addresses.id(addressId);
  if (!address) throw new ApiError(404, "Address not found");

  if (updates.isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  Object.assign(address, updates);
  await user.save({ validateBeforeSave: false });
  return user.addresses;
};

const deleteAddress = async (userId, addressId) => {
  const user = await User.findById(userId);
  const address = user.addresses.id(addressId);
  if (!address) throw new ApiError(404, "Address not found");

  address.deleteOne(); // Mongoose subdocument removal
  await user.save({ validateBeforeSave: false });
  return user.addresses;
};

module.exports = { listAddresses, addAddress, updateAddress, deleteAddress };