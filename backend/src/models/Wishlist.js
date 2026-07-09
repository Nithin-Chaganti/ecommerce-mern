/**
 * Wishlist.js
 * ----------------------------------------------------------------------------
 * Purpose: Customer's saved-for-later products. Added in Phase 7 (not
 *          finalized in Phase 4) — see docs/DECISION_LOG.md Phase 7 section
 *          for full rationale.
 *
 * Why a separate collection instead of embedding on User:
 * `protect` middleware fetches the User document on EVERY authenticated
 * request across the whole API. Embedding an unbounded wishlist array there
 * would mean every request — cart, orders, product browsing, anything —
 * pays the cost of loading wishlist data it doesn't need. Referencing keeps
 * User lean and lets wishlist data be fetched only when actually requested.
 *
 * Why simpler than Cart (no per-item sub-schema):
 * Wishlist items carry no metadata (no quantity, no price snapshot) — just
 * "this product is saved." A plain array of ObjectIds is sufficient; a
 * cartItemSchema-style sub-document would be unnecessary complexity here.
 */

const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One wishlist per customer
    },
    products: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Product",
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wishlist", wishlistSchema);