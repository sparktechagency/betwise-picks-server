const { Schema, model } = require("mongoose");
const { EnumSubscriptionPlan } = require("../../../util/enum");

const subscriptionPlanSchema = new Schema(
  {
    subscriptionType: {
      type: String,
      required: true,
      enum: {
        values: [
          EnumSubscriptionPlan.BRONZE,
          EnumSubscriptionPlan.SILVER,
          EnumSubscriptionPlan.GOLD,
        ],
        message: `Invalid subscription type. Allowed values: ${Object.values(
          EnumSubscriptionPlan
        ).join(", ")}`,
      },
    },
    features: {
      type: Array,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const SubscriptionPlan = model("SubscriptionPlan", subscriptionPlanSchema);

module.exports = SubscriptionPlan;
