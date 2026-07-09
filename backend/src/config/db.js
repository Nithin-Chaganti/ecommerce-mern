/**
 * db.js
 * ----------------------------------------------------------------------------
 * Purpose: Establishes and manages the single MongoDB Atlas connection for
 *          the entire backend, using Mongoose as the ODM.
 *
 * Responsibility: ONLY database connection logic lives here. No models,
 *                 no business logic.
 *
 * Dependencies: mongoose, process.env.MONGODB_URI (from .env)
 *
 * Design notes:
 * - We fail FAST and LOUD if the connection string is missing or the
 *   connection fails — better to crash on startup than run silently
 *   broken and fail on the first real request.
 * - `maxPoolSize` is set explicitly rather than left to the driver default.
 *   For a learning/portfolio project on a free-tier Atlas cluster, keeping
 *   this modest avoids hitting Atlas's free-tier connection limits.
 * - We listen for post-connection runtime events (`error`, `disconnected`)
 *   so problems that occur AFTER a successful initial connection are also
 *   logged, not silently swallowed.
 */

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      // Fail fast: there's no point starting the server without a DB.
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 10, // Cap concurrent connections — sane default for free-tier Atlas
      serverSelectionTimeoutMS: 10000, // Fail within 10s instead of hanging indefinitely
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);

    // Runtime event listeners — these catch issues AFTER the initial connect succeeds
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB runtime connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting to reconnect is handled by the driver.");
    });
  } catch (error) {
    console.error(`Failed to connect to MongoDB: ${error.message}`);
    // Exit the process — running the API without a DB connection is worse
    // than not running at all, since every DB-dependent route would fail anyway.
    process.exit(1);
  }
};

module.exports = connectDB;