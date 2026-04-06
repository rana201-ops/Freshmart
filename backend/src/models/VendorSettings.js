const mongoose = require("mongoose");

const vendorSettingsSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // store details
    shopName: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },

    // optional extra fields (tum already controller me bhej rahe ho)
    city: { type: String, trim: true },
    pincode: { type: String, trim: true },
    panNo: { type: String, trim: true },
    gstNo: { type: String, trim: true },
    bankHolderName: { type: String, trim: true },
    bankAccountNo: { type: String, trim: true },
    ifsc: { type: String, trim: true },

    // documents (uploads)
shopPhoto: { type: String, trim: true }, // image
gstDoc: { type: String, trim: true },    // pdf/image
panDoc: { type: String, trim: true },    // pdf/image

    status: {
      type: String,
      enum: ["draft", "pending_review", "approved", "rejected"],
      default: "draft",
    },

    submittedAt: { type: Date },
    adminRemark: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.VendorSettings ||
  mongoose.model("VendorSettings", vendorSettingsSchema);
