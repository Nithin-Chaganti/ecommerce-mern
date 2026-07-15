/**
 * adminRoutes.js
 * ----------------------------------------------------------------------------
 * Purpose: Wires up /api/v1/admin/* endpoints.
 *
 * Every route here uses BOTH `protect` (authentication) AND `restrictTo("admin")`
 * (authorization), applied at the router level via `router.use()` so every
 * route defined below automatically inherits both checks — impossible to
 * accidentally forget on a newly added route.
 */

const { getUsers, updateUserStatus, getPendingSellers, moderateSellerProfile } = require("../controllers/adminController");
const { updateUserStatusValidationRules } = require("../validators/adminValidators");
const validateRequest = require("../middleware/validateRequest");
const protect = require("../middleware/authMiddleware");
const restrictTo = require("../middleware/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Applied to EVERY route defined after this line in this router.
router.use(protect, restrictTo("admin"));

router.get("/users", asyncHandler(getUsers));
router.patch(
  "/users/:userId/status",
  updateUserStatusValidationRules,
  validateRequest,
  asyncHandler(updateUserStatus)
);
router.get("/sellers/pending", asyncHandler(getPendingSellers));
router.patch("/sellers/:profileId/approval", asyncHandler(moderateSellerProfile));

module.exports = router;