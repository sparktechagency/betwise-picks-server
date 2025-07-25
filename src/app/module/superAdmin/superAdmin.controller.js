const sendResponse = require("../../../util/sendResponse");
const { SuperAdminService } = require("./superAdmin.service");
const catchAsync = require("../../../util/catchAsync");

const updateProfile = catchAsync(async (req, res) => {
  const result = await SuperAdminService.updateProfile(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const getProfile = catchAsync(async (req, res) => {
  const result = await SuperAdminService.getProfile(req.user);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin retrieved successfully",
    data: result,
  });
});

const deleteMyAccount = catchAsync(async (req, res) => {
  await SuperAdminService.deleteMyAccount(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Account deleted!",
  });
});

const SuperAdminController = {
  updateProfile,
  getProfile,
  deleteMyAccount,
};

module.exports = { SuperAdminController };
