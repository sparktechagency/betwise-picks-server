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
  )
  // announcement =======================================================================================================================
  .get("/get-announcement", DashboardController.getAnnouncement)
  .patch(
    "/update-announcement",
    auth(config.auth_level.admin),
    DashboardController.updateAnnouncement
  )
  .patch(
    "/update-toggle-announcement",
    auth(config.auth_level.admin),
    DashboardController.updateToggleAnnouncement
  );

module.exports = router;
