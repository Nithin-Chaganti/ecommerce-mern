/**
 * sellerController.js
 * ----------------------------------------------------------------------------
 * Purpose: Thin HTTP layer for seller self-service endpoints.
 */

const sellerService = require("../services/sellerService");
const ApiResponse = require("../utils/ApiResponse");

const getMyProfile = async (req, res) => {
  const profile = await sellerService.getOwnSellerProfile(req.user.id);
  return res.status(200).json(new ApiResponse(200, profile, "Seller profile fetched"));
};

module.exports = { getMyProfile };