const mongoose = require("mongoose");
const { EnumSubscriptionPlan } = require("../../../util/enum");
const ObjectId = mongoose.Schema.Types.ObjectId;

const { Schema, model, Types } = mongoose;

const UserSchema = new Schema(
  {
    authId: {
      type: Types.ObjectId,
      required: true,
      ref: "Auth",
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    profile_image: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    dateOfBirth: {
      type: String,
    },
    address: {
      type: String,
    },

    isSubscribed: {
      type: Boolean,
      default: false,
    },
    subscriptionPlan: {
      type: ObjectId,
      ref: "SubscriptionPlan",
    },
    packageType: {
      type: String,
      enum: {
        values: [
          EnumSubscriptionPlan.GOLD,
          EnumSubscriptionPlan.SILVER,
          EnumSubscriptionPlan.BRONZE,
        ],
        message: `Invalid package type. Allowed values are ${[
          EnumSubscriptionPlan.GOLD,
          EnumSubscriptionPlan.SILVER,
          EnumSubscriptionPlan.BRONZE,
        ].join(", ")}.`,
      },
    },
    subscriptionStartDate: {
      type: Date,
    },
    subscriptionEndDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const User = model("User", UserSchema);

module.exports = User;
