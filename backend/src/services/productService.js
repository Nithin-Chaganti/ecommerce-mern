/**
 * productService.js
 * ----------------------------------------------------------------------------
 * Purpose: Business logic for product CRUD. THIS is where the Phase 6
 *          resource-ownership pattern gets fully implemented — every
 *          update/delete checks `product.seller.toString() === requesterId`
 *          BEFORE allowing the mutation, in addition to (not instead of)
 *          the role check already applied at the route level.
 */

const Product = require("../models/Product");
const Category = require("../models/Category");
const ApiError = require("../utils/ApiError");

/**
 * Creates a product. Always starts as "pending" — sellers cannot make a
 * product live themselves; only admin approval (Phase 7 admin route below)
 * flips it to "approved". This mirrors the real-world SellerProfile
 * approval workflow from Phase 4/6.
 */
const createProduct = async (sellerId, productData) => {
  const categoryExists = await Category.findById(productData.category);
  if (!categoryExists) {
    throw new ApiError(404, "Category not found");
  }

  return Product.create({
    ...productData,
    seller: sellerId,
    status: "pending",
  });
}; 

/**
 * Public product listing/search — only ever returns APPROVED products.
 * Supports (Phase 8):
 *   - `search`: full-text search across title/description/tags (Phase 4 text index)
 *   - `category`, `minPrice`, `maxPrice`, `minRating`, `inStock`: filters
 *   - `sortBy`: "newest" | "priceLowHigh" | "priceHighLow" | "rating"
 */
const listPublicProducts = async ({
  search,
  category,
  minPrice,
  maxPrice,
  minRating,
  inStock,
  sortBy = "newest",
  page = 1,
  limit = 20,
}) => {
  const filter = { status: "approved" };

  if (category) filter.category = category;
  if (inStock === "true") filter.stock = { $gt: 0 };

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (minRating) {
    filter.ratingsAverage = { $gte: Number(minRating) };
  }

  // $text search MUST be combined into the filter object itself (not chained
  // separately) for MongoDB to use the text index correctly.
  if (search) {
    filter.$text = { $search: search };
  }

  // Sort mapping. NOTE: when a text search is active, MongoDB can also sort
  // by relevance score (`{ score: { $meta: "textScore" } }`) — but that's
  // mutually exclusive with sorting by price/rating in the same query.
  // We deliberately let an explicit `sortBy` override relevance sorting: a
  // customer who searches AND picks "price low to high" clearly wants price
  // order, not relevance order. Relevance sort is only the default when
  // `search` is present and `sortBy` was left as the default "newest".
  const sortMap = {
    newest: { createdAt: -1 },
    priceLowHigh: { price: 1 },
    priceHighLow: { price: -1 },
    rating: { ratingsAverage: -1 },
  };
  let sortOption = sortMap[sortBy] || sortMap.newest;

  let query = Product.find(filter);

  if (search && sortBy === "newest") {
    // Default case: search present, no explicit sort chosen -> rank by relevance.
    query = query.select({ score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } });
  } else {
    query = query.sort(sortOption);
  }

  const skip = (page - 1) * limit;

  const [products, totalCount] = await Promise.all([
    query.skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: { currentPage: Number(page), totalPages: Math.ceil(totalCount / limit), totalCount },
    appliedFilters: { search, category, minPrice, maxPrice, minRating, inStock, sortBy },
  };
};

const getProductById = async (productId) => {
  const product = await Product.findById(productId).populate("category", "name slug");
  if (!product || product.status !== "approved") {
    // Same 404 whether it doesn't exist OR it's pending/rejected — we don't
    // want to leak "this product exists but isn't approved yet" to random visitors.
    throw new ApiError(404, "Product not found");
  }
  return product;
};

/**
 * Seller's own product list — INCLUDES pending/rejected, since the seller
 * needs to see the status of everything they've submitted.
 */
const listOwnProducts = async (sellerId, { page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const [products, totalCount] = await Promise.all([
    Product.find({ seller: sellerId }).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Product.countDocuments({ seller: sellerId }),
  ]);
  return {
    products,
    pagination: { currentPage: Number(page), totalPages: Math.ceil(totalCount / limit), totalCount },
  };
};

/**
 * THE CORE RESOURCE-OWNERSHIP CHECK, promised back in Phase 6.
 * `restrictTo("seller")` at the route level only proves "this user IS a
 * seller" — it says nothing about which products they own. This explicit
 * comparison is what actually prevents Seller A from editing Seller B's product.
 */
const assertSellerOwnsProduct = (product, requesterId) => {
  if (product.seller.toString() !== requesterId) {
    // 403, not 404 — the resource exists, the requester just isn't allowed
    // to touch it. (Some APIs deliberately return 404 here to avoid
    // confirming the resource exists at all; we choose 403 for clearer
    // debugging in this learning project, and note the trade-off.)
    throw new ApiError(403, "You do not have permission to modify this product");
  }
};

const updateOwnProduct = async (productId, requesterId, updates) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  assertSellerOwnsProduct(product, requesterId);

  // Sellers editing an already-approved product resets it to "pending" —
  // re-review prevents a seller from getting approval for a legitimate
  // product then silently swapping in different content afterward.
  const restrictedFields = ["title", "description", "price", "images"];
  const isContentChange = restrictedFields.some((f) => f in updates);

  Object.assign(product, updates);
  if (isContentChange && product.status === "approved") {
    product.status = "pending";
  }

  await product.save();
  return product;
};

const deleteOwnProduct = async (productId, requesterId) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  assertSellerOwnsProduct(product, requesterId);

  await Product.findByIdAndDelete(productId);
};

/**
 * Admin-only: approve or reject a pending product. No ownership check
 * needed here — admin authority is global by design (role check alone is
 * sufficient for admin actions, since admin isn't scoped to "their own" resources).
 */
const setProductApprovalStatus = async (productId, status) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  product.status = status;
  await product.save();
  return product;
};

module.exports = {
  createProduct,
  listPublicProducts,
  getProductById,
  listOwnProducts,
  updateOwnProduct,
  deleteOwnProduct,
  setProductApprovalStatus,
};