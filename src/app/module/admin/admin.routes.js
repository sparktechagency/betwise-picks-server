const express = require("express");
const auth = require("../../middleware/auth");
const config = require("../../../config");
const AdminController = require("./admin.controller");

const router = express.Router();

router
  .post(
    "/post-admin",
    auth(config.auth_level.super_admin),
    AdminController.postAdmin
  )
  .get("/get-admin", auth(config.auth_level.user), AdminController.getAdmin)
  .get(
    "/get-all-admins",
    auth(config.auth_level.super_admin),
    AdminController.getAllAdmins
  )
  .patch(
    "/update-admin",
    auth(config.auth_level.super_admin),
    AdminController.updateAdmin
  )
  .delete(
    "/delete-admin",
    auth(config.auth_level.super_admin),
    AdminController.deleteAdmin
  );

module.exports = router;
