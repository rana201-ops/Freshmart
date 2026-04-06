const upload = require("../middleware/uploadMiddleware");
const express = require("express");
const router = express.Router();

const { protect, isVendor } = require("../middleware/authMiddleware");
const vendorCtrl = require("../controllers/vendorSettings.controller");

// GET vendor settings
router.get("/", protect, isVendor, vendorCtrl.getMySettings);

//  POST vendor settings (SAVE / SUBMIT)
router.post(
  "/",
  protect,
  isVendor,
  upload.fields([
    { name: "shopPhoto", maxCount: 1 },
    { name: "gstDoc", maxCount: 1 },
    { name: "panDoc", maxCount: 1 },
  ]),
  (req, res, next) => {
    console.log(" HIT POST /api/vendor/settings");
    next();
  },
  vendorCtrl.saveMySettings
);

module.exports = router;
