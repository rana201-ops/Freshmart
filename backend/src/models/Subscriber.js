const mongoose = require("mongoose");

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    isActive: { type: Boolean, default: true },

    // ✅ NEW FIELDS
    amountPaid: { type: Number, default: 49 },   // ₹49 subscription
    paymentStatus: { type: String, default: "paid" }, // paid / pending
    paymentId: { type: String }, // Stripe payment id (optional)

  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscriber", subscriberSchema);