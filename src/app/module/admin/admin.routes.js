const express = require("express");
const auth = require("../../middleware/auth");
const config = require("../../../config");
const AdminController = require("./admin.controller");
const { uploadFile } = require("../../middleware/fileUploader");

const router = express.Router();

router
  .post(
    "/post-admin",
    auth(config.auth_level.super_admin),
    uploadFile(),
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
    uploadFile(),
    AdminController.updateAdmin
  )
  .patch(
    "/update-admin-password",
    auth(config.auth_level.super_admin),
    AdminController.updateAdminPassword
  )
  .delete(
    "/delete-admin",
    auth(config.auth_level.super_admin),
    AdminController.deleteAdmin
  )
  .get(
    "/get-profile-admin",
    auth(config.auth_level.user),
    AdminController.getProfileAdmin
  )
  .patch(
    "/update-profile-image-admin",
    auth(config.auth_level.admin),
    uploadFile(),
    AdminController.updateProfileImageAdmin
  )
  .patch(
    "/block-unblock-admin",
    auth(config.auth_level.super_admin),
    AdminController.blockUnblockAdmin
  );

module.exports = router;
