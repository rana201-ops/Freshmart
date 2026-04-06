const Order = require("../models/Order");

/* =========================================================
   HELPER: derive overallStatus (REALISTIC)
========================================================= */
function deriveOverallStatus(order) {
  const pm = (order?.payment?.method || "cod").toLowerCase();
  const ps = (order?.payment?.status || "pending").toLowerCase();
  const subs = order?.subOrders || [];

  // online unpaid
  if (pm === "online" && ps !== "paid") return "pending_payment";

  // cancelled
  if ((order?.overallStatus || "").toLowerCase() === "cancelled") {
    return "cancelled";
  }

  // 🔥 fully returned FIRST
  if (
    subs.length > 0 &&
    subs.every(s => (s?.return?.status || "none") === "completed")
  ) {
    return "returned";
  }

  // 🔥 return in progress
  if (
    subs.some(s =>
      ["requested", "approved"].includes(
        (s?.return?.status || "none").toLowerCase()
      )
    )
  ) {
    return "return_requested";
  }

  // COD auto-paid
  if (
    pm === "cod" &&
    subs.length > 0 &&
    subs.every(s => (s.status || "").toLowerCase() === "delivered")
  ) {
    order.payment.status = "paid";
  }

  const st = subs.map(s => (s.status || "placed").toLowerCase());

  if (st.every(x => x === "delivered")) return "delivered";
  if (st.every(x => ["cancelled", "rejected"].includes(x))) return "cancelled";
  if (st.some(x => x === "shipped")) return "shipped";
  if (st.some(x => ["accepted", "packed"].includes(x))) return "processing";

  return "placed";
}
/* =========================================================
   CREATE ORDER
========================================================= */
exports.createOrder = async (req, res) => {
  try {
    const { items, total, finalTotal, payment, name, phone, address } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ msg: "Cart empty" });

    const map = new Map();

    for (const it of items) {
      if (!map.has(it.vendorEmail)) {
        map.set(it.vendorEmail, {
          vendorEmail: it.vendorEmail,
          vendorShopName: it.vendorShopName || "",
          items: [],
          vendorTotal: 0,
          status: "placed",
          return: { status: "none" },
        });
      }

      const sub = map.get(it.vendorEmail);
      sub.items.push(it);
      sub.vendorTotal += Number(it.price || 0) * Number(it.qty || 1);
    }

    const order = await Order.create({
      user: req.user._id,
      userEmail: req.user.email,
      total,
      finalTotal,
      payment: {
        method: payment?.method || "cod",
        status: "pending",
      },
      name,
      phone,
      address,
      subOrders: Array.from(map.values()),
      overallStatus: "placed",
    });

    order.overallStatus = deriveOverallStatus(order);
    await order.save();

    res.status(201).json({ msg: "Order placed", order });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* =========================================================
   USER: GET MY ORDERS
========================================================= */
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* =========================================================
   USER: CANCEL ORDER (FULL)
========================================================= */
exports.cancelMyOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ msg: "Order not found" });

    if (String(order.user) !== String(req.user._id))
      return res.status(403).json({ msg: "Access denied" });

    if (order.overallStatus === "cancelled")
      return res.status(400).json({ msg: "Order already cancelled" });

    const blocked = order.subOrders.some(s =>
      ["shipped", "delivered"].includes((s.status || "").toLowerCase())
    );

    if (blocked)
      return res.status(400).json({
        msg: "Order already shipped. Cancellation not allowed.",
      });

    order.subOrders.forEach(s => {
      if (!["cancelled", "rejected"].includes(s.status)) {
        s.status = "cancelled";
      }
    });

    order.cancel = {
      reason: reason || "No reason provided",
      cancelledAt: new Date(),
    };

    if (order.payment.method === "online" && order.payment.status === "paid") {
      order.payment.status = "refunded";
    }

    order.overallStatus = deriveOverallStatus(order);

    await order.save();

    res.json({ msg: "Order cancelled successfully", order });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* =========================================================
   USER: REQUEST RETURN (VENDOR-WISE)
========================================================= */
exports.requestReturnMyOrder = async (req, res) => {
  try {
    const { vendorEmail, reason } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) return res.status(404).json({ msg: "Order not found" });

    if (String(order.user) !== String(req.user._id))
      return res.status(403).json({ msg: "Access denied" });

    if (order.overallStatus === "cancelled")
      return res.status(400).json({ msg: "Cancelled order cannot be returned" });

    const sub = order.subOrders.find(s => s.vendorEmail === vendorEmail);
    if (!sub) return res.status(404).json({ msg: "Vendor not found" });

    if ((sub.status || "").toLowerCase() !== "delivered")
      return res.status(400).json({ msg: "Return allowed only after delivery" });

    if (sub.return?.status !== "none")
      return res.status(400).json({ msg: "Return already requested" });

    sub.return = {
      status: "requested",
      reason: reason || "No reason provided",
      requestedAt: new Date(),
    };

    order.overallStatus = deriveOverallStatus(order);

    await order.save();

    res.json({ msg: "Return request submitted", order });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* =========================================================
   VENDOR: GET VENDOR ORDERS
========================================================= */
exports.getVendorOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      "subOrders.vendorEmail": req.user.email,
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* =========================================================
   VENDOR: UPDATE SUBORDER STATUS
========================================================= */
exports.updateVendorSubOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) return res.status(404).json({ msg: "Order not found" });

    const sub = order.subOrders.find(
      s => s.vendorEmail === req.user.email
    );

    if (!sub) return res.status(403).json({ msg: "Not your order" });

    if (order.overallStatus === "cancelled")
      return res.status(400).json({ msg: "Order is cancelled" });

    if (["requested", "approved"].includes(sub.return?.status))
      return res.status(400).json({ msg: "Return in progress" });

    sub.status = status;

    // 🔥 ADD THIS BLOCK
    if (status === "delivered") {
      if (order.payment.method === "cod") {
        order.payment.status = "paid";
      }
    }

    order.overallStatus = deriveOverallStatus(order);

    await order.save();

    res.json({ msg: "Status updated", order });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* =========================================================
   VENDOR: APPROVE / REJECT RETURN
========================================================= */
exports.vendorReturnAction = async (req, res) => {
  try {
    const { action } = req.body; // approve | reject
    const order = await Order.findById(req.params.orderId);

    const sub = order.subOrders.find(
      s => s.vendorEmail === req.user.email
    );
    if (!sub) return res.status(403).json({ msg: "Not your order" });

    if (sub.return.status !== "requested")
      return res.status(400).json({ msg: "Invalid return state" });

    sub.return.status = action === "approve" ? "approved" : "rejected";
    sub.return.resolvedAt = new Date();

    order.overallStatus = deriveOverallStatus(order);
    await order.save();

    res.json({ msg: "Return updated" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* =========================================================
   ADMIN: GET ALL ORDERS
========================================================= */
exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* =========================================================
   ADMIN: COMPLETE RETURN
========================================================= */
exports.completeReturn = async (req, res) => {
  try {
    const { vendorEmail } = req.body;

    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ msg: "Order not found" });

    const sub = order.subOrders.find(
      s => s.vendorEmail === vendorEmail
    );

    if (!sub)
      return res.status(404).json({ msg: "Vendor not found" });

    if (sub.return?.status !== "approved")
      return res.status(400).json({ msg: "Return not approved yet" });

    // ✅ mark completed
    sub.return.status = "completed";

    // ✅ refund
    order.payment.status = "refunded";

    order.overallStatus = deriveOverallStatus(order);

    await order.save();

    res.json({ msg: "Return completed & refunded", order });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
/* =========================================================
   ADMIN: FIX STATUS SYNC
========================================================= */
exports.adminFixOrderStatusSync = async (req, res) => {
  try {
    const orders = await Order.find();
    for (const o of orders) {
      o.overallStatus = deriveOverallStatus(o);
      await o.save();
    }
    res.json({ msg: "Order status synced" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};