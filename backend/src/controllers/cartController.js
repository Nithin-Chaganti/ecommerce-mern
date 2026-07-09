const cartService = require("../services/cartService");
const ApiResponse = require("../utils/ApiResponse");

const getCart = async (req, res) => {
  const cart = await cartService.getCart(req.user.id);
  return res.status(200).json(new ApiResponse(200, cart, "Cart fetched"));
};

const addItem = async (req, res) => {
  const cart = await cartService.addItem(req.user.id, req.body);
  return res.status(200).json(new ApiResponse(200, cart, "Item added to cart"));
};

const updateItem = async (req, res) => {
  const cart = await cartService.updateItemQuantity(req.user.id, req.params.productId, req.body.quantity);
  return res.status(200).json(new ApiResponse(200, cart, "Cart item updated"));
};

const removeItem = async (req, res) => {
  const cart = await cartService.removeItem(req.user.id, req.params.productId);
  return res.status(200).json(new ApiResponse(200, cart, "Item removed from cart"));
};

const clearCart = async (req, res) => {
  const cart = await cartService.clearCart(req.user.id);
  return res.status(200).json(new ApiResponse(200, cart, "Cart cleared"));
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };