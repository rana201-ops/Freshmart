const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ fresh user fetch (latest vendorStatus)
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) return res.status(401).json({ msg: "User not found" });

      return next();
    } catch (err) {
      return res.status(401).json({ msg: "Not authorized, token failed" });
    }
  }

  return res.status(401).json({ msg: "Not authorized, no token" });
};

const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ msg: "Admin access only" });
  }
  next();
};

const isVendor = (req, res, next) => {
  if (req.user?.role !== "vendor") {
    return res.status(403).json({ msg: "Vendor access only" });
  }
  next();
};

module.exports = { protect, isAdmin, isVendor };
