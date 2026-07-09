/**
 * server.js
 * ----------------------------------------------------------------------------
 * Purpose: The actual entry point of the backend. Its ONLY responsibilities:
 *   1. Load environment variables
 *   2. Connect to MongoDB
 *   3. Start the HTTP server (app.listen)
 *   4. Handle process-level failure safety nets (unhandled rejections,
 *      uncaught exceptions, graceful shutdown)
 *
 * Why so thin:
 * All actual Express configuration lives in src/app.js. This file exists
 * purely to bootstrap the process — this separation is what allows app.js
 * to be imported directly into tests without opening a real port.
 */

// Load environment variables from .env as early as possible — before any
// other module (like db.js) reads process.env values.
require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  // Connect to the database FIRST. If this fails, connectDB itself calls
  // process.exit(1) — we never want to start accepting HTTP traffic
  // without a working DB connection.
  await connectDB();

  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
};

startServer();

// -----------------------------------------------------------------------------
// Process-level safety nets
// -----------------------------------------------------------------------------
// These catch failure modes that Express's own error handler CANNOT catch,
// because they happen outside any request/response cycle (e.g. a rejected
// promise from a background job, a bug in a setTimeout callback, etc.).
//
// Philosophy: log it, then shut down gracefully rather than continuing to
// run in a possibly-corrupted state. A process manager (Render/Railway,
// or PM2 in self-managed setups) will restart the process automatically.

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on("uncaughtException", (error) => {
  console.error("Unhandled Exception:", error);
  process.exit(1); // Uncaught exceptions leave the process in an unknown state — exit immediately
});

// Graceful shutdown on termination signals (e.g. when Render/Railway
// redeploys or restarts the container).
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  if (server) {
    server.close(() => {
      console.log("Server closed.");
      process.exit(0);
    });
  }
});