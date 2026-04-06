
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");
const { sendEmail } = require("../utils/mailer");


// ================= REGISTER (USER + VENDOR) =================
router.post("/register", async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    const roleRaw = String(req.body.role || "user").toLowerCase();
    const role = roleRaw === "vendor" ? "vendor" : "user";

    const shopName = (req.body.shopName || "").trim();

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const payload = {
      name,
      email,
      password: hashedPassword,
      role,
      ...(role === "vendor" ? { vendorStatus: "draft" } : {}),
      ...(role === "vendor" ? { shopName } : {}),
    };

    const user = await User.create(payload);
    await sendEmail({
  to: email,
  subject: "Welcome to FreshMart",
  html: `
  <h2>Welcome to FreshMart</h2>
  <p>Hello ${name},</p>
  <p>Your account was created successfully.</p>
  <p>Start shopping with FreshMart today.</p>
  <br/>
  <p>FreshMart Team</p>
  `
});
    return res.status(201).json({
      msg:
        role === "vendor"
          ? "Vendor registered. Please complete settings and submit for approval."
          : "User registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        vendorStatus: user.role === "vendor" ? (user.vendorStatus || "draft") : undefined,
        shopName: user.role === "vendor" ? user.shopName : undefined,
      },
    });

  } catch (err) {
    console.log("❌ REGISTER ERROR:", err.message);
    return res.status(500).json({ msg: "Server error" });
  }
});


// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {

    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ msg: "All fields required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "User not found. Please register first." });
    }

   const isMatch = await bcrypt.compare(password, user.password);

if (!isMatch) {
  return res.status(400).json({ msg: "Incorrect password" });
}

// ✅ update last login only if password correct
user.lastLogin = new Date();
await user.save();

    if (user.role === "admin") {
      return res.status(403).json({ msg: "Admin login not allowed here" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        vendorStatus: user.role === "vendor" ? (user.vendorStatus || "draft") : undefined,
        shopName: user.role === "vendor" ? user.shopName : undefined,
      },
    });

  } catch (err) {
    console.log("❌ LOGIN ERROR:", err.message);
    return res.status(500).json({ msg: "Server error" });
  }
});


// ================= FORGOT PASSWORD =================
router.post("/forgot-password", async (req, res) => {
  try {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

await sendEmail({
  to: email,
  subject: "FreshMart Password Reset",
  html: `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f4f4;padding:30px">

    <div style="max-width:500px;margin:auto;background:white;padding:30px;border-radius:8px">

      <h2 style="color:#28a745;text-align:center;margin-bottom:20px">
        FreshMart
      </h2>

      <h3 style="text-align:center">Reset Your Password</h3>

      <p>Hello,</p>

      <p>
        We received a request to reset your FreshMart account password.
      </p>

      <div style="text-align:center;margin:30px 0">
        <a href="${resetLink}"
           style="
           background:#28a745;
           color:white;
           padding:12px 25px;
           text-decoration:none;
           border-radius:5px;
           font-weight:bold;">
           Reset Password
        </a>
      </div>

      <p style="font-size:14px;color:#555">
        This link will expire in <b>15 minutes</b>.
      </p>

      <p style="font-size:14px;color:#555">
        If you didn’t request this, you can safely ignore this email.
      </p>

      <hr style="margin:25px 0"/>

      <p style="font-size:12px;color:#999;text-align:center">
        FreshMart Security Team
      </p>

    </div>

  </div>
  `
});
return res.json({
  msg: "Password reset link sent to your email"
});

  } catch (err) {
    console.log("❌ FORGOT PASSWORD ERROR:", err.message);
    return res.status(500).json({ msg: "Server error" });
  }
});


// ================= RESET PASSWORD =================
router.post("/reset-password/:token", async (req, res) => {
  try {

    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();
     await sendEmail({
  to: user.email,
  subject: "FreshMart Password Updated",
  html: `
  <h3>Your password was updated successfully</h3>
  <p>If you did not perform this action please reset your password immediately.</p>
  <br/>
  <p>FreshMart Security Team</p>
  `
});
    return res.json({ msg: "Password updated successfully" });

  } catch (err) {
    console.log("❌ RESET PASSWORD ERROR:", err.message);
    return res.status(500).json({ msg: "Server error" });
  }
});


// ================= ME (GET CURRENT USER) =================
router.get("/me", protect, async (req, res) => {
  try {

    return res.json({
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        vendorStatus: req.user.role === "vendor" ? (req.user.vendorStatus || "draft") : undefined,
        shopName: req.user.role === "vendor" ? req.user.shopName : undefined,
      },
    });

  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
});


module.exports = router;