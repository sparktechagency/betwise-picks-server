const express = require("express");
const auth = require("../../middleware/auth");
const config = require("../../../config");
const PostController = require("./post.controller");

const router = express.Router();

router
  .post("/post-post", auth(config.auth_level.user), PostController.postPost)
  .get("/get-post", auth(config.auth_level.user), PostController.getPost)
  .get(
    "/get-all-posts",
    auth(config.auth_level.user),
    PostController.getAllPosts
  )
  .patch(
    "/update-post",
    auth(config.auth_level.user),
    PostController.getAllPosts
  )
  .delete(
    "/delete-post",
    auth(config.auth_level.user),
    PostController.deletePost
  );

module.exports = router;
