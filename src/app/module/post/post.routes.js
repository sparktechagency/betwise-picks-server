const express = require("express");
const auth = require("../../middleware/auth");
const config = require("../../../config");
const PostController = require("./post.controller");
const { uploadFile } = require("../../middleware/fileUploader");

const router = express.Router();

router
  .post(
    "/post-post",
    auth(config.auth_level.admin),
    uploadFile(),
    PostController.postPost
  )
  .get("/get-post", auth(config.auth_level.user), PostController.getPost)
  .get(
    "/get-all-posts",
    auth(config.auth_level.user),
    PostController.getAllPosts
  )
  .patch(
    "/update-post",
    auth(config.auth_level.admin),
    uploadFile(),
    PostController.updatePost
  )
  .delete(
    "/delete-post",
    auth(config.auth_level.admin),
    PostController.deletePost
  );

module.exports = router;
