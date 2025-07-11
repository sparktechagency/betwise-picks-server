const mongoose = require("mongoose");
const { Schema, model, Types } = mongoose;

const SuperAdminSchema = new Schema(
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
    address: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const SuperAdmin = model("SuperAdmin", SuperAdminSchema);

module.exports = SuperAdmin;
