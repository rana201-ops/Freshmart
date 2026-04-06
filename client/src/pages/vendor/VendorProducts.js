import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api";

const normalize = (v) => String(v || "").trim().toLowerCase();

// ✅ System Units by Category (no allowedUnits in admin)
const getUnitsByCategory = (categorySlug) => {
  const c = normalize(categorySlug);

  if (c === "fresh-fruits" || c === "green-vegetables") return ["kg", "g"];
  if (c === "organic-dairy") return ["l", "ml"];
  if (c === "healthy-staples") return ["kg", "g", "pack"];

  return ["kg"];
};

const VendorProducts = () => {
  const { user } = useContext(AuthContext);

  const [all, setAll] = useState([]);
  const [msg, setMsg] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");

  const [master, setMaster] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(false);

  // ✅ allowed units: category based
  const [allowedUnits, setAllowedUnits] = useState(["kg"]);

  const [openForm, setOpenForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [form, setForm] = useState({
    category: "",
    subCategory: "",
    productMasterId: "",
    price: "",
    unit: "kg",
    qty: 1,
  });

  const BACKEND = process.env.REACT_APP_API_URL;
  const getImg = (img) => {
    if (!img) return "";
    if (String(img).startsWith("http")) return img;
    if (String(img).startsWith("/uploads")) return BACKEND + img;
    const fileName = String(img).split("\\").pop().split("/").pop();
    return `${BACKEND}/uploads/${fileName}`;
  };

  const loadMine = async () => {
    try {
      setMsg("");
      const res = await api.get("/api/products/mine");
      setAll(res.data || []);
    } catch {
      setMsg("Failed to load products");
    }
  };

  const loadMaster = async () => {
    try {
      setLoadingMaster(true);
      const res = await api.get("/api/product-master");
      setMaster(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.log(e);
      setMaster([]);
      setMsg("Product Master not loaded. Check /api/product-master");
    } finally {
      setLoadingMaster(false);
    }
  };

  useEffect(() => {
    loadMine();
    loadMaster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPickImage = (file) => {
    setImageFile(file);
    if (!file) return setPreview("");
    setPreview(URL.createObjectURL(file));
  };

  // ✅ derived dropdown options
  const categories = useMemo(() => {
    const s = new Set();
    master.forEach((m) => m?.category && s.add(m.category));
    return Array.from(s).sort();
  }, [master]);

  const subCategories = useMemo(() => {
    const s = new Set();
    master
      .filter((m) => (form.category ? m.category === form.category : true))
      .forEach((m) => m?.subCategory && s.add(m.subCategory));
    return Array.from(s).sort();
  }, [master, form.category]);

  const productsForDropdown = useMemo(() => {
    return master
      .filter((m) => (form.category ? m.category === form.category : true))
      .filter((m) => (form.subCategory ? m.subCategory === form.subCategory : true))
      .sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")));
  }, [master, form.category, form.subCategory]);

  // ✅ category change -> reset everything + set units category-wise
  const onChangeCategory = (cat) => {
    const units = getUnitsByCategory(cat);
    setAllowedUnits(units);

    setForm((p) => ({
      ...p,
      category: cat,
      subCategory: "",
      productMasterId: "",
      unit: units[0] || "kg",
      qty: 1,
    }));
  };

  // ✅ subCategory change -> reset master selection (units remain same)
  const onChangeSubCategory = (sub) => {
    setForm((p) => ({
      ...p,
      subCategory: sub,
      productMasterId: "",
      unit: allowedUnits[0] || "kg",
      qty: 1,
    }));
  };

  // ✅ product select -> apply default qty/unit but only if allowed
  const onChangeProductMaster = (id) => {
    const selected = master.find((m) => String(m._id) === String(id));

    if (!selected) {
      setForm((p) => ({ ...p, productMasterId: "" }));
      return;
    }

    const units = getUnitsByCategory(selected.category);
    setAllowedUnits(units);

    const defaultUnit = selected.defaultUnit || units[0] || "kg";
    const finalUnit = units.includes(defaultUnit) ? defaultUnit : units[0] || "kg";

    setForm((p) => ({
      ...p,
      productMasterId: selected._id,
      category: selected.category || p.category,
      subCategory: selected.subCategory || p.subCategory,
      unit: finalUnit,
      qty: selected.defaultQty || 1,
    }));
  };

  const onlyDigits = (v) => String(v || "").replace(/[^\d]/g, "");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    const priceNum = Number(form.price);
    const qtyNum = Number(form.qty);

    if (!form.productMasterId) return setMsg("Select Product Name (from dropdown)");
    if (!priceNum || priceNum <= 0) return setMsg("Enter valid price");
    if (!qtyNum || qtyNum <= 0) return setMsg("Enter valid pack qty");
    if (!form.unit) return setMsg("Select unit");
    if (!imageFile) return setMsg("Please upload image");

    if (allowedUnits.length && !allowedUnits.includes(form.unit)) {
      return setMsg(`Invalid unit. Allowed: ${allowedUnits.join(", ")}`);
    }

    try {
      setSubmitting(true);

      const fd = new FormData();
      fd.append("productMasterId", form.productMasterId);
      fd.append("price", String(priceNum));
      fd.append("unit", form.unit);
      fd.append("qty", String(qtyNum));
      fd.append("image", imageFile);

      await api.post("/api/products", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMsg("✅ Product added (pending approval)");
      setImageFile(null);
      setPreview("");

      setForm((p) => ({
        ...p,
        productMasterId: "",
        price: "",
        qty: 1,
      }));

      await loadMine();
      setOpenForm(false);
    } catch (err) {
      console.log(err);
      setMsg(err?.response?.data?.msg || "Add failed");
    } finally {
      setSubmitting(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm("Delete product?")) return;
    try {
      await api.delete(`/api/products/${id}`);
      setMsg("✅ Deleted");
      loadMine();
    } catch (err) {
      setMsg(err?.response?.data?.msg || "Delete failed");
    }
  };

  const badgeClass = (st) =>
    st === "approved" ? "bg-success" : st === "rejected" ? "bg-danger" : "bg-warning text-dark";

  const getUnitLabel = (p) => {
    if (p.qtyLabel && String(p.qtyLabel).trim()) return p.qtyLabel;
    if (p.qty && p.unit) return `${p.qty} ${p.unit}`;
    return "";
  };

  // ✅ filters
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return all.filter((p) => {
      const st = String(p.status || "pending").toLowerCase();

      if (statusFilter !== "all") {
        if (statusFilter === "pending") {
          if (st === "approved" || st === "rejected") return false;
        } else {
          if (st !== statusFilter) return false;
        }
      }

      if (!q) return true;

      const hay = [p.name, p.category, p.subCategory, p.vendorShopName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [all, search, statusFilter]);

  // ✅ total pages for pagination
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  }, [filtered.length]);

  // ✅ reset page on search/status change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  // ✅ clamp page (delete / filter changes)
  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const showingText = useMemo(() => {
    const total = filtered.length;
    if (total === 0) return "Showing 0 items";
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, total);
    return `Showing ${start}-${end} of ${total}`;
  }, [filtered.length, page]);

  // ✅ counts chips
  const counts = useMemo(() => {
    const c = { all: all.length, approved: 0, rejected: 0, pending: 0 };
    all.forEach((p) => {
      const st = String(p.status || "pending").toLowerCase();
      if (st === "approved") c.approved += 1;
      else if (st === "rejected") c.rejected += 1;
      else c.pending += 1;
    });
    return c;
  }, [all]);

  const canSubmit = useMemo(() => {
    const priceNum = Number(form.price);
    const qtyNum = Number(form.qty);
    const unitOk = !allowedUnits.length || allowedUnits.includes(form.unit);

    return (
      !!form.productMasterId &&
      priceNum > 0 &&
      qtyNum > 0 &&
      !!form.unit &&
      unitOk &&
      !!imageFile &&
      !submitting
    );
  }, [form.productMasterId, form.price, form.qty, form.unit, imageFile, submitting, allowedUnits]);

  return (
    <div className="container py-4">
      <style>{`
        .fm-card { border: 1px solid rgba(0,0,0,.06); box-shadow: 0 10px 22px rgba(0,0,0,.06); border-radius: 16px; background: #fff; }
        .fm-input:focus, .fm-select:focus { box-shadow: 0 0 0 0.15rem rgba(25,135,84,.15); border-color: rgba(25,135,84,.35); }
        .fm-row-hover:hover { background: #f8fbf9; }
        .fm-chip { border-radius: 999px; padding: 8px 12px; border: 1px solid rgba(0,0,0,.06); background: #fff; font-weight: 700; font-size: 12px; cursor: pointer; }
        .fm-chip.active { background: rgba(25,135,84,.12); border-color: rgba(25,135,84,.25); color: #198754; }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="fw-bold mb-0">Vendor Products</h3>
          <div className="text-muted" style={{ fontSize: 13 }}>
            Logged in as: <b>{user?.email}</b>
          </div>
        </div>

        <button
          className={`btn ${openForm ? "btn-outline-success" : "btn-success"}`}
          onClick={() => setOpenForm((p) => !p)}
          style={{ borderRadius: 12, fontWeight: 800 }}
        >
          {openForm ? "Close" : "+ Add Product"}
        </button>
      </div>

      {msg && <div className="alert alert-info">{msg}</div>}

      {/* ✅ Add Product form */}
      {openForm && (
        <div className="fm-card p-3 p-md-4 mb-4">
          <h5 className="fw-bold mb-2">Add Product</h5>

          <form onSubmit={submit} className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Category</label>
              <select
                className="form-select fm-select"
                value={form.category}
                onChange={(e) => onChangeCategory(e.target.value)}
                disabled={loadingMaster || submitting}
                style={{ borderRadius: 12 }}
              >
                <option value="">{loadingMaster ? "Loading..." : "Select category"}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Sub Category</label>
              <select
                className="form-select fm-select"
                value={form.subCategory}
                onChange={(e) => onChangeSubCategory(e.target.value)}
                disabled={!form.category || loadingMaster || submitting}
                style={{ borderRadius: 12 }}
              >
                <option value="">{!form.category ? "Select category first" : "Select sub-category"}</option>
                {subCategories.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">Product Name</label>
              <select
                className="form-select fm-select"
                value={form.productMasterId}
                onChange={(e) => onChangeProductMaster(e.target.value)}
                disabled={!form.category || !form.subCategory || loadingMaster || submitting}
                style={{ borderRadius: 12 }}
              >
                <option value="">
                  {!form.category || !form.subCategory
                    ? "Select category & sub-category first"
                    : "Select product"}
                </option>
                {productsForDropdown.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
              <small className="text-muted">Master products are managed by Admin.</small>
            </div>

            <div className="col-md-2">
              <label className="form-label">Price (₹)</label>
              <input
                inputMode="numeric"
                type="text"
                className="form-control fm-input"
                value={form.price}
                placeholder="e.g. 60"
                onChange={(e) => setForm({ ...form, price: onlyDigits(e.target.value) })}
                disabled={submitting}
                style={{ borderRadius: 12 }}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">Pack Qty</label>
              <input
                inputMode="numeric"
                type="text"
                className="form-control fm-input"
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: onlyDigits(e.target.value) || 1 })}
                disabled={submitting || !form.productMasterId}
                style={{ borderRadius: 12 }}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">Unit</label>
              <select
                className="form-select fm-select"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                disabled={submitting || !form.productMasterId}
                style={{ borderRadius: 12 }}
              >
                {allowedUnits.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">Image (Upload)</label>
              <input
                type="file"
                className="form-control fm-input"
                accept="image/*"
                onChange={(e) => onPickImage(e.target.files?.[0] || null)}
                disabled={submitting}
                style={{ borderRadius: 12 }}
              />
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  style={{
                    width: 70,
                    height: 70,
                    objectFit: "cover",
                    borderRadius: 12,
                    marginTop: 8,
                    border: "1px solid rgba(0,0,0,.06)",
                  }}
                />
              ) : null}
            </div>

            <div className="col-12 d-flex justify-content-end">
              <button
                className="btn btn-success"
                type="submit"
                disabled={!canSubmit}
                style={{
                  borderRadius: 12,
                  fontWeight: 800,
                  height: 44,
                  padding: "0 18px",
                  width: "100%",
                  maxWidth: 240,
                }}
              >
                {submitting ? "Adding..." : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ✅ My Products */}
      <div className="fm-card p-3 p-md-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="fw-bold mb-0">My Products</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={loadMine} style={{ borderRadius: 10 }}>
            Refresh
          </button>
        </div>

        {/* ✅ chips */}
        <div className="d-flex gap-2 flex-wrap mb-3">
          <button className={`fm-chip ${statusFilter === "all" ? "active" : ""}`} onClick={() => setStatusFilter("all")}>
            All ({counts.all})
          </button>
          <button className={`fm-chip ${statusFilter === "approved" ? "active" : ""}`} onClick={() => setStatusFilter("approved")}>
            Approved ({counts.approved})
          </button>
          <button className={`fm-chip ${statusFilter === "pending" ? "active" : ""}`} onClick={() => setStatusFilter("pending")}>
            Pending ({counts.pending})
          </button>
          <button className={`fm-chip ${statusFilter === "rejected" ? "active" : ""}`} onClick={() => setStatusFilter("rejected")}>
            Rejected ({counts.rejected})
          </button>
        </div>

        {/* ✅ search + showing */}
        <div className="row g-2 align-items-center mb-3">
          <div className="col-12 col-md-7">
            <input
              className="form-control fm-input"
              placeholder="Search products (name/category/sub-category)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ borderRadius: 12 }}
            />
          </div>
          <div className="col-12 col-md-5 d-flex justify-content-between justify-content-md-end align-items-center gap-2">
            <span className="text-muted" style={{ fontSize: 12 }}>{showingText}</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-muted mb-0">No products found.</p>
        ) : (
          <>
            {/* ✅ Mobile cards */}
            <div className="d-md-none">
              <div className="d-flex flex-column gap-3">
                {paged.map((p) => {
                  const unitLabel = getUnitLabel(p);
                  return (
                    <div
                      key={p._id}
                      className="rounded-4 p-3"
                      style={{
                        border: "1px solid rgba(0,0,0,.06)",
                        boxShadow: "0 10px 22px rgba(0,0,0,.05)",
                      }}
                    >
                      <div className="d-flex gap-3">
                        <img
                          src={getImg(p.image)}
                          alt={p.name}
                          style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover" }}
                          onError={(e) => {
                            e.currentTarget.src = "https://via.placeholder.com/64?text=No+Img";
                          }}
                        />
                        <div className="flex-grow-1">
                          <div className="fw-semibold">{p.name}</div>
                          <div className="text-muted" style={{ fontSize: 12 }}>
                            {p.category} / {p.subCategory}
                          </div>
                          <div className="mt-1 fw-bold text-success">
                            ₹{p.price}{" "}
                            {unitLabel ? <span className="fw-normal text-muted">/ {unitLabel}</span> : null}
                          </div>

                          <div className="d-flex justify-content-between align-items-center mt-2">
                            <span className={`badge ${badgeClass(p.status)}`} style={{ borderRadius: 999 }}>
                              {p.status || "pending"}
                            </span>

                            <button
                              className="btn btn-sm btn-outline-danger"
                              style={{ borderRadius: 10 }}
                              onClick={() => del(p._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ✅ Desktop table */}
            <div className="d-none d-md-block">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {paged.map((p) => {
                    const unitLabel = getUnitLabel(p);
                    return (
                      <tr key={p._id} className="fm-row-hover">
                        <td className="d-flex gap-2 align-items-center">
                          <img
                            src={getImg(p.image)}
                            alt={p.name}
                            style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 10 }}
                            onError={(e) => {
                              e.currentTarget.src = "https://via.placeholder.com/44?text=No+Img";
                            }}
                          />
                          <div>
                            <div className="fw-semibold">{p.name}</div>
                            <small className="text-muted">{p.vendorShopName}</small>
                            {unitLabel ? <div className="text-muted" style={{ fontSize: "12px" }}>{unitLabel}</div> : null}
                          </div>
                        </td>

                        <td>{p.category} / {p.subCategory}</td>

                        <td className="fw-bold text-success">
                          ₹{p.price}{" "}
                          {unitLabel ? <span className="fw-normal text-muted">/ {unitLabel}</span> : null}
                        </td>

                        <td>
                          <span className={`badge ${badgeClass(p.status)}`} style={{ borderRadius: 999 }}>
                            {p.status || "pending"}
                          </span>
                        </td>

                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-danger" style={{ borderRadius: 10 }} onClick={() => del(p._id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ✅ Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ borderRadius: 10 }}
              >
                ← Prev
              </button>

              <div className="text-muted" style={{ fontSize: 13 }}>
                Page <b>{page}</b> / <b>{totalPages}</b>
              </div>

              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ borderRadius: 10 }}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VendorProducts;
