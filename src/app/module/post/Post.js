const { Schema, model } = require("mongoose");
const { EnumSubscriptionPlan } = require("../../../util/enum");
const ObjectId = Schema.Types.ObjectId;

const postSchema = new Schema(
  {
    postTitle: {
      type: String,
      required: true,
    },
    sportType: {
      type: String,
      required: true,
    },
    predictionType: {
      type: String,
      required: true,
    },
    predictionDescription: {
      type: String,
      required: true,
    },
    winRate: {
      type: Number,
      required: true,
    },
    TargetUser: {
      type: String,
      required: true,
      enum: {
        values: [
          EnumSubscriptionPlan.BRONZE,
          EnumSubscriptionPlan.SILVER,
          EnumSubscriptionPlan.GOLD,
        ],
        message: `Invalid Target user status. Allowed values: ${Object.values(
          EnumSubscriptionPlan
        ).join(", ")}`,
      },
    },
    oddsRange: {
      type: String,
      required: true,
    },
    post_image: {
      type: String,
      required: true,
    },
    postedBy: {
      type: ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Post = model("Post", postSchema);

module.exports = Post;
