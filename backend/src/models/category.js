/**
 * Category.js
 * ----------------------------------------------------------------------------
 * Purpose: Product categorization (e.g. "Electronics", "Fashion"). Supports
 *          a simple one-level parent/child hierarchy (e.g. "Electronics" ->
 *          "Mobile Phones") via an optional `parentCategory` self-reference.
 *
 * Why a self-referencing tree instead of a flat list:
 * Real e-commerce sites (Amazon/Flipkart) always have nested categories.
 * Modeling this now (even if the UI only uses 1-2 levels initially) avoids
 * a painful migration later. We keep it simple: unlimited depth is
 * technically possible via the schema, but we'll enforce max 2 levels at
 * the service layer to keep breadcrumb UI simple.
 */

const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      // Generated from `name` in a pre-save hook (e.g. "Mobile Phones" -> "mobile-phones")
      // Used for SEO-friendly URLs on the frontend (/category/mobile-phones)
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null, // null = top-level category
    },
    isActive: {
      type: Boolean,
      default: true, // Admin can hide a category without deleting it (preserves product references)
    },
  },
  { timestamps: true }
);

// slug and name already get unique indexes via `unique: true` above.
categorySchema.index({ parentCategory: 1 }); // Supports "get all subcategories of X"

// Auto-generate slug from name before saving, if not explicitly provided.
categorySchema.pre("save", function (next) {
  if (!this.isModified("name")) return next();
  this.slug = this.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  next();
});

module.exports = mongoose.model("Category", categorySchema);