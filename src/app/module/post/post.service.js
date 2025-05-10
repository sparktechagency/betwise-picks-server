const { default: status } = require("http-status");
const Post = require("./Post");
const QueryBuilder = require("../../../builder/queryBuilder");
const ApiError = require("../../../error/ApiError");
const validateFields = require("../../../util/validateFields");

const postPost = async (userData, payload) => {
  // Add your logic here
};

const getPost = async (userData, query) => {
  validateFields(query, ["postId"]);

  const post = await Post.findOne({ _id: query.postId }).lean();

  if (!post) throw new ApiError(status.NOT_FOUND, "Post not found");

  return post;
};

const getAllPosts = async (userData, query) => {
  const postQuery = new QueryBuilder(Post.find({}).lean(), query)
    .search([])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [posts, meta] = await Promise.all([
    postQuery.modelQuery,
    postQuery.countTotal(),
  ]);

  return {
    meta,
    posts,
  };
};

const updatePost = async (userData, payload) => {
  // Add your logic here
};

const deletePost = async (userData, payload) => {
  validateFields(payload, ["postId"]);

  const post = await Post.deleteOne({ _id: payload.postId });

  if (!post.deletedCount)
    throw new ApiError(status.NOT_FOUND, "Post not found");

  return post;
};

const PostService = {
  postPost,
  getPost,
  getAllPosts,
  updatePost,
  deletePost,
};

module.exports = PostService;
