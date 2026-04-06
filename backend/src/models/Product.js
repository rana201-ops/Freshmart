const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // ✅ ADMIN MASTER REFERENCE
    productMasterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductMaster",
      required: true,
    },

    // name comes from ProductMaster
    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 1,
    },

    image: {
      type: String,
      required: true,
      trim: true,
    },

    // ✅ Quantity / Unit
    unit: {
      type: String,
      required: true,
      enum: ["kg", "g", "ml", "l", "piece", "dozen", "bunch", "pack"],
      trim: true,
    },

    qty: {
      type: Number,
      required: true,
      min: 1,
    },

    qtyLabel: {
      type: String,
      trim: true, // e.g. "500 g", "1 bunch"
    },

    category: {
      type: String,
      required: true,
      trim: true, // e.g. "fresh-fruits"
    },

    subCategory: {
      type: String,
      required: true,
      trim: true, // e.g. "fruits"
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // ✅ Vendor info
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    vendorEmail: {
      type: String,
      trim: true,
    },

    vendorShopName: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
