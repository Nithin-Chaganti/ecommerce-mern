/**
 * healthRoutes.js
 * ----------------------------------------------------------------------------
 * Purpose: Defines the /api/v1/health endpoint.
 * Responsibility: Route wiring ONLY — no logic here, that lives in the controller.
 */

const express = require("express");
const { checkHealth } = require("../controllers/healthController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// GET /api/v1/health
router.get("/", asyncHandler(checkHealth));

module.exports = router;