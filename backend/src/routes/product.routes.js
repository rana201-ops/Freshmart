const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");
const { protect, isAdmin, isVendor } = require("../middleware/authMiddleware");
const vendorApproved = require("../middleware/vendorApproved");
const productCtrl = require("../controllers/product.controller");

// multer error -> 400
const uploadSingleImage = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ msg: err.message || "Image upload failed" });
    next();
  });
};

// =====================================
// ✅ PUBLIC
// =====================================
router.get("/", productCtrl.getApprovedProducts);

// =====================================
// ✅ VENDOR (IMPORTANT: keep BEFORE "/:id")
// =====================================

// ✅ vendor can view own products
router.get("/mine", protect, isVendor, productCtrl.getMyProducts);

// ✅ ONLY APPROVED vendor can ADD product
router.post("/", protect, isVendor, vendorApproved, uploadSingleImage, productCtrl.createProduct);

// =====================================
// ✅ ADMIN (keep BEFORE "/:id" as well)
// =====================================
router.get("/pending", protect, isAdmin, productCtrl.getPendingProducts);
router.get("/all", protect, isAdmin, productCtrl.getAllProductsAdmin);
router.patch("/:id/status", protect, isAdmin, productCtrl.updateProductStatus);

// ✅ SEARCH PRODUCTS (ADD HERE 🔥)
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;

    const Product = require("../models/Product"); // ensure model

    const products = await Product.find({
     name: { $regex: "^" + query, $options: "i" }
    }).limit(10);

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Search error" });
  }
});

// =====================================
// ✅ PUBLIC: get single product details (KEEP LAST)
// =====================================
router.get("/:id", productCtrl.getProductById);

// =====================================
// ✅ ADMIN OR OWNER
// =====================================
router.delete("/:id", protect, productCtrl.deleteProduct);

module.exports = router;