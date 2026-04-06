const SubCategory = require("../models/SubCategory");
const Category = require("../models/Category");

// GET by categorySlug
exports.getSubCategories = async (req, res) => {
  try {
    const { categorySlug } = req.query;

    const category = await Category.findOne({ slug: categorySlug });
    if (!category) return res.json([]);

    const subs = await SubCategory.find({
      category: category._id,
      isActive: true
    });

    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching subcategories" });
  }
};

// ADD subcategory
exports.addSubCategory = async (req, res) => {
  try {
    const { name, categoryId } = req.body;

    if (!name || !categoryId) {
      return res.status(400).json({ message: "Name and category required" });
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-");

    const newSub = new SubCategory({
      name,
      slug,
      category: categoryId
    });

    await newSub.save();

    res.json(newSub);
  } catch (err) {
    res.status(500).json({ message: "Error adding subcategory" });
  }
};