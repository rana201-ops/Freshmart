const mongoose = require("mongoose");

const productMasterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },     // slug or name
    subCategory: { type: String, required: true, trim: true },  // slug or name

    defaultUnit: { type: String, default: "kg", trim: true },
    defaultQty: { type: Number, default: 1 },
    defaultImage: { type: String, default: "" },

    // optional future-safe (admin UI me use nahi karenge)
    allowedUnits: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductMaster", productMasterSchema);
