const orderService = require("../services/orderService");
const ApiResponse = require("../utils/ApiResponse");

const getMyOrders = async (req, res) => {
  const { page, limit } = req.query;
  const result = await orderService.listMyOrders(req.user.id, { page, limit });
  return res.status(200).json(new ApiResponse(200, result, "Orders fetched"));
};

const getMyOrderById = async (req, res) => {
  const order = await orderService.getMyOrderById(req.user.id, req.params.orderId);
  return res.status(200).json(new ApiResponse(200, order, "Order fetched"));
};

const cancelMyOrder = async (req, res) => {
  const order = await orderService.cancelOrder(req.user.id, req.params.orderId);
  return res.status(200).json(new ApiResponse(200, order, "Order cancelled successfully"));
};

module.exports = { getMyOrders, getMyOrderById, cancelMyOrder };