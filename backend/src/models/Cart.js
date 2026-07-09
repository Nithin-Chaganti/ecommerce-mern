/**
 * Cart.js
 * ----------------------------------------------------------------------------
 * Purpose: One active cart per customer (decision locked in Phase 2: separate
 *          referenced collection, NOT embedded on User — see DECISION_LOG.md
 *          for full rationale on write-frequency mismatch).
 *
 * Design notes:
 * - `items` is an embedded array WITHIN the Cart document (not a separate
 *   CartItem collection). This is the right call because cart items have no
 *   independent existence outside their cart — they're always read/written
 *   together with the parent cart, so embedding avoids an unnecessary join.
 * - We store `priceAtAddition` on each item as a safety net for displaying
 *   "price changed since you added this" UI, but the AUTHORITATIVE price
 *   used at checkout is always re-fetched live from the Product document
 *   (never trust cached cart prices for actual payment amounts).
 */

const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },
    priceAtAddition: {
      type: Number,
      required: true, // Snapshot for UI display only — re-validated at checkout
    },
  },
  { _id: false } // Sub-documents don't need their own _id; product ref is the natural key
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Enforces exactly one cart per user at the DB level
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// `user` already gets a unique index via `unique: true` above — this is the
// only index this collection needs, since carts are always looked up by user.

module.exports = mongoose.model("Cart", cartSchema);