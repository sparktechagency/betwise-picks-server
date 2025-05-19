const { Schema, model } = require("mongoose");
const ObjectId = Schema.Types.ObjectId;

const subscriptionPlanSchema = new Schema(
  {},
  {
    timestamps: true,
  }
);

const SubscriptionPlan = model("SubscriptionPlan", subscriptionPlanSchema);

module.exports = SubscriptionPlan;
