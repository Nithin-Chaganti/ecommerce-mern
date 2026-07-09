const categoryService = require("../services/categoryService");
const ApiResponse = require("../utils/ApiResponse");

const createCategory = async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  return res.status(201).json(new ApiResponse(201, category, "Category created"));
};

const getCategories = async (req, res) => {
  const categories = await categoryService.listCategories();
  return res.status(200).json(new ApiResponse(200, categories, "Categories fetched"));
};

const updateCategory = async (req, res) => {
  const category = await categoryService.updateCategory(req.params.categoryId, req.body);
  return res.status(200).json(new ApiResponse(200, category, "Category updated"));
};

const deleteCategory = async (req, res) => {
  await categoryService.deleteCategory(req.params.categoryId);
  return res.status(200).json(new ApiResponse(200, null, "Category deleted"));
};

module.exports = { createCategory, getCategories, updateCategory, deleteCategory };