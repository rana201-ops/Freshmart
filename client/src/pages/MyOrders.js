import { useEffect, useMemo, useState } from "react";
import api from "../api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

//  delivery-only steps
const steps = ["placed", "accepted", "packed", "shipped", "delivered"];

const statusBadge = (st, payment) => {
  const s = (st || "placed").toLowerCase();
  const pm = (payment?.method || "cod").toLowerCase();
  const ps = (payment?.status || "pending").toLowerCase();

  // ✅ ONLY online unpaid => warning
  if (pm === "online" && ps !== "paid") return "bg-warning text-dark";

  if (s === "delivered") return "bg-success";
  if (s === "cancelled" || s === "rejected") return "bg-danger";
  if (s.includes("partial")) return "bg-warning text-dark";
  if (s === "shipped") return "bg-primary";
  if (s === "processing" || s === "accepted" || s === "packed") return "bg-info text-dark";
  return "bg-dark";
};

const stepIndex = (st) => {
  let s = (st || "placed").toLowerCase();

  //  normalize common variations
  if (s === "out-for-delivery") s = "shipped";
  if (s === "in_transit") s = "shipped";

  const idx = steps.indexOf(s);
  return idx === -1 ? 0 : idx; // unknown => placed
};

const ProgressBar = ({ status, payment }) => {
  const s = (status || "placed").toLowerCase();
  const pm = (payment?.method || "cod").toLowerCase();
  const ps = (payment?.status || "pending").toLowerCase();

  if (s === "cancelled" || s === "rejected") {
    return (
      <div className="mt-2">
        <span className="badge bg-danger text-uppercase">{s}</span>
      </div>
    );
  }

  // ONLINE unpaid => show message 
  if (pm === "online" && ps !== "paid") {
    return (
      <div className="mt-2">
        <span className="badge bg-warning text-dark text-uppercase">payment pending</span>
        <div className="small text-muted mt-1">
          Online payment pending/failed hai. Payment successful hote hi vendor order process karega.
        </div>
      </div>
    );
  }

  const idx = stepIndex(status);
  const percent = Math.round(((idx + 1) / steps.length) * 100);

  return (
    <div className="mt-2">
      <div className="progress" style={{ height: 8 }}>
        <div className="progress-bar" role="progressbar" style={{ width: `${percent}%` }} />
      </div>

      <div className="d-flex justify-content-between small text-muted mt-1">
        {steps.map((x) => (
          <span
            key={x}
            className={x === s ? "fw-semibold text-dark" : ""}
            style={{ textTransform: "capitalize" }}
          >
            {x}
          </span>
        ))}
      </div>
    </div>
  );
};

//  review helpers
const getKey = (orderId, itemIndex) => `${orderId}-${itemIndex}`;

const resolveProductId = (item) => {
  return item?.productId || item?.product?._id || item?.product || item?._id || null;
};

const money = (v) => Number(v || 0);

const calcVendorTotal = (subOrder) => {
  const given = money(subOrder?.vendorTotal);
  if (given > 0) return given;
  const items = subOrder?.items || [];
  return items.reduce((sum, it) => sum + money(it.price) * money(it.qty), 0);
};

const calcOrderSubtotal = (order) => {
  const given = money(order?.total);
  if (given > 0) return given;
  const subs = order?.subOrders || [];
  return subs.reduce((sum, s) => sum + calcVendorTotal(s), 0);
};

const calcOrderFinal = (order) => {
  const finalGiven = money(order?.finalTotal);
  if (finalGiven > 0) return finalGiven;
  const subtotal = calcOrderSubtotal(order);
  const discount = money(order?.discount);
  return Math.max(0, subtotal - discount);
};

const calcOrderDiscount = (order) => {
  const d = money(order?.discount);
  if (d > 0) return d;

  const subtotal = calcOrderSubtotal(order);
  const finalTotal = money(order?.finalTotal);
  if (finalTotal > 0 && subtotal > 0) return Math.max(0, subtotal - finalTotal);
  return 0;
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [msg, setMsg] = useState("");

  const [tab, setTab] = useState("active");
  const [q, setQ] = useState("");

  const [selectedId, setSelectedId] = useState("");

  const [reviewForm, setReviewForm] = useState({});
  const [submittingKey, setSubmittingKey] = useState("");
  const [processingId, setProcessingId] = useState("");
const [toast, setToast] = useState(null);
const showToast = (type, text) => {
  setToast({ type, text });
  setTimeout(() => setToast(null), 3000);
};
const [cancelModal, setCancelModal] = useState({
  open: false,
  orderId: "",
  reason: ""
});

const [returnModal, setReturnModal] = useState({
  open: false,
  orderId: "",
  vendorEmail: "",
  reason: ""
});

  //  hide online-unpaid orders toggle
  const [hidePendingPayment, setHidePendingPayment] = useState(false);

  const load = async () => {
    try {
      setMsg("");
      const res = await api.get("/api/orders/my");
      const list = res.data || [];
      setOrders(list);

      if (!selectedId && list[0]?._id) setSelectedId(list[0]._id);
      if (selectedId && !list.find((o) => o._id === selectedId)) {
        setSelectedId(list[0]?._id || "");
      }
    } catch (e) {
      setMsg(e?.response?.data?.msg || "Failed to load orders");
      setOrders([]);
      setSelectedId("");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return (orders || [])
      .filter((o) => {
        const pm = (o.payment?.method || "cod").toLowerCase();
        const ps = (o.payment?.status || "pending").toLowerCase();
        const isOnlineUnpaid = pm === "online" && ps !== "paid";

        if (hidePendingPayment && isOnlineUnpaid) return false;

       const st = (o.overallStatus || "placed").toLowerCase();

if (tab === "delivered") {
  return st === "delivered";
}

if (tab === "active") {
  return [
    "placed",
    "processing",
    "shipped",
    "return_requested",
    "pending_payment"
  ].includes(st);
}

return true;
      })
      .filter((o) => {
        if (!query) return true;
        const id = String(o._id || "").toLowerCase();
        const vendors = (o.subOrders || [])
          .map((s) => `${s.vendorShopName || ""}`.toLowerCase())
          .join(" ");
        const itemsText = (o.subOrders || [])
          .flatMap((s) => (s.items || []).map((it) => it.name || ""))
          .join(" ")
          .toLowerCase();

        return id.includes(query) || vendors.includes(query) || itemsText.includes(query);
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, tab, q, hidePendingPayment]);

  const selected = useMemo(() => {
    return filtered.find((o) => o._id === selectedId) || filtered[0] || null;
  }, [filtered, selectedId]);

  const setRating = (key, val) => {
    setReviewForm((prev) => ({
      ...prev,
      [key]: { rating: val, comment: prev[key]?.comment || "" },
    }));
  };

  const setComment = (key, val) => {
    setReviewForm((prev) => ({
      ...prev,
      [key]: { rating: prev[key]?.rating || 5, comment: val },
    }));
  };

  const submitReview = async (order, item, key) => {
    const rating = Number(reviewForm[key]?.rating || 5);
    const comment = String(reviewForm[key]?.comment || "").trim();

    if (!comment) return alert("Please write your review");

    const productId = resolveProductId(item);
    if (!productId) return alert("❌ productId missing in order item. Check order schema.");

    try {
      setSubmittingKey(key);

      await api.post("/api/reviews", {
        orderId: order._id,
        productId,
        rating,
        comment,
      });

      alert(" Review submitted");
      await load();

      setReviewForm((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    } catch (e) {
      alert(e?.response?.data?.msg || "Review failed");
    } finally {
      setSubmittingKey("");
    }
  };

  // cancel order
 const confirmCancel = async () => {
  try {
    setProcessingId(cancelModal.orderId);

    await api.patch(`/api/orders/${cancelModal.orderId}/cancel`, {
      reason: cancelModal.reason
    });

    showToast("success", "Order cancelled successfully 💸");

    setCancelModal({ open: false, orderId: "", reason: "" });
    load();
  } catch (e) {
    showToast("error", e?.response?.data?.msg || "Cancel failed");
  } finally {
    setProcessingId("");
  }
};
  //  vendor-wise return request
  const confirmReturn = async () => {
  try {
    const key = `${returnModal.orderId}-${returnModal.vendorEmail}`;
    setProcessingId(key);

    await api.patch(`/api/orders/${returnModal.orderId}/return`, {
      reason: returnModal.reason,
      vendorEmail: returnModal.vendorEmail
    });

    showToast("success", "Return requested successfully 📦");

    setReturnModal({ open: false, orderId: "", vendorEmail: "", reason: "" });
    load();
  } catch (e) {
    showToast("error", e?.response?.data?.msg || "Return failed");
  } finally {
    setProcessingId("");
  }
};
const downloadInvoice = (order) => {

  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text("FreshMart", 14, 20);

  doc.setFontSize(14);
  doc.text("Invoice", 14, 30);

  //  Order Info
  doc.setFontSize(11);
  doc.text(`Order ID: ${order._id}`, 14, 40);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`, 14, 47);

  // Customer Info
  doc.text(`Customer: ${order.name}`, 14, 60);
  doc.text(`Phone: ${order.phone}`, 14, 67);
  doc.text(`Address: ${order.address}`, 14, 74);

  //  Items Table
  const rows = [];

  (order.subOrders || []).forEach((s) => {
    (s.items || []).forEach((it) => {

      const price = Number(it.price || 0);
      const qty = Number(it.qty || 1);
      const total = price * qty;

      rows.push([
        it.name || "Item",
        qty,
        `Rs. ${price}`,
        `Rs. ${total}`
      ]);

    });
  });

  autoTable(doc, {
    startY: 90,
    head: [["Item", "Qty", "Price", "Total"]],
    body: rows,
    theme: "grid",
    headStyles: {
      fillColor: [34, 139, 34],
      textColor: 255
    }
  });

  const subtotal = calcOrderSubtotal(order);
  const discount = calcOrderDiscount(order);
  const finalTotal = calcOrderFinal(order);

  let y = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(11);

  doc.text(`Subtotal: Rs. ${subtotal}`, 140, y);
  y += 7;

  doc.text(`Discount: Rs. ${discount}`, 140, y);
  y += 7;

  doc.setFontSize(14);
  doc.text(`Total: Rs. ${finalTotal}`, 140, y);

  y += 12;

  doc.setFontSize(11);
  doc.text(`Payment Method: ${(order.payment?.method || "COD").toUpperCase()}`, 14, y);

  y += 10;

  doc.text("Thank you for shopping with FreshMart!", 14, y);

  doc.save(`invoice-${order._id}.pdf`);
};

  return (
    <div className="container py-4">
      {toast && (
  <div
    className={`position-fixed bottom-0 end-0 m-3 px-3 py-2 rounded text-white bg-${
      toast.type === "success" ? "success" : "danger"
    }`}
    style={{ zIndex: 9999 }}
  >
    {toast.text}
  </div>
)}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
        <div>
          <h3 className="fw-bold mb-0">My Orders</h3>
          <div className="text-muted">View past orders, track deliveries, and add reviews</div>
        </div>

        <div className="d-flex gap-2 align-items-center">
          <div className="form-check form-switch m-0">
            <input
              className="form-check-input"
              type="checkbox"
              id="hidePending"
              checked={hidePendingPayment}
              onChange={(e) => setHidePendingPayment(e.target.checked)}
            />
            <label className="form-check-label small text-muted" htmlFor="hidePending">
              Hide online unpaid
            </label>
          </div>

          <button className="btn btn-sm btn-outline-secondary" onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      {msg && <div className="alert alert-danger">{msg}</div>}

      {orders.length === 0 ? (
        <div className="alert alert-info">No orders yet.</div>
      ) : (
        <div className="row g-3">
          <div className="col-12 col-lg-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <input
                  className="form-control form-control-sm mb-2"
                  placeholder="Search order id / shop name..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />

                <div className="btn-group w-100 mb-3" role="group">
                  <button
                    className={`btn btn-sm ${tab === "all" ? "btn-success" : "btn-outline-success"}`}
                    onClick={() => setTab("all")}
                  >
                    All
                  </button>
                  <button
                    className={`btn btn-sm ${tab === "active" ? "btn-success" : "btn-outline-success"}`}
                    onClick={() => setTab("active")}
                  >
                    Active
                  </button>
                  <button
                    className={`btn btn-sm ${tab === "delivered" ? "btn-success" : "btn-outline-success"}`}
                    onClick={() => setTab("delivered")}
                  >
                    Delivered
                  </button>
                </div>

                <div className="list-group" style={{ maxHeight: "60vh", overflow: "auto" }}>
                  {filtered.map((o) => {
                    const active = selected?._id === o._id;
                    const shortId = String(o._id).slice(-6);
                    const date = new Date(o.createdAt).toLocaleString();

                    const subtotal = calcOrderSubtotal(o);
                    const discount = calcOrderDiscount(o);
                    const finalTotal = calcOrderFinal(o);

                    const vendorLabel = (o.subOrders || [])[0]?.vendorShopName || "Vendor";

                    return (
                      <button
                        key={o._id}
                        className={`list-group-item list-group-item-action ${active ? "active" : ""}`}
                        onClick={() => setSelectedId(o._id)}
                        style={{ textAlign: "left" }}
                      >
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div>
                            <div className="fw-semibold">
                              Order #{shortId}{" "}
                              <span className={`ms-2 badge ${active ? "bg-light text-dark" : "bg-success"}`}>
                                ₹{finalTotal}
                              </span>
                            </div>

                            <div className={`${active ? "" : "text-muted"}`} style={{ fontSize: 13 }}>
                              {vendorLabel} • {date}
                            </div>

                            <div className={`${active ? "" : "text-muted"}`} style={{ fontSize: 12 }}>
                              Subtotal ₹{subtotal} • Discount ₹{discount}
                            </div>
                          </div>

                          <span className={`badge ${active ? "bg-light text-dark" : statusBadge(o.overallStatus, o.payment)}`}>
                            {(o.overallStatus || "placed").toUpperCase()}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {!filtered.length && <div className="text-muted p-3">No matching orders.</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-8">
            {!selected ? (
              <div className="card shadow-sm">
                <div className="card-body text-muted">Select an order to view details.</div>
              </div>
            ) : (
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between flex-wrap gap-2">
                    <div>
                      <div className="fw-bold" style={{ fontSize: 18 }}>
                        Order #{String(selected._id).slice(-6)}
                      </div>
                      <div className="text-muted">{new Date(selected.createdAt).toLocaleString()}</div>

                      <div className="mt-2">
                        <span className={`badge ${statusBadge(selected.overallStatus, selected.payment)} text-uppercase`}>
                          {selected.overallStatus || "placed"}
                        </span>
                      </div>

                      <div className="small text-muted mt-2">
                        Payment: <span className="text-uppercase">{selected.payment?.method || "cod"}</span> •{" "}
                        <span className="text-uppercase">{selected.payment?.status || "pending"}</span>
                      </div>
<div className="d-flex gap-2 flex-wrap mt-3">

{selected.overallStatus !== "cancelled" && (
  <button
    className="btn btn-outline-primary btn-sm"
    onClick={() => downloadInvoice(selected)}
  >
    Download Invoice
  </button>
)}

{/* Cancel: only if allowed */}
{(() => {
  const st = String(selected.overallStatus || "").toLowerCase();

  const canCancel = ["placed", "accepted", "packed"].includes(st);

  return canCancel ? (
    <button
      className="btn btn-outline-danger btn-sm"
      disabled={processingId === selected._id}
      onClick={() =>
        setCancelModal({
          open: true,
          orderId: selected._id,
          reason: ""
        })
      }
    >
      {processingId === selected._id ? "Cancelling..." : "Cancel Order"}
    </button>
  ) : null;
})()}

</div>

                      {String(selected.overallStatus || "").toLowerCase() === "cancelled" && (
                        <div className="alert alert-danger rounded-4 mt-3 mb-0">
                          <b>Cancelled</b>
                          <br />
                          Reason: {selected?.cancel?.reason || "—"} <br />
                          At:{" "}
                          {selected?.cancel?.cancelledAt
                            ? new Date(selected.cancel.cancelledAt).toLocaleString()
                            : "—"}
                        </div>
                      )}
                    </div>

                    <div className="text-end ms-auto">
                      {(() => {
                        const subtotal = calcOrderSubtotal(selected);
                        const discount = calcOrderDiscount(selected);
                        const finalTotal = calcOrderFinal(selected);

                        return (
                          <>
                            <div className="fw-bold text-success fs-4">₹{finalTotal}</div>
                            <small className="text-muted">
                              Subtotal ₹{subtotal} • Discount ₹{discount}
                            </small>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <hr />

                  {(selected.subOrders || []).length === 0 ? (
                    <div className="alert alert-warning mb-0">Old order (no vendor blocks found).</div>
                  ) : (
                    <div className="accordion" id={`acc-${selected._id}`}>
                      {(selected.subOrders || []).map((s, idx) => {
                        const vendorStatus = (s.status || "placed").toLowerCase();
                        const allowReview = vendorStatus === "delivered";
                        const accId = `v-${selected._id}-${idx}`;
                        const vTotal = calcVendorTotal(s);

                        // ✅ vendor-wise return fields (safe defaults)
                        const rStatus = (s?.return?.status || "none").toLowerCase();
                        const canReturnVendor = vendorStatus === "delivered" && rStatus === "none";

                        return (
                          <div className="accordion-item" key={accId}>
                            <h2 className="accordion-header" id={`${accId}-h`}>
                              <button
                                className={`accordion-button ${idx === 0 ? "" : "collapsed"}`}
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target={`#${accId}-c`}
                                aria-expanded={idx === 0 ? "true" : "false"}
                                aria-controls={`${accId}-c`}
                              >
                                <div className="w-100 d-flex justify-content-between align-items-center gap-2">
                                  <div>
                                    <div className="fw-semibold">{s.vendorShopName || "Vendor"}</div>
                                    <div className="text-muted small">Verified seller</div>
                                  </div>

                                  <div className="text-end">
                                    <span className={`badge ${statusBadge(s.status, selected.payment)} text-uppercase`}>
                                      {s.status || "placed"}
                                    </span>
                                    <div className="fw-bold text-success mt-1">₹{vTotal}</div>
                                  </div>
                                </div>
                              </button>
                            </h2>

                            <div
                              id={`${accId}-c`}
                              className={`accordion-collapse collapse ${idx === 0 ? "show" : ""}`}
                              aria-labelledby={`${accId}-h`}
                              data-bs-parent={`#acc-${selected._id}`}
                            >
                              <div className="accordion-body">
                                {/*  return UI */}
                                <div className="d-flex gap-2 flex-wrap align-items-center">
                                  {canReturnVendor && (
                                    <button
  className="btn btn-outline-warning btn-sm"
  disabled={processingId === `${selected._id}-${s.vendorEmail}`}
  onClick={() =>
 setReturnModal({
  open:false,
  orderId:"",
  vendorEmail:"",
  reason:""
 })
}
>
  {processingId === `${selected._id}-${s.vendorEmail}`
    ? "Requesting..."
    : "Return (this vendor)"}
</button>
                                  )}

                                  {rStatus !== "none" && (
                                    <span className={`badge ${rStatus === "completed" ? "bg-success" : "bg-warning text-dark"}`}>
                                      RETURN: {rStatus.toUpperCase()}
                                    </span>
                                  )}
                                </div>

                                {rStatus !== "none" && (
                                  <div className="small text-muted mt-1">
                                    Reason: <b>{s?.return?.reason || "—"}</b>
                                    {s?.return?.requestedAt ? (
                                      <> • Requested: {new Date(s.return.requestedAt).toLocaleString()}</>
                                    ) : null}
                                  </div>
                                )}

                                {vendorStatus === "delivered" ? (
                                  <div className="mt-2">
                                    <span className="badge bg-success">Delivered ✅</span>
                                  </div>
                                ) : (
                                  <ProgressBar status={s.status} payment={selected.payment} />
                                )}

                                <hr className="my-2" />

                                {(s.items || []).map((it, i2) => {
                                  const key = getKey(selected._id, `${idx}-${i2}`);
                                  const currentRating = reviewForm[key]?.rating ?? 5;
                                  const currentComment = reviewForm[key]?.comment ?? "";

                                  return (
                                    <div key={`${selected._id}-${idx}-${i2}`} className="py-2 border-bottom">
                                      <div className="d-flex justify-content-between align-items-start gap-2">
                                        <div>
                                          <div className="fw-semibold">{it.name}</div>
                                          <div className="text-muted small">
                                            Qty: {it.qty}
                                            {it.chosenQtyLabel ? ` • ${it.chosenQtyLabel}` : ""}
                                          </div>
                                        </div>
                                        <div className="fw-semibold">₹{money(it.price) * money(it.qty)}</div>
                                      </div>

                                      {allowReview && (
                                        <div className="mt-2">
                                          <details>
                                            <summary className="fw-semibold small">Add review</summary>

                                            <div className="mt-2 p-2 border rounded">
                                              <div className="d-flex gap-2 flex-wrap align-items-center">
                                                <select
                                                  className="form-select form-select-sm"
                                                  style={{ width: 110 }}
                                                  value={currentRating}
                                                  onChange={(e) => setRating(key, Number(e.target.value))}
                                                >
                                                  {[5, 4, 3, 2, 1].map((r) => (
                                                    <option key={r} value={r}>
                                                      {r} ⭐
                                                    </option>
                                                  ))}
                                                </select>

                                                <input
                                                  className="form-control form-control-sm"
                                                  placeholder="Write review..."
                                                  value={currentComment}
                                                  onChange={(e) => setComment(key, e.target.value)}
                                                  style={{ minWidth: 240 }}
                                                />

                                                <button
                                                  className="btn btn-success btn-sm"
                                                  disabled={submittingKey === key}
                                                  onClick={() => submitReview(selected, it, key)}
                                                >
                                                  {submittingKey === key ? "Submitting..." : "Submit"}
                                                </button>
                                              </div>
                                            </div>
                                          </details>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <hr />

                  <details>
                    <summary className="fw-semibold">Delivery details</summary>
                    <div className="text-muted mt-2">
                      {selected.name} | {selected.phone} <br />
                      {selected.address}
                    </div>
                  </details>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {cancelModal.open && (
  <div className="modal d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
    <div className="modal-dialog">
      <div className="modal-content p-3">
        <h5>Cancel Order</h5>

        <select
          className="form-select mt-2"
          value={cancelModal.reason}
          onChange={(e) =>
            setCancelModal({ ...cancelModal, reason: e.target.value })
          }
        >
          <option value="">Select reason</option>
          <option>Ordered by mistake</option>
          <option>Found cheaper elsewhere</option>
          <option>Wrong address</option>
          <option>Other</option>
        </select>

        <div className="mt-3 d-flex justify-content-end gap-2">
          <button
            className="btn btn-secondary btn-sm"
           onClick={() =>
  setCancelModal({
    open:false,
    orderId:"",
    reason:""
  })
}
          >
            Close
          </button>

          <button
            className="btn btn-danger btn-sm"
            disabled={!cancelModal.reason}
            onClick={confirmCancel}
          >
            Confirm Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
)}
{returnModal.open && (
  <div className="modal d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
    <div className="modal-dialog">
      <div className="modal-content p-3">
        <h5>Return Product</h5>

        <select
          className="form-select mt-2"
          value={returnModal.reason}
          onChange={(e) =>
            setReturnModal({ ...returnModal, reason: e.target.value })
          }
        >
          <option value="">Select reason</option>
          <option>Received damaged product</option>
          <option>Wrong item delivered</option>
          <option>Quality not good</option>
          <option>Other</option>
        </select>

        <div className="mt-3 d-flex justify-content-end gap-2">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setReturnModal({ open: false })}
          >
            Close
          </button>

          <button
            className="btn btn-warning btn-sm"
            disabled={!returnModal.reason}
            onClick={confirmReturn}
          >
            Confirm Return
          </button>

        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}