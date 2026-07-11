/**
 * sellerOrderService.js
 * ----------------------------------------------------------------------------
 * Purpose: Order management for sellers — viewing orders containing their
 *          items, and updating per-item fulfillment status. Kept as a
 *          separate file from sellerService.js (which handles the seller's
 *          own profile) since this is a distinct concern touching the Order
 *          model rather than SellerProfile.
 *
 * Resource-ownership note: a seller must only ever see/modify the ITEMS
 * within an order that belong to them, never the whole order or another
 * seller's items in the same multi-vendor order — this is the Phase 6/7
 * ownership pattern applied to a more complex, nested resource shape.
 */

const Order = require("../models/Order");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");

/**
 * Lists orders that contain at least one item belonging to this seller.
 * Uses the {items.seller, createdAt} index created back in Phase 4.
 */
const listOrdersForSeller = async (sellerId, { page = 1, limit = 20 }) => {
  const filter = { "items.seller": sellerId, paymentStatus: "paid" };
  const skip = (page - 1) * limit;

  const [orders, totalCount] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  // Only return THIS seller's items from each order, not other sellers'
  // items that might share the same multi-vendor order — a seller has no
  // business seeing what a customer bought from someone else.
  const scopedOrders = orders.map((order) => ({
    _id: order._id,
    customer: order.customer,
    shippingAddress: order.shippingAddress,
    orderStatus: order.orderStatus,
    createdAt: order.createdAt,
    items: order.items.filter((item) => item.seller.toString() === sellerId),
  }));

  return {
    orders: scopedOrders,
    pagination: { currentPage: Number(page), totalPages: Math.ceil(totalCount / limit), totalCount },
  };
};

/**
 * Updates the fulfillment status of ONE item within an order — never the
 * whole order, since a multi-vendor order has independent per-seller
 * fulfillment. Ownership enforced by matching BOTH the order item's ID AND
 * its seller field against the requesting seller in the same query.
 */
const updateOrderItemStatus = async (sellerId, orderId, itemId, itemStatus) => {
  const order = await Order.findOne({ _id: orderId, "items.seller": sellerId });
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const item = order.items.id(itemId);
  if (!item || item.seller.toString() !== sellerId) {
    throw new ApiError(404, "Order item not found");
  }

  item.itemStatus = itemStatus;
  await order.save();
  return item;
};

/**
 * Seller sales analytics — simple aggregate totals for the dashboard
 * overview (see adminService.getPlatformAnalytics for the same "no
 * charting library" scope decision, applied here for the seller's own numbers).
 */
const getSellerAnalytics = async (sellerId) => {
  const [productCounts, salesStats] = await Promise.all([
    Promise.all([
      Product.countDocuments({ seller: sellerId, status: "approved" }),
      Product.countDocuments({ seller: sellerId, status: "pending" }),
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "paid", "items.seller": sellerId } },
      { $unwind: "$items" },
      { $match: { "items.seller": sellerId } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          totalItemsSold: { $sum: "$items.quantity" },
        },
      },
    ]),
  ]);

  const [approvedProducts, pendingProducts] = productCounts;
  const { totalRevenue = 0, totalItemsSold = 0 } = salesStats[0] || {};

  return { approvedProducts, pendingProducts, totalRevenue, totalItemsSold };
};

module.exports = { listOrdersForSeller, updateOrderItemStatus, getSellerAnalytics };