import { useEffect, useMemo, useState } from "react";
import api from "../../api";

// ---------- shared UI helpers (same style as vendors) ----------
const pretty = (s) =>
  String(s || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const Pill = ({ cls, children }) => (
  <span
    className={`badge ${cls}`}
    style={{
      display: "inline-flex",
      alignItems: "center",
      borderRadius: 999,
      fontWeight: 900,
      fontSize: 11,
      padding: "6px 10px",
      letterSpacing: 0.6,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
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

const EmptyCard = ({ icon = "🧾", title, subtitle, onRefresh }) => (
  <div className="rounded-4 bg-white shadow-sm p-5 text-center" style={{ border: "1px solid rgba(0,0,0,.06)" }}>
    <div style={{ fontSize: 42, opacity: 0.75 }}>{icon}</div>
    <div className="fw-bold mt-2" style={{ fontSize: 18 }}>{title}</div>
    <div className="text-muted" style={{ fontSize: 13 }}>{subtitle}</div>
    <button className="btn btn-outline-dark btn-sm mt-3" onClick={onRefresh}>
      ↻ Refresh
    </button>
  </div>
);

const kpiCardStyle = {
  border: "1px solid #e9ecef",
  transition: "0.2s",
};

const OrderStatusPill = ({ status }) => {
  const s = (status || "placed").toLowerCase();

  if (s === "pending_payment") return <Pill cls="bg-warning text-dark">PAYMENT PENDING</Pill>;
  if (s.includes("delivered")) return <Pill cls="bg-success">DELIVERED</Pill>;
  if (s === "cancelled") return <Pill cls="bg-danger">CANCELLED</Pill>;
  if (s.includes("partial")) return <Pill cls="bg-warning text-dark">{s.toUpperCase()}</Pill>;
  if (s.includes("shipped")) return <Pill cls="bg-primary">SHIPPED</Pill>;
  if (s === "processing") return <Pill cls="bg-info text-dark">PROCESSING</Pill>;
  if (s === "placed") return <Pill cls="bg-dark">PLACED</Pill>;

  return <Pill cls="bg-secondary">{s.toUpperCase()}</Pill>;
};

const PaymentPill = ({ payment }) => {
  const pm = (payment?.method || "cod").toLowerCase();
  const ps = (payment?.status || "pending").toLowerCase();

  const methodCls = pm === "online" ? "bg-info text-dark" : "bg-secondary";
  let statusCls = "bg-warning text-dark";
  if (ps === "paid") statusCls = "bg-success";
  if (ps === "failed") statusCls = "bg-danger";
  if (ps === "refunded") statusCls = "bg-primary";

  return (
    <div className="d-flex gap-2 flex-wrap">
      <Pill cls={methodCls}>{pm.toUpperCase()}</Pill>
      <Pill cls={statusCls}>PAYMENT: {pretty(ps)}</Pill>
    </div>
  );
};

// ---------- component ----------
const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [tab, setTab] = useState("active"); // active | pending_payment | delivered | cancelled | all
  const [q, setQ] = useState("");

  const [open, setOpen] = useState({});
  const toggle = (id) => setOpen((p) => ({ ...p, [id]: !p[id] }));

  const load = async () => {
    try {
      setMsg("");
      setLoading(true);
      const res = await api.get("/api/orders/all");
      setOrders(res.data || []);
    } catch (e) {
      setOrders([]);
      setMsg(e?.response?.data?.msg || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };
  const handleCompleteReturn = async (orderId, vendorEmail) => {
  if (!window.confirm("Complete return and refund this order?")) return;

  try {
    await api.patch(`/api/orders/${orderId}/return/complete`, {
  vendorEmail,
});
    load();
  } catch (e) {
    setMsg(e?.response?.data?.msg || "Return completion failed");
  }
};

  useEffect(() => {
    load();
    
  }, []);

  const stats = useMemo(() => {
    const list = orders || [];
    const st = (o) => (o.overallStatus || "placed").toLowerCase();

    const pending_payment = list.filter((o) => st(o) === "pending_payment").length;
    const delivered = list.filter((o) => st(o).includes("delivered")).length;
    const cancelled = list.filter((o) => st(o) === "cancelled").length;
    const processing = list.filter((o) => st(o) === "processing").length;

    const shipped = list.filter((o) => st(o) === "shipped" || st(o) === "partially_shipped").length;
    const placed = list.filter((o) => st(o) === "placed").length;

    const active = list.length - (delivered + cancelled);

    return { total: list.length, pending_payment, active, placed, processing, shipped, delivered, cancelled };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = q.trim().toLowerCase();
    const st = (o) => (o.overallStatus || "placed").toLowerCase();

    return (orders || [])
      .filter((o) => {
        if (tab === "all") return true;
        if (tab === "active") return st(o) !== "cancelled" && !st(o).includes("delivered");
        if (tab === "delivered") return st(o).includes("delivered");
        if (tab === "cancelled") return st(o) === "cancelled";
        if (tab === "pending_payment") return st(o) === "pending_payment";
        return true;
      })
      .filter((o) => {
        if (!query) return true;
        const hay = [
          o._id,
          o.userEmail,
          o.name,
          o.phone,
          o.address,
          o.overallStatus,
          o?.payment?.method,
          o?.payment?.status,
          ...(o.subOrders || []).map((s) => s.vendorEmail),
          ...(o.subOrders || []).map((s) => s.vendorShopName),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [orders, tab, q]);

  const OrderCard = ({ o }) => {
    const expanded = !!open[o._id];
    const idShort = String(o._id).slice(-8);
    const date = o.createdAt ? new Date(o.createdAt).toLocaleString() : "-";

    return (
      <div
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
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div style={{ minWidth: 320 }}>
            <div className="fw-bold" style={{ fontSize: 15 }}>
              Order <span className="text-muted">#{idShort}</span>
            </div>
            <div className="text-muted" style={{ fontSize: 13 }}>
              {o.userEmail || "-"} {(o.name || o.phone) ? <span> • {[o.name, o.phone].filter(Boolean).join(" • ")}</span> : null}
            </div>
            <div className="text-muted" style={{ fontSize: 12 }}>Placed: {date}</div>

            <div className="mt-2 d-flex gap-2 flex-wrap">
              <PaymentPill payment={o.payment} />
              <OrderStatusPill status={o.overallStatus} />
            </div>

            {o.address ? (
              <div className="mt-2 text-muted" style={{ fontSize: 12 }}>
                📍 {o.address}
              </div>
            ) : null}
          </div>

          <div className="text-end ms-auto" style={{ minWidth: 280 }}>
            <div className="fw-bold text-success" style={{ fontSize: 28 }}>
              ₹{Number(o.finalTotal || 0)}
            </div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              Subtotal ₹{Number(o.total || 0)} • Discount ₹{Number(o.discount || 0)}
            </div>

            <div className="mt-2 d-flex justify-content-end gap-2 flex-wrap">
              <button
                className="btn btn-sm btn-outline-dark"
                onClick={() => navigator.clipboard?.writeText(o._id)}
              >
                Copy ID
              </button>

              <button
                className={`btn btn-sm ${expanded ? "btn-outline-secondary" : "btn-outline-primary"}`}
                onClick={() => toggle(o._id)}
              >
                {expanded ? "Hide details ▲" : "View details ▼"}
              </button>
            </div>
          </div>
        </div>

        {expanded ? (
          <div className="mt-3">
            <hr />
            {(o.subOrders || []).map((s, idx) => (
              <div
                key={`${o._id}-sub-${idx}`}
                className="rounded-4 p-3 mb-2"
                style={{ border: "1px solid rgba(0,0,0,.08)", background: "#fff" }}
              >
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                  <div>
                    <div className="fw-bold" style={{ fontSize: 14 }}>
                      {s.vendorShopName || "Vendor"}
                    </div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{s.vendorEmail || "-"}</div>
                  </div>

                  <div className="text-end">
                    <Pill cls="bg-light text-dark border">Vendor: {pretty(s.status)}</Pill>
                    {s?.return?.status && s.return.status !== "none" ? (
  <div className="mt-2 d-flex gap-2 align-items-center flex-wrap">
    <Pill cls="bg-warning text-dark">
      RETURN: {pretty(s.return.status)}
    </Pill>

    {s.return.status === "approved" ? (
      <button
        className="btn btn-sm btn-success"
        onClick={() => handleCompleteReturn(o._id, s.vendorEmail)}
      >
        Complete Return + Refund
      </button>
    ) : null}
  </div>
) : null}
                    <div className="fw-bold text-success mt-2">₹{Number(s.vendorTotal || 0)}</div>
                  </div>
                </div>

                <div className="table-responsive mt-3">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Item</th>
                        <th className="text-center" style={{ width: 120 }}>Qty</th>
                        <th className="text-end" style={{ width: 160 }}>Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(s.items || []).map((it, i2) => (
                        <tr key={`${o._id}-${idx}-${i2}`}>
                          <td>
                            <div className="fw-semibold">{it.name}</div>
                            <div className="text-muted small">₹{Number(it.price || 0)} each</div>
                          </td>
                          <td className="text-center">{Number(it.qty || 0)}</td>
                          <td className="text-end fw-semibold">
                            ₹{Number(it.price || 0) * Number(it.qty || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

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
            <div className="fw-bold" style={{ fontSize: 22 }}>Manage Orders</div>
            <div style={{ opacity: 0.92, fontSize: 14 }}>Admin can track payment + delivery status clearly</div>
          </div>
        </div>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
          <div>
            <h3 className="fw-bold mb-1">Manage Orders</h3>
            <div className="text-muted" style={{ fontSize: 13 }}>
              Payment + overall status + vendor sub-orders
            </div>
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>

        {msg ? (
          <div className="alert alert-info rounded-4" style={{ border: "1px solid rgba(0,0,0,.06)" }}>
            {msg}
          </div>
        ) : null}

        {/* KPI */}
        <div className="row g-3 mb-3">
          {[
            { label: "Payment Pending", value: stats.pending_payment },
            { label: "Active", value: stats.active },
            { label: "Placed", value: stats.placed },
            { label: "Processing", value: stats.processing },
            { label: "Shipped", value: stats.shipped },
            { label: "Delivered", value: stats.delivered },
          ].map((c) => (
            <div className="col-6 col-lg-2" key={c.label}>
              <div
                className="p-3 rounded-4 bg-white shadow-sm"
                style={kpiCardStyle}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
              >
                <div className="text-muted" style={{ fontSize: 12 }}>{c.label}</div>
                <div className="fw-bold" style={{ fontSize: 28 }}>{c.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="rounded-4 p-3 mb-3 bg-white shadow-sm" style={{ border: "1px solid rgba(0,0,0,.06)" }}>
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
            <div className="d-flex gap-2 flex-wrap">
              <SegTab active={tab === "active"} label="Active" count={stats.active} onClick={() => setTab("active")} />
              <SegTab active={tab === "pending_payment"} label="Payment Pending" count={stats.pending_payment} onClick={() => setTab("pending_payment")} />
              <SegTab active={tab === "delivered"} label="Delivered" count={stats.delivered} onClick={() => setTab("delivered")} />
              <SegTab active={tab === "cancelled"} label="Cancelled" count={stats.cancelled} onClick={() => setTab("cancelled")} />
              <SegTab active={tab === "all"} label="All" count={stats.total} onClick={() => setTab("all")} />
            </div>

            <div className="d-flex gap-2 align-items-center flex-wrap">
              <input
                className="form-control form-control-sm"
                placeholder="Search order id, email, vendor..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ minWidth: 260, borderRadius: 12 }}
              />
              <div className="text-muted" style={{ fontSize: 12 }}>
                Showing <b>{filteredOrders.length}</b>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        {filteredOrders.length === 0 ? (
          <EmptyCard
            icon="🧾"
            title="No orders found"
            subtitle="Try changing tabs/search or refresh."
            onRefresh={load}
          />
        ) : (
          <div className="d-flex flex-column gap-2">
            {filteredOrders.map((o) => (
              <OrderCard key={o._id} o={o} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageOrders;
