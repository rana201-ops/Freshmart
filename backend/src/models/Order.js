const mongoose = require("mongoose");

const subOrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    price: Number,
    qty: Number,
    image: String,
    chosenQtyLabel: String,
  },
  { _id: false }
);

const subOrderSchema = new mongoose.Schema(
  {
    vendorEmail: { type: String, required: true },
    vendorShopName: { type: String, default: "" },

    items: { type: [subOrderItemSchema], default: [] },
    vendorTotal: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["placed", "accepted", "rejected", "packed", "shipped", "delivered", "cancelled"],
      default: "placed",
    },

    // ✅ NEW: VENDOR-WISE return tracking (real marketplace)
   return: {
  status: {
    type: String,
    enum: ["none", "requested", "approved", "rejected", "completed"],
    default: "none"
  },
  reason: String,
  requestedAt: Date,
  resolvedAt: Date
}
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userEmail: { type: String, required: true },

    total: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    finalTotal: { type: Number, required: true },

    coupon: {
      code: { type: String, default: null },
      type: { type: String, default: null },
      value: { type: Number, default: 0 },
    },

    payment: {
      method: { type: String, enum: ["cod", "online"], default: "cod" },
      status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    },

    razorpay: {
      orderId: { type: String, default: "" },
      paymentId: { type: String, default: "" },
      signature: { type: String, default: "" },
    },

    // ✅ cancel details
    cancel: {
      reason: { type: String, default: "" },
      cancelledAt: { type: Date, default: null },
    },

    // ✅ (OPTIONAL) kept for backward compatibility; UI can ignore later
    returns: {
      reason: { type: String, default: "" },
      requestedAt: { type: Date, default: null },
      approvedAt: { type: Date, default: null },
      pickedUpAt: { type: Date, default: null },
    },

    name: String,
    phone: String,
    address: String,

    subOrders: { type: [subOrderSchema], default: [] },

    overallStatus: {
      type: String,
      enum: [
        "pending_payment",
        "placed",
        "processing",
        "partially_shipped",
        "shipped",
        "partially_delivered",
        "delivered",
        "cancelled",
        "return_requested",
        "returned",
      ],
      default: "placed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);