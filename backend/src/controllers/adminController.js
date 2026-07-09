/**
 * adminController.js
 * ----------------------------------------------------------------------------
 * Purpose: Thin HTTP layer for admin user-management endpoints.
 */

const adminService = require("../services/adminService");
const ApiResponse = require("../utils/ApiResponse");

const getUsers = async (req, res) => {
  const { role, page, limit } = req.query;
  const result = await adminService.listUsers({ role, page, limit });
  return res.status(200).json(new ApiResponse(200, result, "Users fetched successfully"));
};

const updateUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { isActive } = req.body;

  const updatedUser = await adminService.setUserActiveStatus({
    targetUserId: userId,
    isActive,
    requestingAdminId: req.user.id,
  });

  const safeUser = {
    id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    isActive: updatedUser.isActive,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, safeUser, `User ${isActive ? "activated" : "deactivated"} successfully`));
};

module.exports = { getUsers, updateUserStatus };