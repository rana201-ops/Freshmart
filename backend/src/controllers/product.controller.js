const Product = require("../models/Product");
const User = require("../models/User");
const ProductMaster = require("../models/ProductMaster");

const normalize = (v) => String(v || "").trim().toLowerCase();

// ✅ category/subCategory based allowed units
const getUnitsByCategory = (category, subCategory) => {
  const c = normalize(category);
  const s = normalize(subCategory);

  // fruits + vegetables
  if (
    c.includes("fruit") || s.includes("fruit") ||
    c.includes("veg") || s.includes("veg") ||
    c.includes("vegetable") || s.includes("vegetable")
  ) return ["kg", "g"];

  // dairy
  if (c.includes("dairy") || s.includes("dairy") || c.includes("milk") || s.includes("milk"))
    return ["l", "ml"];

  // staples (allow pack too)
  if (c.includes("staple") || s.includes("staple"))
    return ["kg", "g", "pack"];

  // eggs etc (optional)
  if (c.includes("egg") || s.includes("egg"))
    return ["piece", "dozen"];

  return ["kg"];
};

// ✅ Vendor: Add product
const createProduct = async (req, res) => {
  try {
    const { productMasterId, price, unit, qty } = req.body;

    if (!req.file) return res.status(400).json({ msg: "Image file is required" });

    if (!productMasterId || !price || !unit || !qty) {
      return res.status(400).json({ msg: "productMasterId, price, unit, qty required" });
    }

    const master = await ProductMaster.findById(productMasterId);
    if (!master) return res.status(400).json({ msg: "Invalid Product Name (Admin)" });

    // ✅ validate unit by category/subcategory mapping
    const allowed = getUnitsByCategory(master.category, master.subCategory);
    const unitNorm = normalize(unit);

    if (!allowed.includes(unitNorm)) {
      return res.status(400).json({
        msg: `Invalid unit for this product. Allowed: ${allowed.join(", ")}`,
      });
    }

    const qtyNum = Number(qty);
    const priceNum = Number(price);

    if (Number.isNaN(priceNum) || priceNum < 1) {
      return res.status(400).json({ msg: "Price must be a valid number (>= 1)" });
    }
    if (Number.isNaN(qtyNum) || qtyNum <= 0) {
      return res.status(400).json({ msg: "Qty must be a valid number (> 0)" });
    }

    const user = await User.findById(req.user._id);
    const vendorShopName = user?.shopName || "";
    const imagePath = `/uploads/${req.file.filename}`;

    // ✅ IMPORTANT: category/subCategory/name always from master
    const name = String(master.name || "").trim();
    const category = String(master.category || "").trim();
    const subCategory = String(master.subCategory || "").trim();

    const newProduct = await Product.create({
      productMasterId,
      name,
      price: priceNum,
      image: imagePath,

      category,
      subCategory,

      unit: unitNorm,
      qty: qtyNum,
      qtyLabel: `${qtyNum} ${unitNorm}`,

      vendor: req.user._id,
      vendorEmail: req.user.email,
      vendorShopName,
      status: "pending",
    });

    return res.status(201).json({
      msg: "Product submitted (pending approval)",
      product: newProduct,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: err.message || "Server error" });
  }
};

// ✅ Public/User: Get approved products
const getApprovedProducts = async (req, res) => {
  try {
    const { category, subCategory, q } = req.query;
    const filter = { status: "approved" };

    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;

    if (q && String(q).trim()) {
      const rx = new RegExp(String(q).trim(), "i");
      filter.$or = [{ name: rx }, { vendorShopName: rx }];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};

// ✅ Public/User: Get single approved product by id
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, status: "approved" });
    if (!product) return res.status(404).json({ msg: "Product not found" });

    return res.json(product);
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};

// ✅ Vendor: Get my products
const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.user._id }).sort({ createdAt: -1 });
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};

// ✅ Admin: Get pending products
const getPendingProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: "pending" })
      .populate("vendor", "name email role")
      .sort({ createdAt: -1 });
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};

// ✅ Admin: Get all products
const getAllProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find({})
      .populate("vendor", "name email role")
      .sort({ createdAt: -1 });
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};

// ✅ Admin: Approve / Reject product
const updateProductStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: "Product not found" });

    product.status = status;
    await product.save();

    return res.json({ msg: `Product ${status}`, product });
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};

// ✅ Admin OR Vendor: Delete product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: "Product not found" });

    const isOwner = product.vendor.toString() === req.user._id.toString();
    const isAdminUser = req.user.role === "admin";

    if (!isAdminUser && !isOwner) {
      return res.status(403).json({ msg: "Access denied" });
    }

    await product.deleteOne();
    return res.json({ msg: "Product deleted" });
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  createProduct,
  getApprovedProducts,
  getProductById,
  getMyProducts,
  getPendingProducts,
  getAllProductsAdmin,
  updateProductStatus,
  deleteProduct,
};
