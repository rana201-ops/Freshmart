import { useEffect, useMemo, useState } from "react";
import api from "../../api";

const PAGE_SIZE = 6;

const statusMeta = (st) => {
  const s = String(st || "placed").toLowerCase();
  if (s === "placed") return { cls: "bg-primary", label: "PLACED" };
  if (s === "accepted") return { cls: "bg-info text-dark", label: "ACCEPTED" };
  if (s === "packed") return { cls: "bg-warning text-dark", label: "PACKED" };
  if (s === "shipped") return { cls: "bg-secondary", label: "SHIPPED" };
  if (s === "delivered") return { cls: "bg-success", label: "DELIVERED" };
  if (s === "rejected") return { cls: "bg-danger", label: "REJECTED" };
  if (s === "cancelled") return { cls: "bg-dark", label: "CANCELLED" };
  return { cls: "bg-secondary", label: s.toUpperCase() };
};

const money = (n) => `₹${Number(n || 0).toFixed(0)}`;

const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [msg, setMsg] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | pending_pay | placed | accepted...
  const [page, setPage] = useState(1);

  const load = async () => {
    try {
      setMsg("");
      const res = await api.get("/api/orders/vendor");
      setOrders(res.data || []);
    } catch (e) {
      setMsg(e?.response?.data?.msg || "Failed to load vendor orders");
    }
  };

  const updateStatus = async (orderId, status, currentStatus) => {
    if ((currentStatus || "placed") === status) return;
    

    try {
      setMsg("");
      await api.patch(`/api/orders/${orderId}/suborder/status`, { status });
      setMsg("✅ Status updated");
      load();
    } catch (e) {
      setMsg(e?.response?.data?.msg || "Status update failed");
    }
  };
  const handleReturnAction = async (orderId, action) => {
  try {
    await api.patch(`/api/orders/${orderId}/return/vendor`, { action });
    load();
  } catch (e) {
    setMsg(e?.response?.data?.msg || "Return action failed");
  }
};

  useEffect(() => {
    load();
  }, []);

  // ✅ shipped -> delivered ONLY
  const nextOptions = (current) => {
    const s = (current || "placed").toLowerCase();
    if (s === "rejected" || s === "cancelled" || s === "delivered") return [];

    const map = {
      placed: ["accepted", "rejected", "cancelled"],
      accepted: ["packed", "cancelled"],
      packed: ["shipped", "cancelled"],
      shipped: ["delivered"],
    };

    return map[s] || [];
  };

  const counts = useMemo(() => {
    const c = {
      all: orders.length,
      pending_pay: 0,
      placed: 0,
      accepted: 0,
      packed: 0,
      shipped: 0,
      delivered: 0,
      rejected: 0,
      cancelled: 0,
    };

    orders.forEach((o) => {
      const so = o.subOrders?.[0];
      const st = String(so?.status || "placed").toLowerCase();
       const pm = (o.payment?.method || "cod").toLowerCase();
       const ps = (o.payment?.status || "pending").toLowerCase();
      if (pm === "online" && ps !== "paid") c.pending_pay += 1;
      if (c[st] != null) c[st] += 1;
    });

    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((o) => {
      const so = o.subOrders?.[0];
const st = String(so?.status || "placed").toLowerCase();
      if (filter === "pending_pay") {
        const pm = (o.payment?.method || "cod").toLowerCase();
        const ps = (o.payment?.status || "pending").toLowerCase();
        if (!(pm === "online" && ps !== "paid")) return false;
      } else if (filter !== "all" && st !== filter) {
        return false;
      }

      if (!q) return true;

      const hay = [
        o._id,
        o.userEmail,
        o.name,
        o.phone,
        o.address,
        ...(so?.items || []).map((it) => it?.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [orders, search, filter]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    [filtered.length]
  );

  useEffect(() => setPage(1), [search, filter]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const showingText = useMemo(() => {
    const total = filtered.length;
    if (total === 0) return "Showing 0 orders";
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, total);
    return `Showing ${start}-${end} of ${total}`;
  }, [filtered.length, page]);

  const Chip = ({ value, label }) => (
    <button
      type="button"
      onClick={() => setFilter(value)}
      className={`btn btn-sm ${filter === value ? "btn-success" : "btn-outline-success"}`}
      style={{
        borderRadius: 999,
        fontWeight: 800,
        height: 34,
        padding: "0 14px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        whiteSpace: "nowrap",
        lineHeight: 1,
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="container py-4">
      <style>{`
        .fm-order-card{
          border: 1px solid rgba(0,0,0,.06);
          box-shadow: 0 10px 22px rgba(0,0,0,.06);
          border-radius: 16px;
          background: #fff;
        }
        .fm-order-line{ height:1px; background: rgba(0,0,0,.06); margin: 14px 0; }
      `}</style>

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 mb-3">
        <div>
          <h3 className="fw-bold mb-1">Vendor Orders</h3>
          <div className="text-muted" style={{ fontSize: 13 }}>
            Track and update order statuses
          </div>
        </div>

        <div className="d-flex gap-2 align-items-center flex-wrap">
          <span className="text-muted" style={{ fontSize: 12 }}>
            {showingText}
          </span>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={load}
            style={{ borderRadius: 10 }}
          >
            Refresh
          </button>
        </div>
      </div>

      {msg && <div className="alert alert-info rounded-4">{msg}</div>}

      <div className="fm-order-card p-3 mb-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6">
            <input
              className="form-control"
              placeholder="Search (order id, customer, address, product...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ borderRadius: 12 }}
            />
          </div>

          <div
            className="col-12 col-md-6 d-flex flex-wrap justify-content-md-end align-items-center gap-2"
            style={{ rowGap: 10 }}
          >
            <Chip value="all" label={`All (${counts.all})`} />
            <Chip value="pending_pay" label={`Pending Pay (${counts.pending_pay})`} />
            <Chip value="placed" label={`Placed (${counts.placed})`} />
            <Chip value="accepted" label={`Accepted (${counts.accepted})`} />
            <Chip value="packed" label={`Packed (${counts.packed})`} />
            <Chip value="shipped" label={`Shipped (${counts.shipped})`} />
            <Chip value="delivered" label={`Delivered (${counts.delivered})`} />
            <Chip value="rejected" label={`Rejected (${counts.rejected})`} />
            <Chip value="cancelled" label={`Cancelled (${counts.cancelled})`} />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="alert alert-info rounded-4">No orders found for your products yet.</div>
      ) : (
        <>
          {paged.map((o) => {
            const so = o.subOrders?.[0];
            const currentStatus = String(so?.status || "placed").toLowerCase();
            const allowedNext = nextOptions(currentStatus);
            const badge = statusMeta(currentStatus);

            const pm = (o.payment?.method || "cod").toLowerCase();
const ps = (o.payment?.status || "pending").toLowerCase();
            const isPayLocked = pm === "online" && ps !== "paid";

            const isTerminal = allowedNext.length === 0;

            const ost = String(o?.overallStatus || "").toLowerCase();
            const isOrderLocked = ["cancelled", "return_requested", "returned"].includes(ost);

            // ✅ vendor-wise return lock (from backend: o.returns = sub.return)
            const rStatus = String(so?.return?.status || "none").toLowerCase();
            const isReturnLocked = ["requested", "approved"].includes(rStatus);
            return (
              <div key={o._id} className="fm-order-card p-3 p-md-4 mb-3">
                <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                  <div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <div className="fw-bold">Order ID:</div>
                      <div className="text-break">{o._id}</div>
                      <span className={`badge ${badge.cls}`} style={{ borderRadius: 999 }}>
                        {badge.label}
                      </span>

                      <span
                        className={`badge ${pm === "online" ? "bg-info text-dark" : "bg-secondary"}`}
                        style={{ borderRadius: 999 }}
                      >
                        {pm.toUpperCase()}
                      </span>

                      <span
                        className={`badge ${
                          ps === "paid"
                            ? "bg-success"
                            : ps === "failed"
                            ? "bg-danger"
                            : "bg-warning text-dark"
                        }`}
                        style={{ borderRadius: 999 }}
                      >
                        {ps.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-2" style={{ fontSize: 13 }}>
                      <div className="text-muted">
                        <b>Customer:</b> {o.userEmail || "N/A"}
                      </div>
                      <div className="text-muted mt-1 text-break">
                        <b>Delivery:</b> {o.name} | {o.phone} | {o.address}
                      </div>

                      {isPayLocked ? (
                        <div className="mt-2 small text-danger">
                          Online payment pending/failed. You cannot process this order until payment is PAID.
                        </div>
                      ) : null}

                      {ost === "cancelled" ? (
                        <div className="mt-2 small text-danger">
                          ❌ Customer cancelled order. Reason: <b>{o?.cancel?.reason || "—"}</b>
                        </div>
                      ) : null}

                      {/* ✅ vendor-wise return info */}
                      {rStatus !== "none" ? (
                        <div className="mt-2 small text-warning">
                          {rStatus === "requested" && (
  <div className="mt-2 d-flex gap-2">
    <button
      className="btn btn-sm btn-success"
      onClick={() => handleReturnAction(o._id, "approve")}
    >
      Approve
    </button>

    <button
      className="btn btn-sm btn-danger"
      onClick={() => handleReturnAction(o._id, "reject")}
    >
      Reject
    </button>
  </div>
)}
                          ⚠️ Return: <b>{rStatus.toUpperCase()}</b> • Reason:{" "}
                          <b>{so?.return?.reason || "—"}</b>
                        </div>
                      ) : null}

                      {ost === "returned" ? (
                        <div className="mt-2 small text-success">✅ Returned completed.</div>
                      ) : null}
                    </div>
                  </div>

                  <div style={{ minWidth: 260 }}>
                    <div className="fw-bold text-success" style={{ fontSize: 15 }}>
                      Vendor Total: {money(so?.vendorTotal || 0)}
                    </div>

                    <div className="mt-2">
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        Update Status
                      </div>

                      <select
                        className="form-select form-select-sm mt-1"
                        value={currentStatus}
                        disabled={isTerminal || isPayLocked || isOrderLocked || isReturnLocked}
                        onChange={(e) => updateStatus(o._id, e.target.value, currentStatus)}
                        style={{ width: "100%", borderRadius: 12 }}
                      >
                        <option value={currentStatus}>{currentStatus}</option>
                        {allowedNext.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>

                      <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                        {isPayLocked
                          ? "Waiting for payment..."
                          : isOrderLocked || isReturnLocked
                          ? "Order cancelled/return flow (cannot change)"
                          : isTerminal
                          ? "Final status (cannot change)"
                          : "placed → accepted → packed → shipped → delivered"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="fm-order-line" />

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="fw-bold">Items</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {so?.items?.length || 0} item(s)
                  </div>
                </div>

                <div className="d-flex flex-column gap-2">
                  {(so?.items || []).map((it, idx) => {
                    const lineTotal = (it.price || 0) * (it.qty || 0);
                    return (
                      <div
                        key={`${o._id}-${idx}`}
                        className="d-flex justify-content-between"
                        style={{ fontSize: 14 }}
                      >
                        <div className="text-break">
                          {it.name}{" "}
                          <span className="text-muted" style={{ fontSize: 12 }}>
                            × {it.qty}
                          </span>
                        </div>
                        <div className="fw-semibold">{money(lineTotal)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

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
  );
};

export default VendorOrders;