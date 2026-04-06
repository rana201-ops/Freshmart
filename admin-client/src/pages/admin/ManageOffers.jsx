import { useEffect, useMemo, useState } from "react";
import api from "../../api";

// ---------- shared UI helpers ----------
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

const EmptyCard = ({ icon = "🎁", title, subtitle, onRefresh }) => (
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

const Pill = ({ cls, children }) => (
  <span
    className={`badge ${cls}`}
    style={{
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



const ManageOffers = () => {
  const [offers, setOffers] = useState([]);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    desc: "",
    code: "",
    discountType: "PERCENT",
    discountValue: 0,
    minOrder: 0,
    validTill: "",
    active: true,
  });

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ sending state
  const [sendingId, setSendingId] = useState(null);

  // ✅ add expired tab
  const [tab, setTab] = useState("all"); // all | active | expired | inactive | with_code
  const [q, setQ] = useState("");

  // ✅ expiry helper
  const isExpired = (o) => {
    if (!o?.validTill) return false;
    return new Date(o.validTill).getTime() < Date.now();
  };

  const load = async () => {
    try {
      setErr("");
      setMsg("");
      setLoading(true);
      const res = await api.get("/api/offers/all");
      setOffers(res.data || []);
    } catch (e) {
      setOffers([]);
      setErr(e?.response?.data?.msg || "Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setEditId(null);
    setForm({
      title: "",
      desc: "",
      code: "",
      discountType: "PERCENT",
      discountValue: 0,
      minOrder: 0,
      validTill: "",
      active: true,
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");

    const title = form.title.trim();
    const desc = form.desc.trim();
    if (!title || !desc) return setErr("Title and description required");

    const payload = {
      title,
      desc,
      active: !!form.active,
      code: form.code?.trim() ? form.code.trim().toUpperCase() : "",
      discountType: form.discountType === "AMOUNT" ? "AMOUNT" : "PERCENT",
      discountValue: Number(form.discountValue || 0),
      minOrder: Number(form.minOrder || 0),
      validTill: form.validTill ? form.validTill : "",
    };

    try {
      setLoading(true);
      if (editId) {
        await api.patch(`/api/offers/${editId}`, payload);
        setMsg("✅ Offer updated");
      } else {
        await api.post("/api/offers", payload);
        setMsg("✅ Offer added");
      }
      reset();
      load();
    } catch (e2) {
      setErr(e2?.response?.data?.msg || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const edit = (o) => {
    setEditId(o._id);
    const dateOnly = o.validTill
      ? new Date(o.validTill).toISOString().slice(0, 10)
      : "";
    setForm({
      title: o.title || "",
      desc: o.desc || "",
      code: o.code || "",
      discountType: o.discountType || "PERCENT",
      discountValue: o.discountValue ?? 0,
      minOrder: o.minOrder ?? 0,
      validTill: dateOnly,
      active: !!o.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const del = async (id) => {
    if (!window.confirm("Delete this offer?")) return;
    try {
      setErr("");
      setMsg("");
      await api.delete(`/api/offers/${id}`);
      setMsg("✅ Offer deleted");
      load();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Delete failed");
    }
  };

  const toggle = async (o) => {
    try {
      setErr("");
      setMsg("");
      await api.patch(`/api/offers/${o._id}`, { active: !o.active });
      setMsg(`✅ Offer ${o.active ? "disabled" : "enabled"}`);
      load();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Toggle failed");
    }
  };

  const sendEmail = async (offerId) => {
    if (!window.confirm("Send this offer email to all subscribers?")) return;

    try {
      setErr("");
      setMsg("");
      setSendingId(offerId);

      const res = await api.post(`/api/offers/${offerId}/send-email`);
      setMsg(res?.data?.msg || "✅ Email sent to subscribers");
    } catch (e) {
      setErr(e?.response?.data?.msg || "Email send failed");
    } finally {
      setSendingId(null);
    }
  };

  // ✅ expiry-aware stats
  const stats = useMemo(() => {
    const list = offers || [];
    const total = list.length;

    const active = list.filter((o) => !!o.active && !isExpired(o)).length;
    const expired = list.filter((o) => !!o.active && isExpired(o)).length;
    const inactive = list.filter((o) => !o.active).length;

    const withCode = list.filter((o) => String(o.code || "").trim()).length;

    return { total, active, expired, inactive, withCode };
  }, [offers]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return (offers || [])
      .filter((o) => {
        if (tab === "active") return !!o.active && !isExpired(o);
        if (tab === "expired") return !!o.active && isExpired(o);
        if (tab === "inactive") return !o.active;
        if (tab === "with_code") return String(o.code || "").trim().length > 0;
        return true;
      })
      .filter((o) => {
        if (!query) return true;
        const hay = [
          o.title,
          o.desc,
          o.code,
          o.discountType,
          o.discountValue,
          o.minOrder,
          o.active ? "active" : "inactive",
          isExpired(o) ? "expired" : "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [offers, tab, q]);

  const discountText = (o) =>
    (o.discountType || "PERCENT") === "AMOUNT"
      ? `₹${Number(o.discountValue || 0)} OFF`
      : `${Number(o.discountValue || 0)}% OFF`;

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
              Manage Offers
            </div>
            <div style={{ opacity: 0.92, fontSize: 14 }}>
              Create, edit, enable/disable offers (coupons)
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
          <div>
            <h3 className="fw-bold mb-1">Manage Offers</h3>
            <div className="text-muted" style={{ fontSize: 13 }}>
              Add offers, coupon codes, discount and expiry
            </div>
          </div>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={load}
            disabled={loading}
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>

        {msg ? <div className="alert alert-success rounded-4">{msg}</div> : null}
        {err ? <div className="alert alert-danger rounded-4">{err}</div> : null}

        

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
                active={tab === "expired"}
                label="Expired"
                count={stats.expired}
                onClick={() => setTab("expired")}
              />
              <SegTab
                active={tab === "inactive"}
                label="Inactive"
                count={stats.inactive}
                onClick={() => setTab("inactive")}
              />
              <SegTab
                active={tab === "with_code"}
                label="With Code"
                count={stats.withCode}
                onClick={() => setTab("with_code")}
              />
            </div>

            <div className="d-flex gap-2 align-items-center flex-wrap">
              <input
                className="form-control form-control-sm"
                placeholder="Search title, code..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ minWidth: 240, borderRadius: 12 }}
              />
              <button
                className="btn btn-sm btn-dark"
                onClick={reset}
                style={{ borderRadius: 12, fontWeight: 900 }}
              >
                New Offer
              </button>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Showing <b>{filtered.length}</b>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: 16 }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="fw-bold mb-0">{editId ? "Edit Offer" : "Add Offer"}</h5>
              {editId ? <Pill cls="bg-warning text-dark">EDITING</Pill> : null}
            </div>

            <form onSubmit={submit} className="row g-3 mt-2">
              {/* ... form same ... */}
              {/* (No change in your form fields) */}
              <div className="col-12 col-lg-4">
                <label className="form-label">Title</label>
                <input
                  className="form-control"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Flat 20% OFF"
                />
              </div>

              <div className="col-12 col-lg-6">
                <label className="form-label">Description</label>
                <input
                  className="form-control"
                  value={form.desc}
                  onChange={(e) => setForm({ ...form, desc: e.target.value })}
                  placeholder="e.g., On fruits & vegetables"
                />
              </div>

              <div className="col-12 col-lg-2">
                <label className="form-label">Active</label>
                <select
                  className="form-select"
                  value={form.active ? "yes" : "no"}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.value === "yes" })
                  }
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label">Coupon Code</label>
                <input
                  className="form-control"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g., FRESH20"
                />
                <small className="text-muted">Leave empty if just a banner offer</small>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label">Discount Type</label>
                <select
                  className="form-select"
                  value={form.discountType}
                  onChange={(e) =>
                    setForm({ ...form, discountType: e.target.value })
                  }
                >
                  <option value="PERCENT">Percent (%)</option>
                  <option value="AMOUNT">Amount (₹)</option>
                </select>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label">
                  Discount Value {form.discountType === "PERCENT" ? "(%)" : "(₹)"}
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={form.discountValue}
                  onChange={(e) =>
                    setForm({ ...form, discountValue: e.target.value })
                  }
                  min="0"
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label">Min Order (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.minOrder}
                  onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
                  min="0"
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label">Valid Till</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.validTill}
                  onChange={(e) =>
                    setForm({ ...form, validTill: e.target.value })
                  }
                />
                <small className="text-muted">Empty = no expiry</small>
              </div>

              <div className="col-12 col-lg-4 d-flex align-items-end gap-2">
                <button
                  className="btn btn-success w-100"
                  type="submit"
                  disabled={loading}
                  style={{ borderRadius: 12, fontWeight: 900 }}
                >
                  {editId ? "Update" : "Add"}
                </button>

                {editId ? (
                  <button
                    className="btn btn-outline-secondary w-100"
                    type="button"
                    onClick={reset}
                    style={{ borderRadius: 12, fontWeight: 900 }}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyCard
            icon="🎁"
            title="No offers found"
            subtitle="Try changing tabs/search or refresh."
            onRefresh={load}
          />
        ) : (
          <div className="row g-3">
            {filtered.map((o) => (
              <div className="col-12 col-md-6 col-lg-4" key={o._id}>
                <div
                  className="rounded-4 p-3 bg-white shadow-sm h-100"
                  style={{
                    border: "1px solid rgba(0,0,0,.06)",
                    transition: "0.2s",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <div className="fw-bold" style={{ fontSize: 16 }}>
                        {o.title}
                      </div>
                      <div className="text-muted mt-1" style={{ fontSize: 13 }}>
                        {o.desc}
                      </div>

                      <div className="d-flex flex-wrap gap-2 mt-2">
                        <Pill cls="bg-light text-dark border">
                          {o.code ? (
                            <>
                              Code: <b>{o.code}</b>
                            </>
                          ) : (
                            "No code"
                          )}
                        </Pill>
                        <Pill cls="bg-light text-dark border">{discountText(o)}</Pill>
                        {Number(o.minOrder || 0) > 0 ? (
                          <Pill cls="bg-light text-dark border">
                            Min ₹{Number(o.minOrder || 0)}
                          </Pill>
                        ) : null}
                      </div>
                    </div>

                    {/* ✅ expired badge */}
                    {isExpired(o) ? (
                      <Pill cls="bg-danger">EXPIRED</Pill>
                    ) : (
                      <Pill cls={o.active ? "bg-success" : "bg-secondary"}>
                        {o.active ? "ACTIVE" : "INACTIVE"}
                      </Pill>
                    )}
                  </div>

                  <div className="text-muted small mt-2">
                    {o.validTill
                      ? `Valid till: ${new Date(o.validTill).toLocaleDateString()}`
                      : "No expiry"}
                  </div>

                  <div className="d-flex gap-2 flex-wrap mt-3">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => edit(o)}
                      style={{ borderRadius: 12, fontWeight: 900 }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => del(o._id)}
                      style={{ borderRadius: 12, fontWeight: 900 }}
                    >
                      Delete
                    </button>
                    <button
                      className="btn btn-sm btn-outline-dark"
                      onClick={() => toggle(o)}
                      style={{ borderRadius: 12, fontWeight: 900 }}
                    >
                      {o.active ? "Disable" : "Enable"}
                    </button>

                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => sendEmail(o._id)}
                      disabled={sendingId === o._id}
                      style={{ borderRadius: 12, fontWeight: 900 }}
                      title="Send this offer to all newsletter subscribers"
                    >
                      {sendingId === o._id ? "Sending..." : "Send Email"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageOffers;