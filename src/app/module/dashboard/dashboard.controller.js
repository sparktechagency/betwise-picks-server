const catchAsync = require("../../../util/catchAsync");
const sendResponse = require("../../../util/sendResponse");
const DashboardService = require("./dashboard.service");

const getRevenue = catchAsync(async (req, res) => {
  const result = await DashboardService.getRevenue(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Revenue retrieved successfully",
    data: result,
  });
});

const getTotalOverview = catchAsync(async (req, res) => {
  const result = await DashboardService.getTotalOverview(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Total overview retrieved successfully",
    data: result,
  });
});

const getGrowth = catchAsync(async (req, res) => {
  const result = await DashboardService.getGrowth(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Growth retrieved successfully",
    data: result,
  });
});

// announcement ====================

const getAnnouncement = catchAsync(async (req, res) => {
  const result = await DashboardService.getAnnouncement(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Announcement retrieved successfully",
    data: result,
  });
});

const updateAnnouncement = catchAsync(async (req, res) => {
  const result = await DashboardService.updateAnnouncement(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Announcement updated successfully",
    data: result,
  });
});

const updateToggleAnnouncement = catchAsync(async (req, res) => {
  const result = await DashboardService.updateToggleAnnouncement(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Announcement toggle updated successfully",
    data: result,
  });
});

const DashboardController = {
  getTotalOverview,
  getRevenue,
  getGrowth,

  getAnnouncement,
  updateAnnouncement,
  updateToggleAnnouncement,
};

module.exports = DashboardController;
