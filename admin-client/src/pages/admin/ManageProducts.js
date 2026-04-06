import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../../api";
import catalog from "../../data/catalog";

// ✅ Use env backend (Vite) else fallback
const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const getImg = (img) => {
  if (!img) return "";
  const s = String(img);

  if (s.startsWith("http")) return s;
  if (s.startsWith("/uploads")) return BACKEND + s;

  // windows path / linux path fallback
  const fileName = s.split("\\").pop().split("/").pop();
  return `${BACKEND}/uploads/${fileName}`;
};

const getUnitLabel = (p) => {
  if (p?.qtyLabel && String(p.qtyLabel).trim()) return p.qtyLabel;
  if (p?.qty && p?.unit) return `${p.qty} ${p.unit}`;
  return "";
};

const normalizeProducts = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const StatusBadge = ({ status }) => {
  const s = String(status || "pending").toLowerCase();

  const style =
    s === "approved"
      ? { bg: "rgba(25,135,84,.12)", c: "#198754", b: "rgba(25,135,84,.25)", t: "APPROVED" }
      : s === "rejected"
      ? { bg: "rgba(220,53,69,.12)", c: "#dc3545", b: "rgba(220,53,69,.25)", t: "REJECTED" }
      : { bg: "rgba(255,193,7,.18)", c: "#8a6d00", b: "rgba(255,193,7,.35)", t: "PENDING" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        fontWeight: 900,
        fontSize: 11,
        padding: "6px 10px",
        background: style.bg,
        color: style.c,
        border: `1px solid ${style.b}`,
        letterSpacing: 0.6,
      }}
    >
      {style.t}
    </span>
  );
};

const SegTab = ({ active, label, count, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="btn btn-sm"
    style={{
      borderRadius: 12,
      padding: "10px 12px",
      fontWeight: 900,
      border: active ? "1px solid #198754" : "1px solid #dee2e6",
      background: active ? "#198754" : "#fff",
      color: active ? "#fff" : "#212529",
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      whiteSpace: "nowrap",
      boxShadow: active ? "0 10px 22px rgba(25,135,84,.22)" : "none",
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

const EmptyState = ({ onRefresh, onGoPending }) => (
  <div className="text-center py-5">
    <div style={{ fontSize: 42, opacity: 0.75 }}>🛒</div>
    <div className="fw-bold mt-2" style={{ fontSize: 18 }}>
      No products found
    </div>
    <div className="text-muted" style={{ fontSize: 13 }}>
      Switch tabs or refresh to fetch latest products.
    </div>
    <div className="d-flex justify-content-center gap-2 mt-3 flex-wrap">
      <button className="btn btn-outline-dark btn-sm" onClick={onRefresh}>
        ↻ Refresh
      </button>
      <button className="btn btn-success btn-sm px-4" onClick={onGoPending}>
        View Pending
      </button>
    </div>
  </div>
);

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const titleOfCat = useCallback((slug) => catalog?.[slug]?.title || slug || "-", []);

  const load = async () => {
    try {
      setMsg("");
      setLoading(true);
      const res = await api.get("/api/products/all");
      const list = normalizeProducts(res.data);
      setProducts(list);
    } catch (e) {
      const status = e?.response?.status;
      const backendMsg = e?.response?.data?.msg || e?.response?.data?.message;
      setMsg(
        backendMsg ||
          (status === 401 ? "Not authorized (token missing/invalid)" : "Failed to load products")
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ✅ status normalized
  const statusOf = (p) => String(p?.status || "pending").toLowerCase();

  const pending = useMemo(() => products.filter((p) => statusOf(p) === "pending"), [products]);
  const approved = useMemo(() => products.filter((p) => statusOf(p) === "approved"), [products]);
  const rejected = useMemo(() => products.filter((p) => statusOf(p) === "rejected"), [products]);

  const tabData = useMemo(() => {
    if (activeTab === "approved") return approved;
    if (activeTab === "rejected") return rejected;
    return pending;
  }, [activeTab, pending, approved, rejected]);

  // ✅ keep as-is (no search)
  const filtered = useMemo(() => tabData, [tabData]);

  useEffect(() => setPage(1), [activeTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const showingFrom = filtered.length ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const showingTo = filtered.length ? Math.min(filtered.length, safePage * PAGE_SIZE) : 0;

  const setStatus = async (id, status) => {
    try {
      setMsg("");
      await api.patch(`/api/products/${id}/status`, { status });
      setMsg(`✅ Product ${status}`);
      load();
    } catch (e) {
      setMsg(e?.response?.data?.msg || "Status update failed");
    }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      setMsg("");
      await api.delete(`/api/products/${id}`);
      setMsg("✅ Deleted");
      load();
    } catch (e) {
      setMsg(e?.response?.data?.msg || "Delete failed");
    }
  };

  const Actions = ({ p }) => {
    const tab = activeTab;

    return (
      <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
        {tab === "pending" ? (
          <>
            <button className="btn btn-sm btn-success" onClick={() => setStatus(p._id, "approved")}>
              Approve
            </button>
            <button className="btn btn-sm btn-outline-danger" onClick={() => setStatus(p._id, "rejected")}>
              Reject
            </button>
          </>
        ) : tab === "approved" ? (
          <button className="btn btn-sm btn-outline-danger" onClick={() => setStatus(p._id, "rejected")}>
            Reject
          </button>
        ) : (
          <button className="btn btn-sm btn-outline-success" onClick={() => setStatus(p._id, "approved")}>
            Approve
          </button>
        )}

        <div className="dropdown">
          <button className="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown" aria-expanded="false">
            ⋮
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <button className="dropdown-item" onClick={() => navigator.clipboard?.writeText?.(p._id)}>
                Copy ID
              </button>
            </li>
            <li>
              <button
                className="dropdown-item"
                onClick={() => navigator.clipboard?.writeText?.(p.vendorEmail || "")}
                disabled={!p.vendorEmail}
              >
                Copy Vendor Email
              </button>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item text-danger" onClick={() => del(p._id)}>
                Delete
              </button>
            </li>
          </ul>
        </div>
      </div>
    );
  };

  const Pager = () =>
    totalPages > 1 ? (
      <div className="d-flex justify-content-between align-items-center">
        <button
          className="btn btn-sm btn-outline-secondary"
          disabled={safePage <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          ← Prev
        </button>

        <div className="text-muted" style={{ fontSize: 13 }}>
          Page <b>{safePage}</b> / <b>{totalPages}</b>
        </div>

        <button
          className="btn btn-sm btn-outline-secondary"
          disabled={safePage >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next →
        </button>
      </div>
    ) : null;

  return (
    <div style={{ background: "linear-gradient(180deg,#f8fafc 0%,#eef2f7 100%)", minHeight: "100vh" }}>
      <div className="container py-3 py-md-4">
        {/* Hero */}
        <div className="mb-4">
          <div
            className="rounded-4 p-4 text-white"
            style={{
              background: "linear-gradient(90deg,#198754,#20c997)",
              boxShadow: "0 12px 28px rgba(25,135,84,.25)",
            }}
          >
            <div className="fw-bold" style={{ fontSize: 22 }}>
              Product Management
            </div>
            <div style={{ opacity: 0.92, fontSize: 14 }}>
              Review vendor submissions and manage your store catalog
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
          <div>
            <h3 className="fw-bold mb-1">Products</h3>
            <div className="text-muted" style={{ fontSize: 13 }}>
              Approve / Reject vendor listings and manage catalog
            </div>
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>

        {/* KPI */}
        <div className="row g-3 mb-3">
          {[
            { label: "Total Products", value: products.length },
            { label: "Pending", value: pending.length },
            { label: "Approved", value: approved.length },
            { label: "Rejected", value: rejected.length },
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

        {msg && (
          <div className="alert alert-info rounded-4" style={{ border: "1px solid rgba(0,0,0,.06)" }}>
            {msg}
          </div>
        )}

        {/* Controls */}
        <div className="rounded-4 p-3 mb-3 bg-white shadow-sm" style={{ border: "1px solid rgba(0,0,0,.06)" }}>
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
            <div className="d-flex gap-2 flex-wrap">
              <SegTab active={activeTab === "pending"} label="Pending" count={pending.length} onClick={() => setActiveTab("pending")} />
              <SegTab active={activeTab === "approved"} label="Approved" count={approved.length} onClick={() => setActiveTab("approved")} />
              <SegTab active={activeTab === "rejected"} label="Rejected" count={rejected.length} onClick={() => setActiveTab("rejected")} />
            </div>
          </div>

          <div className="text-muted mt-2" style={{ fontSize: 12 }}>
            Showing <b>{showingFrom}-{showingTo}</b> of <b>{filtered.length}</b>
          </div>
        </div>

        {/* MOBILE */}
        <div className="d-block d-md-none">
          {pageItems.length === 0 ? (
            <div className="rounded-4 bg-white shadow-sm" style={{ border: "1px solid rgba(0,0,0,.06)" }}>
              <EmptyState onRefresh={load} onGoPending={() => setActiveTab("pending")} />
            </div>
          ) : (
            <>
              <div className="d-flex flex-column gap-3">
                {pageItems.map((p) => {
                  const unitLabel = getUnitLabel(p);
                  return (
                    <div key={p._id} className="rounded-4 p-3 bg-white shadow-sm" style={{ border: "1px solid rgba(0,0,0,.06)" }}>
                      <div className="d-flex gap-3">
                        <img
                          src={getImg(p.image)}
                          alt={p.name}
                          style={{
                            width: 78,
                            height: 78,
                            objectFit: "cover",
                            borderRadius: 14,
                            border: "1px solid rgba(0,0,0,.06)",
                            flexShrink: 0,
                          }}
                          onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/78?text=No+Img")}
                        />

                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between gap-2">
                            <div className="fw-bold" style={{ lineHeight: 1.15 }}>
                              {p.name}
                            </div>
                            <StatusBadge status={p.status} />
                          </div>

                          <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                            {p.vendorShopName || "Vendor"} • {p.vendorEmail || "-"}
                          </div>

                          <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                            {titleOfCat(p.category)} / {p.subCategory || "-"}
                          </div>

                          <div className="fw-bold text-success mt-2">
                            ₹{p.price}{" "}
                            {unitLabel ? <span className="fw-normal text-muted">/ {unitLabel}</span> : null}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <Actions p={p} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-3 rounded-4 p-3 bg-white shadow-sm" style={{ border: "1px solid rgba(0,0,0,.06)" }}>
                  <Pager />
                </div>
              )}
            </>
          )}
        </div>

        {/* DESKTOP */}
        <div className="d-none d-md-block">
          {pageItems.length === 0 ? (
            <div className="rounded-4 bg-white shadow-sm" style={{ border: "1px solid rgba(0,0,0,.06)" }}>
              <EmptyState onRefresh={load} onGoPending={() => setActiveTab("pending")} />
            </div>
          ) : (
            <>
              <div
                className="d-flex justify-content-between align-items-center px-3 py-2 mb-2 rounded-4"
                style={{ background: "rgba(255,255,255,.75)", border: "1px solid rgba(0,0,0,.06)" }}
              >
                <div className="text-muted" style={{ fontSize: 12 }}>PRODUCT</div>
                <div className="text-muted" style={{ fontSize: 12 }}>VENDOR / CATEGORY</div>
                <div className="text-muted" style={{ fontSize: 12 }}>PRICE / STATUS / ACTION</div>
              </div>

              <div className="d-flex flex-column gap-2">
                {pageItems.map((p) => {
                  const unitLabel = getUnitLabel(p);
                  return (
                    <div
                      key={p._id}
                      className="rounded-4 p-3 bg-white shadow-sm"
                      style={{ border: "1px solid rgba(0,0,0,.06)", transition: "0.2s" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 14px 30px rgba(0,0,0,.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0px)";
                        e.currentTarget.style.boxShadow = "0 .125rem .25rem rgba(0,0,0,.075)";
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between gap-3">
                        <div className="d-flex align-items-center gap-3" style={{ minWidth: 380 }}>
                          <img
                            src={getImg(p.image)}
                            alt={p.name}
                            style={{
                              width: 64,
                              height: 64,
                              objectFit: "cover",
                              borderRadius: 14,
                              border: "1px solid rgba(0,0,0,.06)",
                            }}
                            onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/64?text=No+Img")}
                          />
                          <div>
                            <div className="fw-bold" style={{ fontSize: 15, lineHeight: 1.2 }}>
                              {p.name}
                            </div>
                            <div className="text-muted" style={{ fontSize: 12 }}>
                              ID: {String(p._id).slice(0, 10)}… {unitLabel ? `• ${unitLabel}` : ""}
                            </div>
                          </div>
                        </div>

                        <div style={{ minWidth: 360 }}>
                          <div className="fw-semibold" style={{ fontSize: 13 }}>
                            {p.vendorShopName || "Vendor"}
                          </div>
                          <div className="text-muted" style={{ fontSize: 12 }}>
                            {p.vendorEmail || "-"}
                          </div>
                          <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                            {titleOfCat(p.category)} / {p.subCategory || "-"}
                          </div>
                        </div>

                        <div className="text-end" style={{ minWidth: 320 }}>
                          <div className="fw-bold text-success" style={{ fontSize: 16 }}>
                            ₹{p.price}{" "}
                            {unitLabel ? (
                              <span className="fw-normal text-muted" style={{ fontSize: 12 }}>
                                / {unitLabel}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-2">
                            <StatusBadge status={p.status} />
                          </div>

                          <div className="mt-2 d-flex justify-content-end">
                            <Actions p={p} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-3 rounded-4 p-3 bg-white shadow-sm" style={{ border: "1px solid rgba(0,0,0,.06)" }}>
                  <Pager />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageProducts;
