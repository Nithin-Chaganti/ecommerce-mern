/**
 * sellerService.js
 * ----------------------------------------------------------------------------
 * Purpose: Business logic for seller-only self-service actions. Kept minimal
 *          in this phase — full product/order management lands in Phase 7+.
 */

const SellerProfile = require("../models/SellerProfile");
const ApiError = require("../utils/ApiError");

/**
 * Returns the requesting seller's OWN profile — note this takes the
 * authenticated user's ID directly from req.user, never from a client-
 * supplied parameter. This is the simplest possible form of a resource-
 * ownership guarantee: there's no ID to spoof because we never accept one
 * for "my own profile" lookups.
 */
const getOwnSellerProfile = async (userId) => {
  const profile = await SellerProfile.findOne({ user: userId });
  if (!profile) {
    throw new ApiError(404, "Seller profile not found");
  }
  return profile;
};

module.exports = { getOwnSellerProfile };