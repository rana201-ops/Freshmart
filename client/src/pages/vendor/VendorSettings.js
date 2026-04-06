import { useEffect, useMemo, useState } from "react";
import api from "../../api";

const BACKEND = process.env.REACT_APP_API_URL;

const statusMeta = (s) => {
  if (s === "approved") return { text: "Approved", cls: "success" };
  if (s === "pending_review") return { text: "Under Review", cls: "warning", dark: true };
  if (s === "rejected") return { text: "Rejected", cls: "danger" };
  return { text: "Draft", cls: "secondary" };
};

const VendorSettings = () => {
  const [form, setForm] = useState({
    shopName: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    panNo: "",
    gstNo: "",
    bankHolderName: "",
    bankAccountNo: "",
    ifsc: "",
  });

  // ✅ files state
  const [files, setFiles] = useState({
    shopPhoto: null,
    gstDoc: null,
    panDoc: null,
  });

  // ✅ already uploaded paths from backend (for preview)
  const [uploaded, setUploaded] = useState({
    shopPhoto: "",
    gstDoc: "",
    panDoc: "",
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("draft");
  const [adminRemark, setAdminRemark] = useState("");

  const meta = useMemo(() => statusMeta(status), [status]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.get("/api/vendor/settings");
        if (res.data) {
          setForm({
            shopName: res.data.shopName || "",
            phone: res.data.phone || "",
            address: res.data.address || "",
            city: res.data.city || "",
            pincode: res.data.pincode || "",
            panNo: res.data.panNo || "",
            gstNo: res.data.gstNo || "",
            bankHolderName: res.data.bankHolderName || "",
            bankAccountNo: res.data.bankAccountNo || "",
            ifsc: res.data.ifsc || "",
          });

          setUploaded({
            shopPhoto: res.data.shopPhoto || "",
            gstDoc: res.data.gstDoc || "",
            panDoc: res.data.panDoc || "",
          });

          setStatus(res.data.status || "draft");
          setAdminRemark(res.data.adminRemark || "");
        } else {
          setStatus("draft");
        }
      } catch (err) {
        console.log(err);
      }
    };
    loadSettings();
  }, []);

  const isLocked = status === "pending_review";
  const isApproved = status === "approved";
  const canSubmit = status === "draft" || status === "rejected";

  const isValidPan = (pan) =>
    !pan ? true : /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(String(pan).trim());
  const isValidIfsc = (ifsc) =>
    /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(String(ifsc || "").trim());

  const validateBasic = () => {
    if (!/^[a-zA-Z0-9\s]+$/.test(form.shopName.trim())) {
      setMsg("❌ Shop name should contain only letters/numbers");
      return false;
    }
    if (!/^[0-9]{10}$/.test(form.phone.trim())) {
      setMsg("❌ Phone number must be exactly 10 digits");
      return false;
    }
    if (!form.address.trim()) {
      setMsg("❌ Address is required");
      return false;
    }
    return true;
  };

  const saveSettings = async (submitForApproval = false) => {
    setMsg("");

    if (!validateBasic()) return;

    if (form.panNo.trim() && !isValidPan(form.panNo.trim())) {
      return setMsg("❌ Invalid PAN format. Example: ABCDE1234F");
    }

    if (submitForApproval) {
      if (!form.city.trim()) return setMsg("❌ City is required");
      if (!/^[0-9]{6}$/.test(form.pincode.trim())) return setMsg("❌ Pincode must be 6 digits");

      if (!form.bankHolderName.trim()) return setMsg("❌ Account holder name required");
      if (!form.bankAccountNo.trim()) return setMsg("❌ Account number required");
      if (!form.ifsc.trim()) return setMsg("❌ IFSC required");
      if (!isValidIfsc(form.ifsc.trim())) return setMsg("❌ Invalid IFSC. Example: HDFC0001234");
    }

    try {
      setLoading(true);

      // ✅ FormData for multipart
      const fd = new FormData();
      fd.append("shopName", form.shopName.trim());
      fd.append("phone", form.phone.trim());
      fd.append("address", form.address.trim());
      fd.append("city", form.city.trim());
      fd.append("pincode", form.pincode.trim());
      fd.append("panNo", form.panNo.trim().toUpperCase());
      fd.append("gstNo", form.gstNo.trim().toUpperCase());
      fd.append("bankHolderName", form.bankHolderName.trim());
      fd.append("bankAccountNo", form.bankAccountNo.trim());
      fd.append("ifsc", form.ifsc.trim().toUpperCase());
      fd.append("submitForApproval", String(submitForApproval));

      // ✅ append files if selected
      if (files.shopPhoto) fd.append("shopPhoto", files.shopPhoto);
      if (files.gstDoc) fd.append("gstDoc", files.gstDoc);
      if (files.panDoc) fd.append("panDoc", files.panDoc);

      const res = await api.post("/api/vendor/settings", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMsg(res?.data?.msg || "✅ Done");

      if (res?.data?.settings) {
        setStatus(res.data.settings.status || status);
        setAdminRemark(res.data.settings.adminRemark || "");

        // ✅ update uploaded preview urls
        setUploaded({
          shopPhoto: res.data.settings.shopPhoto || uploaded.shopPhoto,
          gstDoc: res.data.settings.gstDoc || uploaded.gstDoc,
          panDoc: res.data.settings.panDoc || uploaded.panDoc,
        });

        // ✅ clear selected files after save
        setFiles({ shopPhoto: null, gstDoc: null, panDoc: null });
      }
    } catch (err) {
      setMsg(err?.response?.data?.msg || "❌ Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const topLine = useMemo(() => {
    if (status === "pending_review") return "Submitted for approval. Editing is locked until admin responds.";
    if (status === "approved") return "Your store is approved. You can update details anytime.";
    if (status === "rejected") return "Rejected by admin. Fix details and resubmit.";
    return "Fill details and submit for approval to start selling.";
  }, [status]);

  const InputProps = (extra = {}) => ({
    disabled: isLocked || loading,
    ...extra,
  });

  const fileDisabled = isLocked || loading;

  const showFileLink = (path) => {
    if (!path) return null;
    const url = path.startsWith("http") ? path : `${BACKEND}${path}`;
    return (
      <a href={url} target="_blank" rel="noreferrer" className="small">
        View uploaded file
      </a>
    );
  };

  const onlyLettersSpace = (value) => {
  // allow A-Z a-z and spaces only
  return value.replace(/[^a-zA-Z\s]/g, "").replace(/\s+/g, " ");
};

  return (
    <div className="container py-4" style={{ maxWidth: 820 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="fw-bold mb-1">Store Settings</h3>
          <div className="text-muted" style={{ fontSize: 13 }}>
            {topLine}
          </div>
        </div>

        <span className={`badge bg-${meta.cls} ${meta.dark ? "text-dark" : ""}`} style={{ fontSize: 13 }}>
          {meta.text}
        </span>
      </div>

      {adminRemark ? (
        <div className="alert alert-danger">
          <b>Admin Remark:</b> {adminRemark}
        </div>
      ) : null}

      {msg ? <div className="alert alert-info">{msg}</div> : null}

      {/* Shop */}
      <div className="card shadow-sm border-0 mb-3" style={{ borderRadius: 16 }}>
        <div className="card-body">
          <h6 className="fw-bold mb-3">Shop Details</h6>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Shop Name *</label>
              <input
  className="form-control"
  value={form.shopName}
  onChange={(e) =>
    setForm({ ...form, shopName: onlyLettersSpace(e.target.value) })
  }
  {...InputProps()}
/>
            </div>

            <div className="col-md-6">
              <label className="form-label">Phone *</label>
              <input
                className="form-control"
                value={form.phone}
                inputMode="numeric"
                maxLength={10}
                placeholder="9876543210"
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                {...InputProps()}
              />
              <small className="text-muted">10 digit mobile number</small>
            </div>

            <div className="col-md-6">
              <label className="form-label">City *</label>
              <input
  className="form-control"
  value={form.city}
  onChange={(e) =>
    setForm({ ...form, city: onlyLettersSpace(e.target.value) })
  }
  {...InputProps()}
/>
            </div>

            <div className="col-md-6">
              <label className="form-label">Pincode *</label>
              <input
                className="form-control"
                value={form.pincode}
                inputMode="numeric"
                maxLength={6}
                placeholder="387001"
                onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })}
                {...InputProps()}
              />
              <small className="text-muted">6 digit pincode</small>
            </div>

            <div className="col-md-12">
              <label className="form-label">Address *</label>
              <textarea
                className="form-control"
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                {...InputProps()}
              />
            </div>

            {/* ✅ Shop Photo Upload */}
            <div className="col-md-12">
              <label className="form-label">Shop Photo (optional)</label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                disabled={fileDisabled}
                onChange={(e) => setFiles({ ...files, shopPhoto: e.target.files?.[0] || null })}
              />
              <div className="mt-1">{showFileLink(uploaded.shopPhoto)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* KYC */}
      <div className="card shadow-sm border-0 mb-3" style={{ borderRadius: 16 }}>
        <div className="card-body">
          <h6 className="fw-bold mb-3">KYC (Optional)</h6>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">PAN</label>
              <input
                className="form-control"
                value={form.panNo}
                maxLength={10}
                placeholder="ABCDE1234F"
                onChange={(e) => setForm({ ...form, panNo: e.target.value.toUpperCase() })}
                {...InputProps()}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">PAN Document (optional)</label>
              <input
                type="file"
                className="form-control"
                accept="image/*,application/pdf"
                disabled={fileDisabled}
                onChange={(e) => setFiles({ ...files, panDoc: e.target.files?.[0] || null })}
              />
              <div className="mt-1">{showFileLink(uploaded.panDoc)}</div>
            </div>

            <div className="col-md-6">
              <label className="form-label">GST</label>
              <input
                className="form-control"
                value={form.gstNo}
                placeholder="24ABCDE1234F1Z5"
                onChange={(e) => setForm({ ...form, gstNo: e.target.value.toUpperCase() })}
                {...InputProps()}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">GST Document (optional)</label>
              <input
                type="file"
                className="form-control"
                accept="image/*,application/pdf"
                disabled={fileDisabled}
                onChange={(e) => setFiles({ ...files, gstDoc: e.target.files?.[0] || null })}
              />
              <div className="mt-1">{showFileLink(uploaded.gstDoc)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bank */}
      <div className="card shadow-sm border-0 mb-3" style={{ borderRadius: 16 }}>
        <div className="card-body">
          <h6 className="fw-bold mb-3">Bank Details (Required for Approval)</h6>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Account Holder Name *</label>
              <input
  className="form-control"
  value={form.bankHolderName}
  onChange={(e) =>
    setForm({ ...form, bankHolderName: onlyLettersSpace(e.target.value) })
  }
  {...InputProps()}
/>
            </div>

            <div className="col-md-6">
              <label className="form-label">Account Number *</label>
              <input
                className="form-control"
                value={form.bankAccountNo}
                inputMode="numeric"
                placeholder="123456789012"
                onChange={(e) => setForm({ ...form, bankAccountNo: e.target.value.replace(/\D/g, "") })}
                {...InputProps()}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">IFSC *</label>
              <input
                className="form-control"
                value={form.ifsc}
                maxLength={11}
                placeholder="HDFC0001234"
                onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })}
                {...InputProps()}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="d-flex gap-2">
        <button
          className="btn btn-outline-secondary w-50"
          onClick={() => saveSettings(false)}
          disabled={loading || isLocked}
        >
          {loading ? "Saving..." : isApproved ? "Save Changes" : "Save Draft"}
        </button>

        {canSubmit && (
          <button
            className="btn btn-success w-50"
            onClick={() => saveSettings(true)}
            disabled={loading}
          >
            {loading ? "Submitting..." : status === "rejected" ? "Resubmit for Approval" : "Submit for Approval"}
          </button>
        )}

        {status === "pending_review" && (
          <button className="btn btn-success w-50" disabled>
            Submitted ✅
          </button>
        )}

        {isApproved && (
          <button className="btn btn-success w-50" disabled>
            Approved ✅
          </button>
        )}
      </div>
    </div>
  );
};

export default VendorSettings;