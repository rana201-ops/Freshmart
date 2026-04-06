const User = require("../models/User");
const VendorSettings = require("../models/VendorSettings");
const Subscriber = require("../models/Subscriber");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* ===============================
   GET ALL VENDORS
================================ */
exports.getVendors = async (req, res) => {
  try {
    const vendors = await User.find({ role: "vendor" })
      .select("name email role vendorStatus createdAt")
      .sort({ createdAt: -1 });

    const vendorIds = vendors.map((v) => v._id);

    const settings = await VendorSettings.find({ vendor: { $in: vendorIds } }).lean();
    const map = new Map(settings.map((s) => [String(s.vendor), s]));

    const data = vendors.map((v) => ({
      _id: v._id,
      name: v.name,
      email: v.email,
      vendorStatus: v.vendorStatus || "draft",
      createdAt: v.createdAt,
      settings: map.get(String(v._id)) || null,
    }));

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};

/* ===============================
   🔥 ONLY PENDING_REVIEW VENDORS
================================ */
exports.getPendingVendors = async (req, res) => {
  try {
    const vendors = await User.find({
      role: "vendor",
      vendorStatus: "pending_review",
    })
      .select("name email vendorStatus createdAt")
      .sort({ createdAt: -1 });

    const vendorIds = vendors.map((v) => v._id);

    const settings = await VendorSettings.find({ vendor: { $in: vendorIds } }).lean();
    const map = new Map(settings.map((s) => [String(s.vendor), s]));

    const data = vendors.map((v) => ({
      _id: v._id,
      name: v.name,
      email: v.email,
      vendorStatus: v.vendorStatus,
      createdAt: v.createdAt,
      settings: map.get(String(v._id)) || null,
    }));

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};

/* ===============================
   🔥 VENDOR STATS (COUNTS)
================================ */
exports.getVendorStats = async (req, res) => {
  try {
    const total = await User.countDocuments({ role: "vendor" });
    const approved = await User.countDocuments({ role: "vendor", vendorStatus: "approved" });
    const rejected = await User.countDocuments({ role: "vendor", vendorStatus: "rejected" });
    const pendingReview = await User.countDocuments({
      role: "vendor",
      vendorStatus: "pending_review",
    });
    const draft = await User.countDocuments({ role: "vendor", vendorStatus: "draft" });

    return res.json({ total, approved, rejected, pendingReview, draft });
  } catch (err) {
    return res.status(500).json({ msg: "Failed to load stats" });
  }
};

/* ===============================
   🔥 APPROVE / REJECT / CHANGES
================================ */
exports.updateVendorStatus = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { status, remark } = req.body; // approved / rejected / draft

    if (!["approved", "rejected", "draft"].includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    // ✅ reject remark compulsory
    if (status === "rejected" && !String(remark || "").trim()) {
      return res.status(400).json({ msg: "Reject remark is required" });
    }

    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== "vendor") {
      return res.status(404).json({ msg: "Vendor not found" });
    }

    const settings = await VendorSettings.findOne({ vendor: vendorId });
    if (!settings) {
      return res.status(400).json({ msg: "Vendor settings not submitted" });
    }

    // ✅ Approve only if pending_review
    if (status === "approved" && settings.status !== "pending_review") {
      return res.status(400).json({ msg: "Vendor not ready for approval" });
    }

    // ✅ Update BOTH User + VendorSettings
    vendor.vendorStatus = status;
    await vendor.save();

    settings.status = status;

    if (status === "rejected") {
      settings.adminRemark = String(remark).trim(); // ✅ store remark
    } else {
      settings.adminRemark = ""; // ✅ approve/draft => remark clear
    }

    await settings.save();

    return res.json({ msg: `✅ Vendor ${status}` });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "Server error" });
  }
};

/* ===============================
   ADMIN LOGIN & RESET (UNCHANGED)
================================ */
exports.adminLogin = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ msg: "All fields required" });
    }

    const admin = await User.findOne({ email });

    // ✅ No user
    if (!admin) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // ✅ Not admin
    if (admin.role !== "admin") {
      return res.status(403).json({ msg: "Not an admin account" });
    }

    // ✅ Password missing in DB (this often causes 500)
    if (!admin.password) {
      console.log("⚠️ Admin password missing in DB for:", email);
      return res
        .status(500)
        .json({ msg: "Admin password not set in database" });
    }

    // ✅ Compare password safely
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // ✅ JWT secret missing
    if (!process.env.JWT_SECRET) {
      console.log("❌ JWT_SECRET missing in .env");
      return res.status(500).json({ msg: "JWT_SECRET not set in .env" });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      token,
      user: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.log("❌ ADMIN LOGIN ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

// ✅ ADMIN RESET PASSWORD (using ADMIN_RESET_KEY)
exports.adminResetPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const resetKey = String(req.body.resetKey || "").trim();
    const newPassword = String(req.body.newPassword || "").trim();

    if (!email || !resetKey || !newPassword) {
      return res.status(400).json({ msg: "All fields required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    const expectedKey = String(process.env.ADMIN_RESET_KEY || "").trim();
    if (!expectedKey) {
      return res.status(500).json({ msg: "ADMIN_RESET_KEY not set in .env" });
    }

    if (resetKey !== expectedKey) {
      return res.status(403).json({ msg: "Invalid reset key" });
    }

    const admin = await User.findOne({ email });
    if (!admin) return res.status(404).json({ msg: "Admin not found" });

    if (admin.role !== "admin") {
      return res.status(403).json({ msg: "Not an admin account" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    admin.password = hashed;
    await admin.save();

    return res.json({ msg: "✅ Password updated successfully" });
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};
exports.getSubscribers = async (req, res) => {
  try {
    const subs = await Subscriber.find().sort({ createdAt: -1 });
    return res.json(subs);
  } catch (e) {
    return res.status(500).json({ message: "Failed to load subscribers" });
  }
};


