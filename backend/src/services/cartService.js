/**
 * cartService.js
 * ----------------------------------------------------------------------------
 * Purpose: Business logic for the shopping cart. Every operation is scoped
 *          to `req.user.id` — a cart's owner is never a client-supplied
 *          value, so there's no ownership check to write here (same "nothing
 *          to spoof" pattern as the seller's own-profile route in Phase 6).
 *
 * Stock validation note: we check CURRENT stock when ADDING/UPDATING cart
 * items (a friendly early warning), but the AUTHORITATIVE, final stock check
 * happens again at checkout (Phase 10) — a cart sitting untouched for an
 * hour could easily go stale otherwise.
 */

const Cart = require("../models/Cart");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

const getCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate("items.product", "title price images stock");
  return cart || { user: userId, items: [] };
};

const addItem = async (userId, { productId, quantity = 1 }) => {
  const product = await Product.findById(productId);
  if (!product || product.status !== "approved") {
    throw new ApiError(404, "Product not found");
  }
  if (product.stock < quantity) {
    throw new ApiError(400, `Only ${product.stock} unit(s) available`);
  }

  const cart = await getOrCreateCart(userId);
  const existingItem = cart.items.find((item) => item.product.toString() === productId);

  if (existingItem) {
    // Already in cart — increase quantity rather than adding a duplicate line item.
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity, priceAtAddition: product.price });
  }

  await cart.save();
  return cart;
};

const updateItemQuantity = async (userId, productId, quantity) => {
  const product = await Product.findById(productId);
  if (product && product.stock < quantity) {
    throw new ApiError(400, `Only ${product.stock} unit(s) available`);
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new ApiError(404, "Cart not found");

  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) throw new ApiError(404, "Item not in cart");

  item.quantity = quantity;
  await cart.save();
  return cart;
};

const removeItem = async (userId, productId) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new ApiError(404, "Cart not found");

  cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  await cart.save();
  return cart;
};

const clearCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  return cart;
};

module.exports = { getCart, addItem, updateItemQuantity, removeItem, clearCart };