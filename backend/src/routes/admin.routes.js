const express = require("express");
const router = express.Router();

const { protect, isAdmin } = require("../middleware/authMiddleware");
const adminCtrl = require("../controllers/admin.controller");

// ✅ Admin Auth
router.post("/login", adminCtrl.adminLogin);
router.post("/reset-password", adminCtrl.adminResetPassword);

// ✅ Vendor management
router.get("/vendors", protect, isAdmin, adminCtrl.getVendors);

// 🔥 ONLY pending_review vendors
router.get("/vendors/pending", protect, isAdmin, adminCtrl.getPendingVendors);

// 🔥 Vendor stats (counts)
router.get("/vendors/stats", protect, isAdmin, adminCtrl.getVendorStats);

// 🔥 Approve / Reject / Changes
router.patch("/vendors/:vendorId/status", protect, isAdmin, adminCtrl.updateVendorStatus);

//✅ Newsletter Subscribers
router.get("/subscribers", protect, isAdmin, adminCtrl.getSubscribers);

module.exports = router;

