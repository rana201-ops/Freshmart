import { useEffect, useMemo, useState } from "react";
import api from "../../api";

// ---- small UI helpers (same vibe as ManageOffers) ----
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

const EmptyCard = ({ title, subtitle, onRefresh }) => (
  <div
    className="rounded-4 bg-white shadow-sm p-5 text-center"
    style={{ border: "1px solid rgba(0,0,0,.06)" }}
  >
    <div style={{ fontSize: 42, opacity: 0.75 }}>📬</div>
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

const kpiCardStyle = { border: "1px solid #e9ecef", transition: "0.2s" };

const AdminSubscribers = () => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all"); // all | active | inactive
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
  try {
    setLoading(true);
    setError("");

    const res = await api.get("/api/admin/subscribers");
    setSubs(res.data || []);
  } catch (err) {
    console.error(err);
    setSubs([]);
    setError("Failed to load subscribers");
  } finally {
    setLoading(false);
  }
};

  // ✅ UPDATED: auto refresh on focus + interval
  useEffect(() => {
    load();

    const onFocus = () => load();
    window.addEventListener("focus", onFocus);

   const id = setInterval(load, 30000);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(id);
    };
  }, []);

  const stats = useMemo(() => {
    const total = subs.length;
    const active = subs.filter((s) => s.isActive === true).length;
    const inactive = total - active;
    const latest = subs
      .slice()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
    return { total, active, inactive, latest };
  }, [subs]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (subs || [])
      .filter((s) => {
        if (tab === "active") return s.isActive === true;
        if (tab === "inactive") return s.isActive === false;
        return true;
      })
      .filter((s) => {
        if (!query) return true;
        return String(s.email || "").toLowerCase().includes(query);
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [subs, tab, q]);

  const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    console.log("Copied:", text);
  } catch {
    console.log("Copy failed");
  }
};
  const exportCSV = () => {
    const header = ["Email", "Status", "SubscribedAt"];
    const rows = filtered.map((s) => [
      s.email || "",
      s.isActive === true ? "Active" : "Inactive",
      s.createdAt ? new Date(s.createdAt).toISOString() : "",
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        background: "linear-gradient(180deg,#f8fafc 0%,#eef2f7 100%)",
        minHeight: "100vh",
      }}
    >
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
              Newsletter Subscribers
            </div>
            <div style={{ opacity: 0.92, fontSize: 14 }}>
              View & manage your subscriber list
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
          {error && (
  <div className="alert alert-danger mb-3">
    {error}
  </div>
)}
          <div>
            <h3 className="fw-bold mb-1">Subscribers</h3>
            <div className="text-muted" style={{ fontSize: 13 }}>
              Search, filter and export subscribers
            </div>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={load}
              disabled={loading}
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
            <button
              className="btn btn-sm btn-dark"
              onClick={exportCSV}
              disabled={loading || filtered.length === 0}
              style={{ fontWeight: 900, borderRadius: 12 }}
              title="Export filtered subscribers"
            >
              ⤓ Export CSV
            </button>
          </div>
        </div>

        {/* KPI */}
        <div className="row g-3 mb-3">
          {[
            { label: "Total", value: stats.total },
            { label: "Active", value: stats.active },
            { label: "Inactive", value: stats.inactive },
            { label: "Latest", value: stats.latest?.email ? "1 new" : "-" },
          ].map((c) => (
            <div className="col-6 col-lg-3" key={c.label}>
              <div
                className="p-3 rounded-4 bg-white shadow-sm"
                style={kpiCardStyle}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-2px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0px)")
                }
              >
                <div className="text-muted" style={{ fontSize: 12 }}>
                  {c.label}
                </div>
                <div className="fw-bold" style={{ fontSize: 24 }}>
                  {c.value}
                </div>
                {c.label === "Latest" && stats.latest?.email ? (
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {stats.latest.email}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div
          className="rounded-4 p-3 mb-3 bg-white shadow-sm"
          style={{ border: "1px solid rgba(0,0,0,.06)" }}
        >
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
            <div className="d-flex gap-2 flex-wrap">
              <SegTab
                active={tab === "all"}
                label="All"
                count={stats.total}
                onClick={() => setTab("all")}
              />
              <SegTab
                active={tab === "active"}
                label="Active"
                count={stats.active}
                onClick={() => setTab("active")}
              />
              <SegTab
                active={tab === "inactive"}
                label="Inactive"
                count={stats.inactive}
                onClick={() => setTab("inactive")}
              />
            </div>

            <div className="d-flex gap-2 align-items-center flex-wrap">
              <input
                className="form-control form-control-sm"
                placeholder="Search email..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ minWidth: 240, borderRadius: 12 }}
              />
              <div className="text-muted" style={{ fontSize: 12 }}>
                Showing <b>{filtered.length}</b>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="rounded-4 bg-white shadow-sm p-4">Loading...</div>
        ) : filtered.length === 0 ? (
          <EmptyCard
            title="No subscribers found"
            subtitle="Try changing filter/search or refresh."
            onRefresh={load}
          />
        ) : (
          <div
            className="rounded-4 bg-white shadow-sm p-2 p-md-3"
            style={{ border: "1px solid rgba(0,0,0,.06)" }}
          >
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 60 }}>#</th>
                    <th>Email</th>
                    <th style={{ width: 130 }}>Status</th>
                    <th style={{ width: 120 }}>Amount</th>   
                    <th style={{ width: 120 }}>Payment</th>  
                    <th style={{ width: 220 }}>Subscribed At</th>
                    <th style={{ width: 120 }} className="text-end">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, index) => (
                    <tr key={s._id}>
                      <td className="text-muted">{index + 1}</td>
                      <td style={{ fontWeight: 700 }}>{s.email}</td>
                      <td>
                        {s.isActive === true ? (
                          <span
                            className="badge bg-success"
                            style={{
                              borderRadius: 999,
                              fontWeight: 900,
                              padding: "6px 10px",
                            }}
                          >
                            Active
                          </span>
                        ) : (
                          <span
                            className="badge bg-secondary"
                            style={{
                              borderRadius: 999,
                              fontWeight: 900,
                              padding: "6px 10px",
                            }}
                          >
                            Inactive
                          </span>
                        )}
                      </td>
                      <td>₹{s.amountPaid || 49}</td>

<td>
  {s.paymentStatus === "paid" ? (
    <span className="badge bg-success">Paid</span>
  ) : (
    <span className="badge bg-secondary">Pending</span>
  )}
</td>
                      <td className="text-muted">
                        {s.createdAt ? new Date(s.createdAt).toLocaleString() : "-"}
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          style={{ borderRadius: 12, fontWeight: 900 }}
                          onClick={() => copy(s.email)}
                          title="Copy email"
                        >
                          Copy
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

export default AdminSubscribers;
