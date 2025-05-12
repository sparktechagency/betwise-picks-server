const auth = require("../../middleware/auth");
const express = require("express");
const { EnumUserRole } = require("../../../util/enum");
const { uploadFile } = require("../../middleware/fileUploader");
const { SuperAdminController } = require("./superAdmin.controller");

const router = express.Router();

router
  .get(
    "/profile",
    auth(EnumUserRole.SUPER_ADMIN),
    SuperAdminController.getProfile
  )
  .patch(
    "/edit-profile",
    auth(EnumUserRole.SUPER_ADMIN),
    uploadFile(),
    SuperAdminController.updateProfile
  )
  .delete(
    "/delete-account",
    auth(EnumUserRole.SUPER_ADMIN),
    SuperAdminController.deleteMyAccount
  );

module.exports = router;
