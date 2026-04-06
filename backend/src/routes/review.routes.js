const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const reviewCtrl = require("../controllers/review.controller");

// public: home page reviews
router.get("/latest", reviewCtrl.getLatestReviews);

// ⭐ ADD THIS ROUTE
router.get("/stats", reviewCtrl.getReviewStats);

// user: add review
router.post("/", protect, reviewCtrl.addReview);

module.exports = router;
