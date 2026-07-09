/**
 * User.js
 * ----------------------------------------------------------------------------
 * Purpose: The core identity document for EVERY person on the platform —
 *          customer, seller, or admin. Role-specific extra data (e.g. seller
 *          store details) lives in a SEPARATE SellerProfile document, not here.
 *
 * Why one User model for all 3 roles instead of 3 separate collections:
 * - Login/auth logic (JWT, password checks) is identical across roles — a
 *   single collection means one auth code path instead of three duplicated ones.
 * - `role` as a discriminator field is simpler to query/index than joining
 *   across three separate user tables when e.g. an admin needs to list ALL users.
 *
 * Why SellerProfile is SEPARATE (not embedded fields on User):
 * - Only ~a subset of users are sellers; embedding seller-only fields
 *   (store name, GSTIN, approval status, bank details) on every User document
 *   wastes space and clutters the schema for the 90% of users who are just customers.
 * - Seller approval workflow (pending/approved/rejected) is its own lifecycle,
 *   cleanly modeled as its own document rather than mixed into core identity.
 *
 * Security-critical fields:
 * - `password` is NEVER returned by default queries (`select: false`).
 * - Passwords are hashed via bcrypt in a pre-save hook — plaintext never touches the DB.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * Phase 7 addition: embedded address sub-schema for the customer's saved
 * address book. Embedded (not a separate collection) because this data is
 * naturally small and bounded (a person has a handful of addresses, not
 * thousands) and always read/written together with the user viewing their
 * own profile — unlike Wishlist/Cart, there's no "every request pays for
 * this" concern (see Wishlist.js for that contrasting case).
 */
const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: "Home" }, // e.g. "Home", "Work"
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, default: "India", trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // Creates a unique index automatically
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // CRITICAL: excludes password from all default find() queries
    },
    role: {
      type: String,
      enum: {
        values: ["customer", "seller", "admin"],
        message: "{VALUE} is not a supported role",
      },
      default: "customer",
    },
    isActive: {
      type: Boolean,
      default: true, // Admin can deactivate a user without deleting their data
    },
    refreshToken: {
      type: String,
      select: false, // Stored so we can invalidate it on logout; never exposed by default
    },
    avatarUrl: {
      type: String,
      default: null, // Populated via Cloudinary upload (Phase 9)
    },
    addresses: {
      type: [addressSchema],
      default: [], // Phase 7 addition — customer's saved address book
    },
  },
  {
    timestamps: true, // Adds createdAt/updatedAt automatically — useful for admin analytics
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------
// email already gets a unique index via `unique: true` above.
// Index on role supports the common admin query "list all sellers" / "list all customers".
userSchema.index({ role: 1 });

// ---------------------------------------------------------------------------
// Pre-save hook: hash password before persisting
// ---------------------------------------------------------------------------
userSchema.pre("save", async function (next) {
  // Only re-hash if the password field was actually modified — prevents
  // re-hashing an already-hashed password every time the user is saved
  // for an unrelated reason (e.g. updating their name).
  if (!this.isModified("password")) return next();

  const SALT_ROUNDS = 12; // 12 is a strong, widely-recommended default (not too slow, not too weak)
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  next();
});

// ---------------------------------------------------------------------------
// Instance method: compare a plaintext candidate password against the stored hash
// ---------------------------------------------------------------------------
userSchema.methods.comparePassword = async function (candidatePassword) {
  // `this.password` is available here because the calling code must
  // explicitly `.select("+password")` when fetching the user for login.
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);