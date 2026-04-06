const Category = require("../models/Category");

// GET all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Error fetching categories" });
  }
};

// ADD category
exports.addCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name required" });
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-");

    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const newCategory = new Category({ name, slug });
    await newCategory.save();

    res.json(newCategory);
  } catch (err) {
    res.status(500).json({ message: "Error adding category" });
  }
};