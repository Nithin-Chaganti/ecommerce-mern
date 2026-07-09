const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");

const getWishlist = async (userId) => {
  const wishlist = await Wishlist.findOne({ user: userId }).populate(
    "products",
    "title price images ratingsAverage"
  );
  return wishlist || { user: userId, products: [] };
};

const addProduct = async (userId, productId) => {
  const product = await Product.findById(productId);
  if (!product || product.status !== "approved") {
    throw new ApiError(404, "Product not found");
  }

  // $addToSet prevents duplicate entries atomically — no need for a manual
  // "already in wishlist?" check-then-push (which would have a race condition).
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: userId },
    { $addToSet: { products: productId } },
    { upsert: true, new: true }
  );
  return wishlist;
};

const removeProduct = async (userId, productId) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: userId },
    { $pull: { products: productId } },
    { new: true }
  );
  if (!wishlist) throw new ApiError(404, "Wishlist not found");
  return wishlist;
};

module.exports = { getWishlist, addProduct, removeProduct };