const wishlistService = require("../services/wishlistService");
const ApiResponse = require("../utils/ApiResponse");

const getWishlist = async (req, res) => {
  const wishlist = await wishlistService.getWishlist(req.user.id);
  return res.status(200).json(new ApiResponse(200, wishlist, "Wishlist fetched"));
};

const addProduct = async (req, res) => {
  const wishlist = await wishlistService.addProduct(req.user.id, req.body.productId);
  return res.status(200).json(new ApiResponse(200, wishlist, "Product added to wishlist"));
};

const removeProduct = async (req, res) => {
  const wishlist = await wishlistService.removeProduct(req.user.id, req.params.productId);
  return res.status(200).json(new ApiResponse(200, wishlist, "Product removed from wishlist"));
};

module.exports = { getWishlist, addProduct, removeProduct };