const express = require("express");
const {
  protect,
  isAdmin,
  isVendor,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/admin", protect, isAdmin, (req, res) => {
  res.json({ msg: "Welcome Admin" });
});

router.get("/vendor", protect, isVendor, (req, res) => {
  res.json({ msg: "Welcome Vendor" });
});

module.exports = router;
