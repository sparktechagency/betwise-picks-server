const auth = require("../../middleware/auth");
const express = require("express");
const DashboardController = require("./dashboard.controller");
const config = require("../../../config");

const router = express.Router();

router;

// overview =======================================================================================================================
// .get(
//   "/total-overview",
//   auth(config.auth_level.admin),
//   DashboardController.totalOverview
// )
// .get("/revenue", auth(config.auth_level.admin), DashboardController.revenue);
// driver-user management ==================
// .get("/get-user", auth(config.auth_level.admin), DashboardController.getUser)

// admin management =======================================================================================================================
// .post(
//   "/post-admin",
//   auth(config.auth_level.super_admin),
//   uploadFile(),
//   DashboardController.postAdmin
// )
// .get(
//   "/get-admin",
//   auth(config.auth_level.super_admin),
//   DashboardController.getAdmin
// )
// .get(
//   "/get-all-admins",
//   auth(config.auth_level.super_admin),
//   DashboardController.getAllAdmins
// )
// .patch(
//   "/edit-admin",
//   auth(config.auth_level.admin),
//   uploadFile(),
//   DashboardController.editAdmin
// )
// .patch(
//   "/block-unblock-admin",
//   auth(config.auth_level.super_admin),
//   DashboardController.blockUnblockAdmin
// )

// // user management =======================================================================================================================
// .get("/get-user", auth(config.auth_level.admin), DashboardController.getUser)
// .get(
//   "/get-all-users",
//   auth(config.auth_level.admin),
//   DashboardController.getAllUsers
// )
// .patch(
//   "/block-unblock-user",
//   auth(config.auth_level.admin),
//   DashboardController.blockUnblockUser
// )
// .delete(
//   "/delete-user",
//   auth(config.auth_level.super_admin),
//   DashboardController.deleteUser
// );

module.exports = router;
