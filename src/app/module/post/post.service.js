const { default: status } = require("http-status");
const Post = require("./Post");
const QueryBuilder = require("../../../builder/queryBuilder");
const ApiError = require("../../../error/ApiError");
const validateFields = require("../../../util/validateFields");
const unlinkFile = require("../../../util/unlinkFile");
const deleteFalsyField = require("../../../util/deleteFalsyField");
const { EnumSubscriptionPlan } = require("../../../util/enum");
const User = require("../user/User");
const IsVisible = require("../subscriptionPlan/IsVisible");

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
  /**
   * This function returns a list of posts accessible to the user based on the subscription plan.
   * It filters out the posts based on the allowed subscription plans.
   * The allowed plans are determined by the user's subscription plan.
   * If the user is not subscribed to any plan, it throws an error.
   * If the user is subscribed to a plan but the target user does not match any of the allowed plans,
   * it throws an error.
   * @param {Object} userData - user data
   * @param {Object} query - query object
   * @return {Object} - list of posts and meta data
   */

  const [user, isVisible] = await Promise.all([
    User.findById(userData.userId)
      .select("isSubscribed subscriptionPlan")
      .populate("subscriptionPlan", "subscriptionType")
      .lean()
      .hint({ _id: 1 }),

    IsVisible.findOne({}).lean(),
  ]);

  if (!user.isSubscribed)
    throw new ApiError(status.BAD_REQUEST, "User is not subscribed");

  const userPlanType = user.subscriptionPlan.subscriptionType;
  if (!userPlanType) throw new ApiError(status.BAD_REQUEST, "Invalid plan");

  const planAccessLevels = {
    [EnumSubscriptionPlan.GOLD]: [
      EnumSubscriptionPlan.GOLD,
      EnumSubscriptionPlan.SILVER,
      EnumSubscriptionPlan.BRONZE,
    ],
    [EnumSubscriptionPlan.SILVER]: [
      EnumSubscriptionPlan.SILVER,
      EnumSubscriptionPlan.BRONZE,
    ],
    [EnumSubscriptionPlan.BRONZE]: [EnumSubscriptionPlan.BRONZE],
  };

  const allowedPlans = planAccessLevels[userPlanType];
  if (!allowedPlans)
    throw new ApiError(status.BAD_REQUEST, "Invalid subscription type");

  if (query.targetUser && !allowedPlans.includes(query.targetUser)) {
    throw new ApiError(
      status.BAD_REQUEST,
      "You are not allowed to see this content"
    );
  }

  deleteFalsyField(query);

  const baseQuery = {
    // ...(isVisible.isVisible === true && { targetUser: { $in: allowedPlans } }),
    targetUser: { $in: allowedPlans },
    ...query.filter,
  };

  console.log(baseQuery);

  const postQuery = new QueryBuilder(Post.find(baseQuery).lean(), query)
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

const getAllPostsAdmin = async (query) => {
  deleteFalsyField(query);

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
  getAllPostsAdmin,
  getAllUniqueTypes,
  updatePost,
  deletePost,
};

module.exports = PostService;
