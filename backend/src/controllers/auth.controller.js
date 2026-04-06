const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const crypto = require("crypto");

exports.signup = async (req, res) => {
  try {
    console.log("SIGNUP BODY:", req.body);

    const { name, email, password, role } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ msg: "All fields are required" });

    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ msg: "User already exists" });

    const finalRole = role === "vendor" ? "vendor" : "user";
    const hash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hash,
      role: finalRole,
    });

    return res.status(201).json({
      msg: "Signup successful",
      debug: { receivedRole: role, savedRole: newUser.role },
    });
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};



exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ msg: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    exports.forgotPassword = async (req, res) => {
  try {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ msg: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetLink = `http://localhost:3000/reset-password/${token}`;

    return res.json({
      msg: "Reset link generated",
      link: resetLink
    });

  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};
exports.resetPassword = async (req, res) => {
  try {

    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user)
      return res.status(400).json({ msg: "Invalid or expired token" });

    const hash = await bcrypt.hash(password, 10);

    user.password = hash;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    return res.json({ msg: "Password updated successfully" });

  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};

    return res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        vendorStatus: user.vendorStatus, // ✅ add this
      },
    });
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};
