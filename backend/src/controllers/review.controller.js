const Review = require("../models/Review");
const Order = require("../models/Order");


// ✅ USER: Add review (only after that vendor subOrder delivered)
exports.addReview = async (req, res) => {
  try {
    const { orderId, productId, rating, comment } = req.body;

    if (!orderId || !productId || !rating) {
      return res
        .status(400)
        .json({ msg: "orderId, productId, rating required" });
    }

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ msg: "Order not found" });

    // find product inside subOrders
    const sub = (order.subOrders || []).find((so) =>
      (so.items || []).some((x) => String(x.productId) === String(productId))
    );

    if (!sub) {
      return res.status(400).json({ msg: "Product not found in this order" });
    }

    // review allowed only if delivered
    const vendorStatus = String(sub.status || "placed").toLowerCase();
    if (vendorStatus !== "delivered") {
      return res
        .status(400)
        .json({ msg: "Review allowed only after delivery" });
    }

    const item = (sub.items || []).find(
      (x) => String(x.productId) === String(productId)
    );
    if (!item) {
      return res.status(400).json({ msg: "Product not found in this order" });
    }

    // prevent duplicate review
    const exists = await Review.findOne({
      orderId,
      productId,
      user: req.user._id,
    });

    if (exists) {
      return res.status(400).json({ msg: "Review already submitted" });
    }

    const doc = await Review.create({
      orderId,
      productId,
      user: req.user._id,
      userName: req.user.name || req.user.email,

      vendorEmail: sub.vendorEmail || item.vendorEmail || "",
      vendorShopName: sub.vendorShopName || item.vendorShopName || "",

      rating: Number(rating),
      comment: String(comment || "").trim(),
    });

    return res.status(201).json({ msg: "Review submitted", review: doc });

  } catch (err) {
    return res.status(500).json({ msg: err.message || "Server error" });
  }
};


// ✅ PUBLIC: latest reviews for home page
exports.getLatestReviews = async (req, res) => {
  try {
    const limit = Math.min(20, Number(req.query.limit || 6));

    const list = await Review.find({})
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json(list);

  } catch (err) {
    return res.status(500).json({ msg: err.message || "Server error" });
  }
};


// ⭐ NEW: Review statistics (average rating + total reviews)
exports.getReviewStats = async (req, res) => {
  try {

    const reviews = await Review.find({});

    const total = reviews.length;

    const avgRating =
      total === 0
        ? 0
        : reviews.reduce((sum, r) => sum + r.rating, 0) / total;

    res.json({
      avgRating,
      total
    });

  } catch (err) {
    res.status(500).json({ msg: err.message || "Server error" });
  }
};