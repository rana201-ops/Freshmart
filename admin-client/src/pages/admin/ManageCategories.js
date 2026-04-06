import { useState, useEffect } from "react";
import api from "../../api";

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [catName, setCatName] = useState("");
  const [subName, setSubName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const loadCategories = async () => {
    try {
      const res = await api.get("/api/categories");
      setCategories(res.data || []);
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

 const addCategory = async () => {
  if (!catName.trim()) return;

  try {
    await api.post("/api/categories", { name: catName });

    setCatName("");
    loadCategories();
    alert("Category added successfully");
  } catch (err) {
    console.error(err);

    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.msg ||
      "Failed to add category";

    alert(msg);
  }
};

  const addSubCategory = async () => {
  if (!selectedCategory || !subName.trim()) return;

  try {
    await api.post("/api/subCategories", {
      name: subName,
      categoryId: selectedCategory,
    });

    setSubName("");
    loadCategories();
    alert("SubCategory added successfully");
  } catch (err) {
    console.error(err);

    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.msg ||
      "Failed to add subcategory";

    alert(msg);
  }
};

  return (
    <div className="container py-4">
      <h3 className="mb-4">Manage Categories</h3>

      {/* Add Category */}
      <div className="card p-3 mb-4">
        <h5>Add Category</h5>
        <input
          type="text"
          className="form-control mt-2"
          placeholder="Enter category name"
          value={catName}
          onChange={(e) => setCatName(e.target.value)}
        />
        <button className="btn btn-success mt-3" onClick={addCategory}>
          Add Category
        </button>
      </div>

      {/* Add SubCategory */}
      <div className="card p-3">
        <h5>Add SubCategory</h5>

        <select
          className="form-select mt-2"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          className="form-control mt-3"
          placeholder="Enter subcategory name"
          value={subName}
          onChange={(e) => setSubName(e.target.value)}
        />

        <button className="btn btn-primary mt-3" onClick={addSubCategory}>
          Add SubCategory
        </button>
      </div>
    </div>
  );
};

export default ManageCategories;