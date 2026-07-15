/**
 * orderService.js
 * ----------------------------------------------------------------------------
 * Purpose: Customer-facing order history/tracking. Added alongside the
 *          Phase 11 frontend build — Phase 7 covered Category/Product/Cart/
 *          Wishlist/Review/Address, and Phase 10 covered checkout creation
 *          and payment verification, but neither built a "list my past
 *          orders" read endpoint, which the frontend's Order History page
 *          needs to function. Documented in DECISION_LOG.md.
 */

const Order = require("../models/Order");
const ApiError = require("../utils/ApiError");

const listMyOrders = async (customerId, { page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const filter = { customer: customerId };

  const [orders, totalCount] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: { currentPage: Number(page), totalPages: Math.ceil(totalCount / limit), totalCount },
  };
};

/**
 * Resource-ownership check, same pattern used throughout the project
 * (Phase 6/7): a customer can only view their OWN order, never one by ID
 * belonging to someone else, even though Order IDs aren't guessable in
 * practice — defense in depth still applies.
 */
const getMyOrderById = async (customerId, orderId) => {
  const order = await Order.findOne({ _id: orderId, customer: customerId });
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  return order;
};

const cancelOrder = async (customerId, orderId) => {
  const order = await Order.findOne({ _id: orderId, customer: customerId });
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (!["placed", "confirmed"].includes(order.orderStatus)) {
    throw new ApiError(400, `Orders in '${order.orderStatus}' status cannot be cancelled`);
  }

  // Restore inventory stock levels
  const Product = require("../models/Product");
  const bulkOps = order.items.map((item) => ({
    updateOne: {
      filter: { _id: item.product },
      update: { $inc: { stock: item.quantity } },
    },
  }));

  if (bulkOps.length > 0) {
    await Product.bulkWrite(bulkOps);
  }

  order.orderStatus = "cancelled";
  // Set all items fulfillment status to cancelled
  order.items.forEach((item) => {
    item.itemStatus = "cancelled";
  });

  await order.save();
  return order;
};

module.exports = { listMyOrders, getMyOrderById, cancelOrder };