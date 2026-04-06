const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    desc: { type: String, required: true, trim: true },

    // ✅ Coupon fields
    code: { type: String, trim: true, uppercase: true, unique: true, sparse: true }, 
    discountType: { type: String, enum: ["PERCENT", "AMOUNT"], default: "PERCENT" },
    discountValue: { type: Number, default: 0, min: 0 },
    minOrder: { type: Number, default: 0, min: 0 },
    validTill: { type: Date, default: null },

    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offer", offerSchema);
