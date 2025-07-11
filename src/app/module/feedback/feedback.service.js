const { status } = require("http-status");

const ApiError = require("../../../error/ApiError");
const QueryBuilder = require("../../../builder/queryBuilder");
const postNotification = require("../../../util/postNotification");
const Feedback = require("./Feedback");
const validateFields = require("../../../util/validateFields");

const postFeedback = async (userData, payload) => {
  validateFields(payload, ["feedback", "subject"]);

  const feedbackData = {
    user: userData.userId,
    subject: payload.subject,
    feedback: payload.feedback,
  };

  const feedback = await Feedback.create(feedbackData);

  postNotification(
    "Thank You",
    "Thank you for your valuable feedback 🫡",
    userData.userId
  );

  postNotification(
    "New Feedback",
    "BetWise Picks got a new feedback. Check it out!"
  );

  return feedback;
};

const getFeedback = async (userData, query) => {
  validateFields(query, ["feedbackId"]);

  const feedback = await Feedback.findById(query.feedbackId);
  if (!feedback) throw new ApiError(status.NOT_FOUND, "Feedback not found");

  return feedback;
};

const getMyFeedback = async (userData) => {
  const { userId } = userData;

  const feedback = await Feedback.find({ user: userId });
  if (!feedback.length)
    throw new ApiError(status.NOT_FOUND, "Feedback not found");

  return {
    count: feedback.length,
    feedback,
  };
};

const getAllFeedbacks = async (userData, query) => {
  const feedbackQuery = new QueryBuilder(
    Feedback.find({})
      .populate([
        {
          path: "user",
          select: "name email profile_image -_id",
        },
      ])
      .lean(),
    query
  )
    .search([])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [feedbacks, meta] = await Promise.all([
    feedbackQuery.modelQuery,
    feedbackQuery.countTotal(),
  ]);

  return {
    meta,
    feedbacks,
  };
};

const updateFeedbackWithReply = async (userData, payload) => {
  validateFields(payload, ["feedbackId", "reply"]);

  const feedback = await Feedback.findByIdAndUpdate(
    payload.feedbackId,
    { reply: payload.reply },
    { new: true, runValidators: true }
  );

  if (!feedback) throw new ApiError(status.NOT_FOUND, "Feedback not found");

  if (feedback.user)
    postNotification(
      "Feedback Reply",
      "Admin has replied to your feedback",
      feedback.user
    );

  return feedback;
};

const deleteFeedback = async (userData, payload) => {
  validateFields(payload, ["feedbackId"]);

  const result = await Feedback.deleteOne({ _id: payload.feedbackId });

  if (!result.deletedCount)
    throw new ApiError(status.NOT_FOUND, "Feedback not found");

  return result;
};

const FeedbackService = {
  postFeedback,
  getFeedback,
  getMyFeedback,
  getAllFeedbacks,
  updateFeedbackWithReply,
  deleteFeedback,
};

module.exports = { FeedbackService };
