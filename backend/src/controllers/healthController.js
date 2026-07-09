/**
 * healthController.js
 * ----------------------------------------------------------------------------
 * Purpose: Exposes a simple endpoint that reports whether the API process
 *          is up AND whether it currently holds a live DB connection.
 *
 * Why this matters (real-world relevance):
 * Deployment platforms (Render/Railway) and uptime monitors (e.g. UptimeRobot)
 * ping a health endpoint to decide if the service is healthy. Returning
 * "200 OK" even when the DB is down gives you false confidence — so we
 * report DB state explicitly rather than just returning a static "OK".
 */

const mongoose = require("mongoose");
const ApiResponse = require("../utils/ApiResponse");

const checkHealth = async (req, res) => {
  // mongoose.connection.readyState: 0 = disconnected, 1 = connected,
  // 2 = connecting, 3 = disconnecting
  const dbStateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const healthData = {
    server: "up",
    database: dbStateMap[mongoose.connection.readyState] || "unknown",
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime().toFixed(2),
  };

  return res.status(200).json(new ApiResponse(200, healthData, "Service is healthy"));
};

module.exports = { checkHealth };