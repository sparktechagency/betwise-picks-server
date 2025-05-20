const { Schema, model, Types } = require("mongoose");

const feedbackSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
    },
    subject: {
      type: String,
      required: true,
    },
    feedback: {
      type: String,
      required: true,
    },
    reply: {
      type: String,
    },
  },
  { timestamps: true }
);

const Feedback = model("Feedback", feedbackSchema);

module.exports = Feedback;
