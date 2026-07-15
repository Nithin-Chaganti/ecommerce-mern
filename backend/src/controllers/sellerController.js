/**
 * sellerController.js
 * ----------------------------------------------------------------------------
 * Purpose: Thin HTTP layer for seller self-service endpoints.
 */

const sellerService = require("../services/sellerService");
const sellerOrderService = require("../services/sellerOrderService");
const ApiResponse = require("../utils/ApiResponse");

const getMyProfile = async (req, res) => {
  const profile = await sellerService.getOwnSellerProfile(req.user.id);
  return res.status(200).json(new ApiResponse(200, profile, "Seller profile fetched"));
};

const listSellerOrders = async (req, res) => {
  const { page, limit } = req.query;
  const result = await sellerOrderService.listOrdersForSeller(req.user.id, { page, limit });
  return res.status(200).json(new ApiResponse(200, result, "Seller orders fetched"));
};

const updateOrderItemStatus = async (req, res) => {
  const { orderId, itemId } = req.params;
  const { status } = req.body;
  const updatedItem = await sellerOrderService.updateOrderItemStatus(req.user.id, orderId, itemId, status);
  return res.status(200).json(new ApiResponse(200, updatedItem, "Order item status updated"));
};

const getSellerAnalytics = async (req, res) => {
  const analytics = await sellerOrderService.getSellerAnalytics(req.user.id);
  return res.status(200).json(new ApiResponse(200, analytics, "Seller analytics fetched"));
};

module.exports = {
  getMyProfile,
  listSellerOrders,
  updateOrderItemStatus,
  getSellerAnalytics,
};