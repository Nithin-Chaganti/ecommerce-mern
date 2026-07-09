/**
 * Product.js
 * ----------------------------------------------------------------------------
 * Purpose: The core catalog item. Heavily read, moderately written (stock
 *          updates on every order, price/description updates occasionally).
 *
 * Key design decisions:
 * - `seller` and `category` are REFERENCED (not embedded) — products need to
 *   be queried independently by seller ("seller's product list") and by
 *   category ("browse Electronics"), and embedding would duplicate seller/
 *   category data across every product document.
 * - `ratingsAverage` and `ratingsCount` are DENORMALIZED (cached) onto the
 *   Product document itself, rather than computing an average over all
 *   Review documents on every single product page view. This trades a small
 *   amount of write complexity (recompute on new review — done in the Review
 *   model's post-save hook) for a MASSIVE read performance win, since product
 *   listing pages render ratings for many products at once.
 * - `status` models the admin approval workflow (a seller creates a product,
 *   but it isn't publicly visible until approved).
 */

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
      max: [90, "Discount cannot exceed 90%"],
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    images: {
      type: [String], // Array of Cloudinary URLs
      validate: {
        validator: (arr) => arr.length > 0 && arr.length <= 8,
        message: "A product must have between 1 and 8 images",
      },
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // References the User (role: seller), not SellerProfile —
      // keeps ownership checks simple: compare against req.user.id directly.
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    tags: {
      type: [String], // Used for simple content-based recommendation similarity (Phase 13)
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending", // Newly created products require admin approval before going live
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (val) => Math.round(val * 10) / 10, // Rounds to 1 decimal place (e.g. 4.666 -> 4.7)
    },
    ratingsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------
// Text index enables full-text search across title/description/tags (Phase 8).
productSchema.index({ title: "text", description: "text", tags: "text" });

// Compound index supports the very common query: "approved products in category X,
// sorted by newest" — a compound index matching the filter + sort fields together
// is far more efficient than separate single-field indexes for this pattern.
productSchema.index({ category: 1, status: 1, createdAt: -1 });

// Supports "seller views their own product list" efficiently.
productSchema.index({ seller: 1, status: 1 });

// Phase 8 additions: support price-sorted and rating-sorted browsing combined
// with the status filter every public query always applies. Without these,
// sorting by price/rating on a large approved-product set would require an
// in-memory sort after fetching, instead of the index handling sort order directly.
productSchema.index({ status: 1, price: 1 });
productSchema.index({ status: 1, ratingsAverage: -1 });

// slug already gets a unique index via `unique: true` above.

// Auto-generate a unique-ish slug from title before saving.
productSchema.pre("save", function (next) {
  if (!this.isModified("title")) return next();
  const base = this.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  // Append a short random suffix to reduce slug collisions between similarly-titled
  // products from different sellers (e.g. two sellers both listing "iPhone 15 Case").
  this.slug = `${base}-${Math.random().toString(36).substring(2, 8)}`;
  next();
});

module.exports = mongoose.model("Product", productSchema);