import { useEffect, useMemo, useState } from "react";
import api from "../../api";

const UNITS = ["kg", "g", "ml", "l", "piece", "dozen", "bunch", "pack"];

const formatName = (slug) =>
  (slug || "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// ✅ reject digits
const hasDigits = (s) => /\d/.test(String(s || ""));

// ✅ allow only letters + spaces + hyphen (optional strict)
const invalidChars = (s) => /[^a-zA-Z\s-]/.test(String(s || ""));

const EmptyCard = ({ icon = "🧾", title, subtitle, onRefresh }) => (
  <div
    className="rounded-4 bg-white shadow-sm p-5 text-center"
    style={{ border: "1px solid rgba(0,0,0,.06)" }}
  >
    <div style={{ fontSize: 42, opacity: 0.75 }}>{icon}</div>
    <div className="fw-bold mt-2" style={{ fontSize: 18 }}>
      {title}
    </div>
    <div className="text-muted" style={{ fontSize: 13 }}>
      {subtitle}
    </div>
    <button className="btn btn-outline-dark btn-sm mt-3" onClick={onRefresh}>
      ↻ Refresh
    </button>
  </div>
);

const SegTab = ({ active, label, count, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="btn btn-sm"
    style={{
      borderRadius: 12,
      padding: "10px 12px",
      fontWeight: 900,
      border: active ? "1px solid #0d6efd" : "1px solid #dee2e6",
      background: active ? "#0d6efd" : "#fff",
      color: active ? "#fff" : "#212529",
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      whiteSpace: "nowrap",
      boxShadow: active ? "0 10px 22px rgba(13,110,253,.18)" : "none",
      transition: "0.2s",
    }}
  >
    {label}
    <span
      style={{
        background: active ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.05)",
        color: active ? "#fff" : "#212529",
        borderRadius: 999,
        padding: "2px 8px",
        fontSize: 12,
        fontWeight: 900,
      }}
    >
      {count}
    </span>
  </button>
);

const ProductNames = () => {
  const [cats, setCats] = useState([]);
  const [list, setList] = useState([]);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [subs, setSubs] = useState([]);
  const [filter, setFilter] = useState({ category: "", subCategory: "" });

  const [form, setForm] = useState({
    name: "",
    defaultQty: 1,
    defaultUnit: "kg",
  });

  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all"); // all | recent (optional)
  const [loading, setLoading] = useState(false);
  

  // ✅ load categories
 useEffect(() => {
  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/categories");
      const data = res.data || [];
      setCats(data);

      if (data.length) {
        setFilter((p) => ({
          ...p,
          category: data[0].slug,
        }));
      }
    } catch {
      setCats([]);
    } finally {
      setLoading(false);
    }
  };

  loadCategories();
}, []);
useEffect(() => {
  const loadSubCategories = async () => {
    if (!filter.category) return;

    try {
      const res = await api.get(
        `/api/subCategories?categorySlug=${filter.category}`
      );

      const data = res.data || [];
      setSubs(data);

      if (data.length) {
        setFilter((p) => ({
          ...p,
          subCategory: data[0].slug,
        }));
      } else {
        setFilter((p) => ({
          ...p,
          subCategory: "",
        }));
      }
    } catch {
      setSubs([]);
    }
  };

  loadSubCategories();
}, [filter.category]);

  const subOptions = subs;
  const load = async () => {
    if (!filter.category || !filter.subCategory) return;
    try {
      setErr("");
      setMsg("");
      setLoading(true);
      const res = await api.get("/api/product-master", { params: filter });
      setList(res.data || []);
    } catch (e) {
      setList([]);
      setErr(e?.response?.data?.msg || "Failed to load product names");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [filter.category, filter.subCategory]);

  // ✅ live validation while typing
  const nameError = useMemo(() => {
    const v = form.name.trim();
    if (!v) return "";
    if (hasDigits(v)) return "❌ Digits (0-9) are not allowed in product name.";
    if (invalidChars(v)) return "❌ Only letters, spaces and hyphen (-) are allowed.";
    if (v.length < 2) return "❌ Name is too short.";
    return "";
  }, [form.name]);

  const add = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");

    const name = form.name.trim();

    if (!name) return setErr("Enter product name");

    // ✅ digit block (ALERT + message)
    if (hasDigits(name)) {
      alert("Digits (0-9) are not allowed in product name.");
      return setErr("Digits (0-9) are not allowed in product name.");
    }

    // ✅ optional strict char block
    if (invalidChars(name)) {
      alert("Only letters, spaces and hyphen (-) are allowed.");
      return setErr("Only letters, spaces and hyphen (-) are allowed.");
    }

    try {
      setLoading(true);
      await api.post("/api/product-master", {
        name,
        category: filter.category,
        subCategory: filter.subCategory,
        defaultQty: Number(form.defaultQty) || 1,
        defaultUnit: form.defaultUnit,
      });

      setForm((p) => ({ ...p, name: "" }));
      setMsg("✅ Added");
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.msg || "Add failed");
    } finally {
      setLoading(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this product name?")) return;
    try {
      setErr("");
      setMsg("");
      setLoading(true);
      await api.delete(`/api/product-master/${id}`);
      setMsg("✅ Deleted");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = list.length;
    const withPack = list.filter((x) => Number(x.defaultQty || 0) > 0 && x.defaultUnit).length;
    return { total, withPack };
  }, [list]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = [...(list || [])].sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    let arr = base;
    if (tab === "recent") {
      // if backend gives createdAt; else it will behave like all
      arr = base.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    if (!query) return arr;
    return arr.filter((x) => String(x.name || "").toLowerCase().includes(query));
  }, [list, q, tab]);

  return (
    <div style={{ background: "linear-gradient(180deg,#f8fafc 0%,#eef2f7 100%)", minHeight: "100vh" }}>
      <div className="container py-3 py-md-4">
        {/* Hero */}
        <div className="mb-4">
          <div
            className="rounded-4 p-4 text-white"
            style={{
              background: "linear-gradient(90deg,#0d6efd,#20c997)",
              boxShadow: "0 12px 28px rgba(13,110,253,.18)",
            }}
          >
            <div className="fw-bold" style={{ fontSize: 22 }}>
              Product Names
            </div>
            <div style={{ opacity: 0.92, fontSize: 14 }}>
              Maintain master product names with default pack (qty + unit)
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
          <div>
            <h3 className="fw-bold mb-1">Product Names (Admin)</h3>
            <div className="text-muted" style={{ fontSize: 13 }}>
              Category → SubCategory → Add/Delete product names
            </div>
          </div>

          <button className="btn btn-sm btn-outline-secondary" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>

        {msg ? <div className="alert alert-success rounded-4">{msg}</div> : null}
        {err ? <div className="alert alert-danger rounded-4">{err}</div> : null}
        {loading ? <div className="alert alert-info rounded-4">Loading...</div> : null}

        {/* KPI */}
        <div className="row g-3 mb-3">
          {[
            { label: "Total Names", value: stats.total },
            { label: "With Default Pack", value: stats.withPack },
          ].map((c) => (
            <div className="col-6 col-lg-3" key={c.label}>
              <div
                className="p-3 rounded-4 bg-white shadow-sm"
                style={{ border: "1px solid #e9ecef", transition: "0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
              >
                <div className="text-muted" style={{ fontSize: 12 }}>
                  {c.label}
                </div>
                <div className="fw-bold" style={{ fontSize: 28 }}>
                  {c.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="rounded-4 p-3 mb-3 bg-white shadow-sm" style={{ border: "1px solid rgba(0,0,0,.06)" }}>
          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <label className="form-label mb-1">Category</label>
              <select
                className="form-select"
                value={filter.category}
                onChange={(e) => setFilter((p) => ({ ...p, category: e.target.value }))}
              >
                {cats.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label mb-1">Sub Category</label>
              <select
                className="form-select"
                value={filter.subCategory}
                onChange={(e) => setFilter((p) => ({ ...p, subCategory: e.target.value }))}
              >
               {subOptions.map((s) => (
  <option key={s._id} value={s.slug}>
    {s.name}
  </option>
))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label mb-1">Search</label>
              <input
                className="form-control"
                placeholder="Search product name..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ borderRadius: 12 }}
              />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
            <div className="d-flex gap-2 flex-wrap">
              <SegTab active={tab === "all"} label="All" count={filtered.length} onClick={() => setTab("all")} />
              <SegTab active={tab === "recent"} label="Recent" count={filtered.length} onClick={() => setTab("recent")} />
            </div>

            <div className="text-muted" style={{ fontSize: 12 }}>
              Showing <b>{filtered.length}</b>
            </div>
          </div>
        </div>

        {/* Add Form */}
        <div className="card shadow-sm border-0 mb-3" style={{ borderRadius: 16 }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="fw-bold mb-0">Add Product Name</h5>
              <span className="badge bg-dark" style={{ borderRadius: 999 }}>
                {filter.category || "-"} • {formatName(filter.subCategory || "-")}
              </span>
            </div>

            <form className="row g-2 mt-2" onSubmit={add}>
              <div className="col-md-6">
                <label className="form-label mb-1">Product Name (no digits)</label>
                <input
                  className={`form-control ${nameError ? "is-invalid" : form.name.trim() ? "is-valid" : ""}`}
                  placeholder="e.g., Orange"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
                {nameError ? <div className="invalid-feedback d-block">{nameError}</div> : null}
              </div>

              <div className="col-md-2">
                <label className="form-label mb-1">Default Qty</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.defaultQty}
                  min="1"
                  onChange={(e) => setForm((p) => ({ ...p, defaultQty: e.target.value }))}
                />
              </div>

              <div className="col-md-2">
                <label className="form-label mb-1">Unit</label>
                <select
                  className="form-select"
                  value={form.defaultUnit}
                  onChange={(e) => setForm((p) => ({ ...p, defaultUnit: e.target.value }))}
                >
                  {UNITS.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-2 d-flex align-items-end">
                <button className="btn btn-success w-100" disabled={loading || !!nameError} style={{ borderRadius: 12, fontWeight: 900 }}>
                  Add
                </button>
              </div>
            </form>

          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyCard
            icon="🧾"
            title="No product names found"
            subtitle="Try changing category/subcategory or add a new one."
            onRefresh={load}
          />
        ) : (
          <div className="rounded-4 bg-white shadow-sm p-3" style={{ border: "1px solid rgba(0,0,0,.06)" }}>
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th style={{ width: 200 }}>Default Pack</th>
                    <th style={{ width: 120 }} className="text-end">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((x) => (
                    <tr key={x._id}>
                      <td className="fw-semibold">{x.name}</td>
                      <td className="text-muted">
                        {x.defaultQty} {x.defaultUnit}
                      </td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-danger" onClick={() => del(x._id)} style={{ borderRadius: 12, fontWeight: 900 }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductNames;
