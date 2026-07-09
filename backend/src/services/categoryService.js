/**
 * categoryService.js
 * ----------------------------------------------------------------------------
 * Purpose: Business logic for category management. Categories are simple
 *          enough that this service is thin — but keeping the layer
 *          consistent across all resources (rather than "big resources get
 *          a service, small ones don't") keeps the codebase predictable.
 */

const Category = require("../models/Category");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");

const createCategory = async ({ name, parentCategory }) => {
  const existing = await Category.findOne({ name });
  if (existing) {
    throw new ApiError(409, "A category with this name already exists");
  }

  if (parentCategory) {
    const parentExists = await Category.findById(parentCategory);
    if (!parentExists) {
      throw new ApiError(404, "Parent category not found");
    }
  }

  return Category.create({ name, parentCategory: parentCategory || null });
};

const listCategories = async () => {
  // Only active categories, top-level first — small enough dataset (categories
  // rarely number more than a few hundred even at scale) that we don't
  // paginate here, unlike Product/User listings.
  return Category.find({ isActive: true }).sort({ name: 1 });
};

const updateCategory = async (categoryId, updates) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  Object.assign(category, updates);
  await category.save();
  return category;
};

const deleteCategory = async (categoryId) => {
  // Guard rail: don't allow deleting a category that still has products
  // referencing it — that would leave orphaned Product.category references
  // pointing at nothing, breaking category-filtered browsing for those products.
  const productCount = await Product.countDocuments({ category: categoryId });
  if (productCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete category with ${productCount} product(s) still assigned to it. Reassign or remove them first.`
    );
  }

  const deleted = await Category.findByIdAndDelete(categoryId);
  if (!deleted) {
    throw new ApiError(404, "Category not found");
  }
};

module.exports = { createCategory, listCategories, updateCategory, deleteCategory };