const productService = require("../services/productService");
const ApiResponse = require("../utils/ApiResponse");

const createProduct = async (req, res) => {
  const product = await productService.createProduct(req.user.id, req.body);
  return res.status(201).json(new ApiResponse(201, product, "Product submitted for approval"));
};

const getPublicProducts = async (req, res) => {
  const { search, category, minPrice, maxPrice, minRating, inStock, sortBy, page, limit } = req.query;
  const result = await productService.listPublicProducts({
    search,
    category,
    minPrice,
    maxPrice,
    minRating,
    inStock,
    sortBy,
    page,
    limit,
  });
  return res.status(200).json(new ApiResponse(200, result, "Products fetched"));
};

const getProductById = async (req, res) => {
  const product = await productService.getProductById(req.params.productId);
  return res.status(200).json(new ApiResponse(200, product, "Product fetched"));
};

const getOwnProducts = async (req, res) => {
  const { page, limit } = req.query;
  const result = await productService.listOwnProducts(req.user.id, { page, limit });
  return res.status(200).json(new ApiResponse(200, result, "Your products fetched"));
};

const updateOwnProduct = async (req, res) => {
  const product = await productService.updateOwnProduct(req.params.productId, req.user.id, req.body);
  return res.status(200).json(new ApiResponse(200, product, "Product updated"));
};

const deleteOwnProduct = async (req, res) => {
  await productService.deleteOwnProduct(req.params.productId, req.user.id);
  return res.status(200).json(new ApiResponse(200, null, "Product deleted"));
};

const setApprovalStatus = async (req, res) => {
  const { status } = req.body; // "approved" | "rejected"
  const product = await productService.setProductApprovalStatus(req.params.productId, status);
  return res.status(200).json(new ApiResponse(200, product, `Product ${status}`));
};

module.exports = {
  createProduct,
  getPublicProducts,
  getProductById,
  getOwnProducts,
  updateOwnProduct,
  deleteOwnProduct,
  setApprovalStatus,
};