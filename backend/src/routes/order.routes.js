const express = require("express");
const router = express.Router();

const { protect, isAdmin, isVendor } = require("../middleware/authMiddleware");
const orderCtrl = require("../controllers/order.controller");
const Order = require("../models/Order");

// ================= USER =================

// my orders
router.get("/my", protect, orderCtrl.getMyOrders);

// create order
router.post("/", protect, orderCtrl.createOrder);

// cancel order (user)
router.patch("/:orderId/cancel", protect, orderCtrl.cancelMyOrder);

// request return (vendor-wise)
router.patch("/:orderId/return", protect, orderCtrl.requestReturnMyOrder);

// ================= PAYMENT =================

// mark order as paid (Stripe success)
router.post("/mark-paid", protect, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ msg: "Order ID required" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    // ✅ security check (important)
    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    // ✅ update payment
    order.payment.method = "online";
    order.payment.status = "paid";

    // optional but recommended
    order.overallStatus = "processing";

    await order.save();

    res.json({ msg: "Payment marked as paid", order });

  } catch (err) {
    console.log("MARK PAID ERROR:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});


// ================= ADMIN =================

// all orders
router.get("/all", protect, isAdmin, orderCtrl.getAllOrdersAdmin);

// one-time fix (safe)
router.post("/admin/fix-sync", protect, isAdmin, orderCtrl.adminFixOrderStatusSync);

// complete return + refund
router.patch(
  "/:orderId/return/complete",
  protect,
  isAdmin,
  orderCtrl.completeReturn
);


// ================= VENDOR =================

// vendor orders
router.get("/vendor", protect, isVendor, orderCtrl.getVendorOrders);

// vendor update subOrder status
router.patch(
  "/:orderId/suborder/status",
  protect,
  isVendor,
  orderCtrl.updateVendorSubOrderStatus
);

// vendor approve / reject return
router.patch(
  "/:orderId/return/vendor",
  protect,
  isVendor,
  orderCtrl.vendorReturnAction
);

module.exports = router;