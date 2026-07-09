/**
 * SellerProfile.js
 * ----------------------------------------------------------------------------
 * Purpose: Seller-specific business data, kept separate from User (see User.js
 *          for the full rationale on why this is its own collection).
 *
 * Relationship: 1:1 with User, via `user` reference. Only users with
 *               role === "seller" should have an associated SellerProfile
 *               (enforced at the service layer in Phase 5/6, not the schema
 *               itself — Mongoose can't easily enforce cross-document
 *               constraints like "user.role must equal seller").
 *
 * Approval workflow:
 * `approvalStatus` models the admin-controlled seller approval process
 * described in the project features. A seller can register but cannot list
 * products until an admin sets this to "approved".
 */

const mongoose = require("mongoose");

const sellerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Enforces the 1:1 relationship at the DB level
    },
    storeName: {
      type: String,
      required: [true, "Store name is required"],
      trim: true,
      maxlength: [150, "Store name cannot exceed 150 characters"],
    },
    storeDescription: {
      type: String,
      trim: true,
      maxlength: [1000, "Store description cannot exceed 1000 characters"],
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      // Basic format check for Indian GSTIN — not exhaustive validation,
      // just a sanity check to catch obvious typos.
      match: [/^[0-9A-Z]{15}$/, "GSTIN must be 15 alphanumeric characters"],
    },
    businessAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      country: { type: String, trim: true, default: "India" },
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null, // Populated by admin if approvalStatus === "rejected"
    },
    verificationDocumentUrl: {
      type: String,
      default: null, // Phase 9 addition: Cloudinary URL of GST certificate / ID proof,
      // uploaded during or after seller registration, reviewed by admin before approval.
    },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------
// `user` already has a unique index via `unique: true` above.
// Index on approvalStatus supports the admin dashboard query
// "list all pending sellers awaiting approval".
sellerProfileSchema.index({ approvalStatus: 1 });

module.exports = mongoose.model("SellerProfile", sellerProfileSchema);