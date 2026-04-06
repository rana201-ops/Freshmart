
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: true },
    lastLogin: {
  type: Date
},

    role: {
      type: String,
      enum: ["user", "admin", "vendor"],
      default: "user",
    },

    vendorStatus: {
      type: String,
      enum: ["draft", "pending_review", "approved", "rejected"],
      default: "draft",
    },

    shopName: { type: String, default: "" },

    //  forgot password fields
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },

  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);