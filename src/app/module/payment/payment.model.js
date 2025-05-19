const { Schema, model } = require("mongoose");
const { EnumPaymentStatus } = require("../../../util/enum");
const ObjectId = Schema.Types.ObjectId;

const paymentSchema = new Schema(
  {
    user: {
      type: ObjectId,
      ref: "User",
    },
    amount: {
      type: Number,
      required: true,
    },
    checkout_session_id: {
      type: String,
      unique: true,
      required: true,
    },
    payment_intent_id: {
      type: String,
    },
    status: {
      type: String,
      default: "unpaid",
      enum: {
        values: [EnumPaymentStatus.UNPAID, EnumPaymentStatus.SUCCEEDED],
        message: `Invalid payment status. Allowed values: ${Object.values(
          EnumPaymentStatus
        ).join(", ")}`,
      },
    },
    subscriptionPlan: {
      type: ObjectId,
      ref: "SubscriptionPlan",
    },
  },
  {
    timestamps: true,
  }
);

const Payment = model("Payment", paymentSchema);
module.exports = Payment;
