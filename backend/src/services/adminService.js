/**
 * adminService.js
 * ----------------------------------------------------------------------------
 * Purpose: Business logic for admin-only user management actions.
 * Kept separate from the controller per our layered architecture.
 */

const User = require("../models/User");
const ApiError = require("../utils/ApiError");

/**
 * Lists users with optional role filtering and pagination.
 * Pagination is included even at this early stage because "list all users"
 * without limits is exactly the kind of query that silently works fine with
 * 20 test users and then falls over in front of an interviewer with a
 * "what if there were a million users?" question.
 */
const listUsers = async ({ role, page = 1, limit = 20 }) => {
  const filter = {};
  if (role) filter.role = role;

  const skip = (page - 1) * limit;

  // Run the count and the page fetch in parallel — no reason to wait for one
  // before starting the other, they're independent queries.
  const [users, totalCount] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    },
  };
};

/**
 * Activates or deactivates a user account.
 * Guards against an admin accidentally deactivating themselves, which would
 * otherwise lock them out with no way to self-recover via the API.
 */
const setUserActiveStatus = async ({ targetUserId, isActive, requestingAdminId }) => {
  if (targetUserId === requestingAdminId) {
    throw new ApiError(400, "Admins cannot change their own active status via this endpoint");
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isActive = isActive;
  await user.save({ validateBeforeSave: false });

  return user;
};

const listPendingSellers = async ({ page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const filter = { approvalStatus: "pending" };

  const [profiles, totalCount] = await Promise.all([
    SellerProfile.find(filter).populate("user", "name email").skip(skip).limit(limit).sort({ createdAt: -1 }),
    SellerProfile.countDocuments(filter),
  ]);

  return {
    profiles,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    },
  };
};

const approveSellerProfile = async (profileId, status, rejectionReason = null) => {
  const profile = await SellerProfile.findById(profileId);
  if (!profile) {
    throw new ApiError(404, "Seller profile not found");
  }

  profile.approvalStatus = status;
  if (status === "rejected") {
    profile.rejectionReason = rejectionReason;
  } else {
    profile.rejectionReason = null;
  }

  await profile.save();
  return profile;
};

module.exports = { listUsers, setUserActiveStatus, listPendingSellers, approveSellerProfile };