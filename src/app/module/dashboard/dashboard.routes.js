const auth = require("../../middleware/auth");
const express = require("express");
const DashboardController = require("./dashboard.controller");
const config = require("../../../config");
const { uploadFile } = require("../../middleware/fileUploader");

const router = express.Router();

router

  // overview =======================================================================================================================
  .get(
    "/get-total-overview",
    auth(config.auth_level.admin),
    DashboardController.getTotalOverview
  )
  .get(
    "/get-revenue",
    auth(config.auth_level.admin),
    DashboardController.getRevenue
  )
  .get(
    "/get-growth",
    auth(config.auth_level.admin),
    DashboardController.getGrowth
  );

module.exports = router;
