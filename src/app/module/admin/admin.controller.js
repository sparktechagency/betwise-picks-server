const AdminService = require("./admin.service");
const sendResponse = require("../../../util/sendResponse");
const catchAsync = require("../../../util/catchAsync");

const postAdmin = catchAsync(async (req, res) => {
  const result = await AdminService.postAdmin(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin created",
    data: result,
  });
});

const getAdmin = catchAsync(async (req, res) => {
  const result = await AdminService.getAdmin(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin retrieved",
    data: result,
  });
});

const getAllAdmins = catchAsync(async (req, res) => {
  const result = await AdminService.getAllAdmins(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admins retrieved",
    data: result,
  });
});

const updateAdmin = catchAsync(async (req, res) => {
  const result = await AdminService.updateAdmin(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin updated",
    data: result,
  });
});

const deleteAdmin = catchAsync(async (req, res) => {
  const result = await AdminService.deleteAdmin(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin deleted",
    data: result,
  });
});

const AdminController = {
  postAdmin,
  getAdmin,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
};

module.exports = AdminController;
