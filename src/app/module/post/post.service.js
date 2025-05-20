const { default: status } = require("http-status");
const Post = require("./Post");
const QueryBuilder = require("../../../builder/queryBuilder");
const ApiError = require("../../../error/ApiError");
const validateFields = require("../../../util/validateFields");
const unlinkFile = require("../../../util/unlinkFile");

const postPost = async (req) => {
  const { user: userData, body: payload, files } = req;

  validateFields(files, ["post_image"]);
  validateFields(payload, [
    "postTitle",
    "sportType",
    "predictionType",
    "predictionDescription",
    "winRate",
    "targetUser",
    "oddsRange",
    "postedBy",
  ]);

  const postData = {
    postTitle: payload.postTitle,
    sportType: payload.sportType,
    predictionType: payload.predictionType,
    predictionDescription: payload.predictionDescription,
    winRate: payload.winRate,
    targetUser: payload.targetUser,
    oddsRange: payload.oddsRange,
    post_image: files.post_image[0].path,
    postedBy: userData.userId,
  };

  const post = await Post.create(postData);

  return post;
};

const getPost = async (userData, query) => {
  validateFields(query, ["postId"]);

  const post = await Post.findOne({ _id: query.postId })
    .populate("postedBy")
    .lean();

  if (!post) throw new ApiError(status.NOT_FOUND, "Post not found");

  return post;
};

const getAllPosts = async (userData, query) => {
  const postQuery = new QueryBuilder(
    Post.find({}).populate("postedBy").lean(),
    query
  )
    .search(["postTitle", "predictionDescription", "predictionType"])
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

// get all unique sport types from database
const getAllUniqueTypes = async () => {
  const result = await Post.aggregate([
    {
      $group: {
        _id: null,
        sportTypes: { $addToSet: "$sportType" },
        predictionTypes: { $addToSet: "$predictionType" },
      },
    },
    {
      $project: {
        _id: 0,
        sportTypes: 1,
        predictionTypes: 1,
      },
    },
    {
      $set: {
        sportTypes: { $sortArray: { input: "$sportTypes", sortBy: 1 } },
        predictionTypes: {
          $sortArray: { input: "$predictionTypes", sortBy: 1 },
        },
      },
    },
  ]);

  const resultObject = result[0] || {
    sportTypes: [],
    predictionTypes: [],
  };

  return {
    sportTypes: resultObject.sportTypes,
    predictionTypes: resultObject.predictionTypes,
  };
};

const updatePost = async (req) => {
  const { body: payload, files } = req;

  validateFields(payload, ["postId"]);

  const updateData = {
    ...(payload.postTitle && { postTitle: payload.postTitle }),
    ...(payload.sportType && { sportType: payload.sportType }),
    ...(payload.predictionType && { predictionType: payload.predictionType }),
    ...(payload.predictionDescription && {
      predictionDescription: payload.predictionDescription,
    }),
    ...(payload.winRate && { winRate: payload.winRate }),
    ...(payload.targetUser && { targetUser: payload.targetUser }),
    ...(payload.oddsRange && { oddsRange: payload.oddsRange }),
    ...(files.post_image && { post_image: files.post_image[0].path }),
  };

  if (files.post_image && files.post_image[0]) {
    const post = await Post.findById(payload.postId).lean();

    if (!post) throw new ApiError(status.NOT_FOUND, "Post not found");

    unlinkFile(post.post_image);
  }

  const post = await Post.findByIdAndUpdate(payload.postId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!post) throw new ApiError(status.NOT_FOUND, "Post not found");

  return post;
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
  getAllUniqueTypes,
  updatePost,
  deletePost,
};

module.exports = PostService;
