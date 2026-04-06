const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, default: "" },

    vendorEmail: { type: String, default: "" },
    vendorShopName: { type: String, default: "" },

    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
