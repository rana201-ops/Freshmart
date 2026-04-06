// middleware/vendorApproved.js
const User = require("../models/User");

const vendorApproved = async (req, res, next) => {
  try {
    const u = await User.findById(req.user._id).select("role vendorStatus");

    if (!u || u.role !== "vendor") {
      return res.status(403).json({ msg: "Vendor access only" });
    }

    if (u.vendorStatus !== "approved") {
      return res.status(403).json({ msg: "Vendor not approved by admin yet" });
    }

    next();
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};

module.exports = vendorApproved;
