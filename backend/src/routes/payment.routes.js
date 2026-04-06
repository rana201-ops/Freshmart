const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const payCtrl = require("../controllers/payment.controller");

// Razorpay
router.post("/razorpay/order", protect, payCtrl.createRazorpayOrder);
router.post("/razorpay/verify", protect, payCtrl.verifyRazorpayPayment);

// Stripe
router.post("/stripe/create-intent", protect, payCtrl.createStripePaymentIntent);

module.exports = router;