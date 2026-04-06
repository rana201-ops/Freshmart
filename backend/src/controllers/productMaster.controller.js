const ProductMaster = require("../models/ProductMaster");

const normalize = (v) => String(v || "").trim().toLowerCase();

const getDefaultAllowedUnits = ({ category, subCategory, defaultUnit }) => {
  const c = normalize(category);
  const s = normalize(subCategory);
  const du = normalize(defaultUnit || "kg");

  // Fruits / Vegetables => kg,g
  if (c.includes("fruit") || s.includes("fruit") || c.includes("veg") || s.includes("veg")) {
    return ["kg", "g"];
  }

  // Dairy / milk => l,ml
  if (c.includes("milk") || s.includes("milk") || c.includes("dairy") || s.includes("dairy")) {
    return ["l", "ml"];
  }

  // Eggs => piece,dozen
  if (c.includes("egg") || s.includes("egg")) {
    return ["piece", "dozen"];
  }

  // Herbs/leaf => bunch
  if (c.includes("leaf") || s.includes("leaf") || c.includes("herb") || s.includes("herb")) {
    return ["bunch"];
  }

  // Default => only defaultUnit
  return du ? [du] : ["kg"];
};

exports.getMasters = async (req, res) => {
  try {
    const { category, subCategory } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;

    const list = await ProductMaster.find(filter).sort({ name: 1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.createMaster = async (req, res) => {
  try {
    const { name, category, subCategory, defaultUnit, defaultQty, defaultImage, allowedUnits } = req.body;

    if (!name || !category || !subCategory) {
      return res.status(400).json({ msg: "name, category, subCategory required" });
    }

    const nm = name.trim();
    const cat = category.trim();
    const sub = subCategory.trim();

    const exist = await ProductMaster.findOne({
      name: nm,
      category: cat,
      subCategory: sub,
    });

    if (exist) return res.status(400).json({ msg: "Already exists" });

    const du = normalize(defaultUnit || "kg");

    // ✅ Normalize allowedUnits if provided else fallback
    let au = Array.isArray(allowedUnits)
      ? allowedUnits.map(normalize).filter(Boolean)
      : [];

    if (!au.length) {
      au = getDefaultAllowedUnits({ category: cat, subCategory: sub, defaultUnit: du });
    }

    // ✅ ensure defaultUnit is included
    if (du && !au.includes(du)) au.unshift(du);

    const created = await ProductMaster.create({
      name: nm,
      category: cat,
      subCategory: sub,
      defaultUnit: du,
      defaultQty: Number(defaultQty || 1),
      defaultImage: defaultImage || "",
      allowedUnits: au,
    });

    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ msg: e.message || "Server error" });
  }
};

exports.deleteMaster = async (req, res) => {
  try {
    await ProductMaster.findByIdAndDelete(req.params.id);
    res.json({ msg: "Deleted" });
  } catch (e) {
    res.status(500).json({ msg: "Server error" });
  }
};
