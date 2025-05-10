const catchAsync = require("../../../util/catchAsync");
const DashboardService = require("./dashboard.service");

// overview ===============================================================================================================================
const totalOverview = catchAsync(async (req, res) => {
  const result = await DashboardService.totalOverview();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Total overview retrieved successfully",
    data: result,
  });
});

const revenue = catchAsync(async (req, res) => {
  const result = await DashboardService.revenue(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Revenue retrieved successfully",
    data: result,
  });
});

// admin management =======================================================================================================================
const postAdmin = catchAsync(async (req, res) => {
  const result = await DashboardService.postAdmin(req.user, req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Admin created successfully",
    data: result,
  });
});

const getAdmin = catchAsync(async (req, res) => {
  const result = await DashboardService.getAdmin(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin retrieved successfully",
    data: result,
  });
});

const getAllAdmins = catchAsync(async (req, res) => {
  const result = await DashboardService.getAllAdmins(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All admins retrieved successfully",
    data: result,
  });
});

const editAdmin = catchAsync(async (req, res) => {
  const result = await DashboardService.editAdmin(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin updated successfully",
    data: result,
  });
});

const blockUnblockAdmin = catchAsync(async (req, res) => {
  const result = await DashboardService.blockUnblockAdmin(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin blocked/unblocked successfully",
    data: result,
  });
});

const DashboardController = {
  postAdmin,
  getAdmin,
  getAllAdmins,
  editAdmin,
  blockUnblockAdmin,
};

module.exports = DashboardController;
