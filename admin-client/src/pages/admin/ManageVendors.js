
import { useEffect, useMemo, useState } from "react";
import api from "../../api";

const BACKEND = "http://localhost:5000";

const badgeMeta = (s) => {
  const st = (s || "draft").toLowerCase();
  if (st === "approved")
    return { bg: "rgba(25,135,84,.12)", c: "#198754", b: "rgba(25,135,84,.25)", t: "APPROVED" };
  if (st === "rejected")
    return { bg: "rgba(220,53,69,.12)", c: "#dc3545", b: "rgba(220,53,69,.25)", t: "REJECTED" };
  if (st === "pending_review")
    return { bg: "rgba(255,193,7,.18)", c: "#8a6d00", b: "rgba(255,193,7,.35)", t: "UNDER REVIEW" };
  return { bg: "rgba(108,117,125,.12)", c: "#6c757d", b: "rgba(108,117,125,.25)", t: String(st).toUpperCase() };
};

const StatusPill = ({ status }) => {
  const m = badgeMeta(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        fontWeight: 900,
        fontSize: 11,
        padding: "6px 10px",
        background: m.bg,
        color: m.c,
        border: `1px solid ${m.b}`,
        letterSpacing: 0.6,
      }}
    >
      {m.t}
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

const maskAccount = (acc) => {
  const a = String(acc || "").trim();
  if (!a) return "-";
  if (a.length <= 4) return "XXXX";
  return "XXXXXX" + a.slice(-4);
};

const isReadyForApproval = (v) => {
  const s = v?.settings || {};
  return (
    !!s.shopName &&
    !!s.phone &&
    !!s.address &&
    !!s.city &&
    /^\d{6}$/.test(String(s.pincode || "").trim()) &&
    !!s.bankHolderName &&
    !!s.bankAccountNo &&
    !!s.ifsc
  );
};

const Checklist = ({ vendor }) => {
  const s = vendor?.settings || {};
  const ok = (cond) => (cond ? <span className="badge bg-success">✓</span> : <span className="badge bg-danger">×</span>);

  return (
    <div className="mt-2" style={{ fontSize: 13 }}>
      <div className="fw-semibold mb-1">Approval Checklist</div>
      <div className="d-flex flex-wrap gap-2">
        <span className="border rounded px-2 py-1 d-inline-flex align-items-center gap-2">{ok(!!s.shopName)} Shop Name</span>
        <span className="border rounded px-2 py-1 d-inline-flex align-items-center gap-2">{ok(!!s.phone)} Phone</span>
        <span className="border rounded px-2 py-1 d-inline-flex align-items-center gap-2">{ok(!!s.address)} Address</span>
        <span className="border rounded px-2 py-1 d-inline-flex align-items-center gap-2">{ok(!!s.city)} City</span>
        <span className="border rounded px-2 py-1 d-inline-flex align-items-center gap-2">{ok(/^\d{6}$/.test(String(s.pincode || "").trim()))} Pincode(6)</span>
        <span className="border rounded px-2 py-1 d-inline-flex align-items-center gap-2">{ok(!!s.bankHolderName)} Holder</span>
        <span className="border rounded px-2 py-1 d-inline-flex align-items-center gap-2">{ok(!!s.bankAccountNo)} Account</span>
        <span className="border rounded px-2 py-1 d-inline-flex align-items-center gap-2">{ok(!!s.ifsc)} IFSC</span>
      </div>
    </div>
  );
};

const EmptyCard = ({ icon = "🏪", title, subtitle, onRefresh }) => (
  <div className="rounded-4 bg-white shadow-sm p-5 text-center" style={{ border: "1px solid rgba(0,0,0,.06)" }}>
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

const ManageVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, rejected: 0, pendingReview: 0, draft: 0 });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [tab, setTab] = useState("pending_review");

  // modal
  const [selected, setSelected] = useState(null);
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setMsg("");
      setLoading(true);

      const [allRes, statsRes] = await Promise.all([
        api.get("/api/admin/vendors"),
        api.get("/api/admin/vendors/stats"),
      ]);

      // null/undefined safe
      const list = Array.isArray(allRes.data)
  ? allRes.data.filter(v => v && v.vendorStatus && v.vendorStatus !== "draft")
  : [];
  setVendors(list);   // 
      setStats(statsRes.data || stats);
    } catch (e) {
      setVendors([]);
      setMsg(e?.response?.data?.msg || "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const closeModal = () => {
    setSelected(null);
    setRemark("");
  };

  const setStatus = async (vendorId, status, remarkText = "") => {
    try {
      setSaving(true);
      await api.patch(`/api/admin/vendors/${vendorId}/status`, { status, remark: remarkText || "" });
      setMsg(`✅ Vendor ${status}`);
      closeModal();
      load();
    } catch (e) {
      setMsg(e?.response?.data?.msg || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const onApprove = () => {
    if (!selected) return;
    setStatus(selected._id, "approved", "");
  };

  const onReject = () => {
    if (!selected) return;
    if (!remark.trim()) {
      setMsg("❌ Reject remark is required");
      return;
    }
    setStatus(selected._id, "rejected", remark.trim());
  };

  const tabVendors = useMemo(() => {
    const list = Array.isArray(vendors) ? vendors.filter(Boolean) : [];
    const st = (v) => (v?.vendorStatus || "draft");
    if (tab === "pending_review") return list.filter((v) => st(v) === "pending_review");
    if (tab === "approved") return list.filter((v) => st(v) === "approved");
    if (tab === "rejected") return list.filter((v) => st(v) === "rejected");
    return list;
  }, [vendors, tab]);

  const showing = tabVendors.length;

  // ✅ helper for doc links
  const docLink = (path, label) => {
    if (!path) return <span className="text-muted">-</span>;
    const url = path.startsWith("http") ? path : `${BACKEND}${path}`;
    return (
      <a href={url} target="_blank" rel="noreferrer">
        {label || "View"}
      </a>
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
            <div className="fw-bold" style={{ fontSize: 22 }}>
              Vendor Management
            </div>
            <div style={{ opacity: 0.92, fontSize: 14 }}>Review vendor onboarding, validate details and approve partners</div>
          </div>
        </div>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
          <div>
            <h3 className="fw-bold mb-1">Manage Vendors</h3>
            <div className="text-muted" style={{ fontSize: 13 }}>
              Under Review → Approve/Reject → Vendor can start selling
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
            { label: "Total Vendors", value: vendors.length },
            { label: "Under Review", value: stats.pendingReview },
            { label: "Approved", value: stats.approved },
            { label: "Rejected", value: stats.rejected },
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
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
            <div className="d-flex gap-2 flex-wrap">
              <SegTab active={tab === "pending_review"} label="Under Review" count={stats.pendingReview} onClick={() => setTab("pending_review")} />
              <SegTab active={tab === "approved"} label="Approved" count={stats.approved} onClick={() => setTab("approved")} />
              <SegTab active={tab === "rejected"} label="Rejected" count={stats.rejected} onClick={() => setTab("rejected")} />
            </div>
            <div className="text-muted" style={{ fontSize: 12 }}>
              Showing <b>{showing}</b>
            </div>
          </div>
        </div>

        {/* List */}
        {tabVendors.length === 0 ? (
          <EmptyCard
            icon={tab === "approved" ? "✅" : tab === "rejected" ? "⛔" : "🏪"}
            title={tab === "approved" ? "No approved vendors" : tab === "rejected" ? "No rejected vendors" : "No vendors under review"}
            subtitle={tab === "pending_review" ? "New vendor requests will appear here." : "This list will populate as vendors get updated."}
            onRefresh={load}
          />
        ) : (
          <div className="d-flex flex-column gap-2">
            {tabVendors.map((v) => {
              if (!v) return null;
              const s = v.settings || {};
              
              
              const ready = isReadyForApproval(v);
              const status = v.vendorStatus || "draft";
              const canApprove = tab === "pending_review" && status === "pending_review" && ready;

              return (
                <div
                  key={v._id}
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
                  <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
                    {/* Left */}
                    <div style={{ minWidth: 320 }}>
                      <div className="fw-bold" style={{ fontSize: 15 }}>
                        {s.shopName || v.name || "Vendor"}
                      </div>
                      <div className="text-muted" style={{ fontSize: 13 }}>
                        {v.email} {s.phone ? ` • ${s.phone}` : ""}
                      </div>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        Joined: {v.createdAt ? new Date(v.createdAt).toLocaleString() : "-"}
                      </div>
                    </div>

                    {/* Middle */}
                    <div style={{ minWidth: 360 }}>
                      <div className="fw-semibold" style={{ fontSize: 13 }}>
                        Shop Details
                      </div>
                      <div className="text-muted" style={{ fontSize: 13 }}>
                        {s.address || "-"}
                      </div>
                      <div className="text-muted" style={{ fontSize: 13 }}>
                        {s.city || "-"} {s.pincode ? ` • ${s.pincode}` : ""}
                      </div>
                      {!v.settings ? (
                        <div className="text-danger mt-1" style={{ fontSize: 12 }}>
                          Settings not submitted yet
                        </div>
                      ) : null}
                      {tab === "pending_review" && !ready ? (
                        <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                          ⚠️ Complete checklist required to approve
                        </div>
                      ) : null}
                    </div>

                    {/* Right */}
                    <div className="text-end" style={{ minWidth: 320 }}>
                      <StatusPill status={status} />
                      <div className="mt-2 d-flex justify-content-end gap-2 flex-wrap">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => setSelected(v)}>
                          View
                        </button>

                        {tab === "pending_review" ? (
                          <>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => setStatus(v._id, "approved")}
                              disabled={!canApprove}
                              title={!ready ? "Complete checklist required" : "Approve vendor"}
                            >
                              Approve
                            </button>

                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => {
                                setSelected(v);
                                setRemark("");
                              }}
                            >
                              Reject
                            </button>
                          </>
                        ) : status === "approved" ? (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => setStatus(v._id, "rejected", "Blocked by admin")}>
                            Reject
                          </button>
                        ) : status === "rejected" ? (
                          <button className="btn btn-sm btn-outline-success" onClick={() => setStatus(v._id, "approved")}>
                            Approve
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL */}
        {selected ? (
          <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,.4)" }}>
            <div className="modal-dialog modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title mb-0">Vendor Details</h5>
                    <div className="text-muted" style={{ fontSize: 13 }}>
                      {selected.email} • {selected.name}
                    </div>
                  </div>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>

                <div className="modal-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <StatusPill status={selected.vendorStatus || "draft"} />
                    <small className="text-muted">Joined: {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "-"}</small>
                  </div>

                  <Checklist vendor={selected} />

                  {/* ✅ Uploaded Documents moved INSIDE modal (safe) */}
                  <div className="mt-3">
                    <div className="fw-bold mb-2">Uploaded Documents</div>

                    <div>
                      <b>Shop Photo:</b> {docLink(selected?.settings?.shopPhoto, "View")}
                    </div>
                    <div>
                      <b>PAN Document:</b> {docLink(selected?.settings?.panDoc, "View")}
                    </div>
                    <div>
                      <b>GST Document:</b> {docLink(selected?.settings?.gstDoc, "View")}
                    </div>
                  </div>

                  <hr />

                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="fw-bold mb-2">Shop</div>
                      <div>
                        <b>Shop Name:</b> {selected.settings?.shopName || "-"}
                      </div>
                      <div>
                        <b>Phone:</b> {selected.settings?.phone || "-"}
                      </div>
                      <div>
                        <b>City:</b> {selected.settings?.city || "-"}
                      </div>
                      <div>
                        <b>Pincode:</b> {selected.settings?.pincode || "-"}
                      </div>
                      <div className="mt-2">
                        <b>Address:</b>
                        <br />
                        {selected.settings?.address || "-"}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="fw-bold mb-2">KYC + Bank</div>
                      <div>
                        <b>PAN:</b> {selected.settings?.panNo || "-"}
                      </div>
                      <div>
                        <b>GST:</b> {selected.settings?.gstNo || "-"}
                      </div>
                      <div className="mt-2">
                        <b>Account Holder:</b> {selected.settings?.bankHolderName || "-"}
                      </div>
                      <div>
                        <b>Account No:</b> {maskAccount(selected.settings?.bankAccountNo)}
                      </div>
                      <div>
                        <b>IFSC:</b> {selected.settings?.ifsc || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="form-label fw-semibold">Reject Remark (required for rejection)</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="Example: IFSC invalid / Address incomplete / Bank details mismatch"
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="btn btn-outline-secondary" onClick={closeModal} disabled={saving}>
                    Close
                  </button>

                  <button
                    className="btn btn-success"
                    onClick={onApprove}
                    disabled={saving || selected.vendorStatus !== "pending_review" || !isReadyForApproval(selected)}
                    title={!isReadyForApproval(selected) ? "Checklist incomplete" : "Approve"}
                  >
                    {saving ? "Saving..." : "Approve"}
                  </button>

                  <button className="btn btn-danger" onClick={onReject} disabled={saving}>
                    {saving ? "Saving..." : "Reject"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ManageVendors;