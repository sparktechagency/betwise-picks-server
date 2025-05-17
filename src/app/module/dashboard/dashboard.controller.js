const catchAsync = require("../../../util/catchAsync");
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

const DashboardController = {
  getRevenue,
  getTotalOverview,
  getGrowth,
};

module.exports = DashboardController;
