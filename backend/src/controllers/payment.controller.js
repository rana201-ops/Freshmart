
const Razorpay = require("razorpay");

const crypto = require("crypto");
const Order = require("../models/Order");
console.log("Stripe Key Loaded:", process.env.STRIPE_SECRET_KEY);
let stripe;

function getStripe() {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe key missing in environment variables");
    }
    stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

// ✅ helper: derive overallStatus from PAYMENT + subOrders
function deriveOverallStatus(order) {
  const pm = (order?.payment?.method || "cod").toLowerCase();
  const ps = (order?.payment?.status || "pending").toLowerCase();
  const subs = order?.subOrders || [];

  if (pm === "online" && ps !== "paid") return "pending_payment";

  const st = subs.map((s) => (s.status || "placed").toLowerCase());
  if (st.length === 0) return "placed";

  if (st.every((x) => x === "delivered")) return "delivered";
  if (st.every((x) => x === "cancelled" || x === "rejected")) return "cancelled";

  const shippedOrDelivered = (x) => x === "shipped" || x === "delivered";
  if (st.every((x) => shippedOrDelivered(x))) return "shipped";
  if (st.some((x) => x === "shipped") && st.some((x) => !shippedOrDelivered(x))) return "partially_shipped";
  if (st.some((x) => x === "delivered") && st.some((x) => x !== "delivered")) return "partially_delivered";
  if (st.some((x) => ["accepted", "packed", "shipped", "delivered"].includes(x))) return "processing";

  return "placed";
}

// ✅ Razorpay client (lazy init) so demo mode doesn't crash
let razorpayClient = null;
function getRazorpayClient() {
  const mode = (process.env.PAYMENT_MODE || "live").toLowerCase();
  if (mode === "demo") return null;

  if (!razorpayClient) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay keys missing in .env (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)");
    }
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayClient;
}

// ✅ CREATE ORDER (Razorpay / Demo)
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { dbOrderId } = req.body;
    if (!dbOrderId) return res.status(400).json({ msg: "dbOrderId required" });

    const order = await Order.findById(dbOrderId);
    if (!order) return res.status(404).json({ msg: "Order not found" });
    if (String(order.user) !== String(req.user._id)) return res.status(403).json({ msg: "Access denied" });

    if ((order.payment?.status || "").toLowerCase() === "paid") {
      return res.status(400).json({ msg: "Payment already completed for this order" });
    }

    const mode = (process.env.PAYMENT_MODE || "live").toLowerCase();

    // ✅ DEMO MODE: no razorpay API call
    if (mode === "demo") {
      order.payment.method = "online";
      order.payment.status = "pending";
      order.razorpay.orderId = "demo_order_" + Date.now();
      order.overallStatus = deriveOverallStatus(order);
      await order.save();

      return res.json({
        demo: true,
        key: "demo_key",
        razorpayOrderId: order.razorpay.orderId,
        amount: Math.round(Number(order.finalTotal || 1) * 100),
        currency: "INR",
        dbOrderId: order._id,
      });
    }

    // ✅ LIVE MODE
    const amount = Math.round(Number(order.finalTotal || 0) * 100);
    if (!amount || amount <= 0) return res.status(400).json({ msg: "Invalid amount" });

    const client = getRazorpayClient();
    const rpOrder = await client.orders.create({
      amount,
      currency: "INR",
      receipt: String(order._id),
    });

    order.payment.method = "online";
    order.payment.status = "pending";
    order.razorpay.orderId = rpOrder.id;
    order.overallStatus = deriveOverallStatus(order);
    await order.save();

    return res.json({
      key: process.env.RAZORPAY_KEY_ID,
      razorpayOrderId: rpOrder.id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      dbOrderId: order._id,
    });
  } catch (err) {
    console.log("CREATE RZP ERROR:", err?.statusCode, err?.error || err);
    return res.status(500).json({ msg: err?.error?.description || err.message || "Server error" });
  }
};

// ✅ VERIFY PAYMENT (Razorpay / Demo)
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const mode = (process.env.PAYMENT_MODE || "live").toLowerCase();
    const { dbOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!dbOrderId) return res.status(400).json({ msg: "dbOrderId required" });

    const order = await Order.findById(dbOrderId);
    if (!order) return res.status(404).json({ msg: "Order not found" });
    if (String(order.user) !== String(req.user._id)) return res.status(403).json({ msg: "Access denied" });

    // ✅ DEMO MODE: mark paid directly
    if (mode === "demo") {
      order.payment.method = "online";
      order.payment.status = "paid";
      order.razorpay.orderId = razorpay_order_id || order.razorpay.orderId || "demo";
      order.razorpay.paymentId = razorpay_payment_id || "demo";
      order.razorpay.signature = razorpay_signature || "demo";
      order.overallStatus = deriveOverallStatus(order);
      await order.save();

      return res.json({ msg: "✅ Demo payment verified", order });
    }

    // ✅ LIVE MODE validations
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ msg: "Missing payment fields" });
    }

    if ((order.payment?.status || "").toLowerCase() === "paid") {
      return res.json({ msg: "Already paid", order });
    }

    if (order.razorpay?.orderId && order.razorpay.orderId !== razorpay_order_id) {
      return res.status(400).json({ msg: "OrderId mismatch" });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      order.payment.method = "online";
      order.payment.status = "failed";
      order.overallStatus = deriveOverallStatus(order);
      await order.save();
      return res.status(400).json({ msg: "Invalid signature" });
    }

    // ✅ success
    order.payment.method = "online";
    order.payment.status = "paid";
    order.razorpay.orderId = razorpay_order_id;
    order.razorpay.paymentId = razorpay_payment_id;
    order.razorpay.signature = razorpay_signature;
    order.overallStatus = deriveOverallStatus(order);
    await order.save();

    return res.json({ msg: "Payment verified & Order placed", order });
  } catch (err) {
    console.log("VERIFY RZP ERROR:", err?.statusCode, err?.error || err);
    return res.status(500).json({ msg: err?.error?.description || err.message || "Server error" });
  }
};
// ==============================
// ==============================
// ✅ STRIPE PAYMENT INTENT
// ==============================

exports.createStripePaymentIntent = async (req, res) => {
  try {
    const { amount, dbOrderId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: "Invalid amount" });
    }

    const order = await Order.findById(dbOrderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "inr",
      automatic_payment_methods: { enabled: true },
    });

    // 🔥 Mark as paid immediately (for test mode)
    order.payment.method = "online";
    order.payment.status = "paid";
    order.overallStatus = deriveOverallStatus(order);
    await order.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
    });

  } catch (err) {
    console.log("STRIPE ERROR:", err.message);
    res.status(500).json({ msg: "Stripe payment failed" });
  }
};