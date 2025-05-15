const PostService = require("./post.service");
const sendResponse = require("../../../util/sendResponse");
const catchAsync = require("../../../util/catchAsync");

const postPost = catchAsync(async (req, res) => {
  const result = await PostService.postPost(req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Post created",
    data: result,
  });
});

const getPost = catchAsync(async (req, res) => {
  const result = await PostService.getPost(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Post retrieved",
    data: result,
  });
});

const getAllPosts = catchAsync(async (req, res) => {
  const result = await PostService.getAllPosts(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Posts retrieved",
    data: result,
  });
});

const updatePost = catchAsync(async (req, res) => {
  const result = await PostService.updatePost(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Post updated",
    data: result,
  });
});

const deletePost = catchAsync(async (req, res) => {
  const result = await PostService.deletePost(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Post deleted",
    data: result,
  });
});

const PostController = {
  postPost,
  getPost,
  getAllPosts,
  updatePost,
  deletePost,
};

module.exports = PostController;
