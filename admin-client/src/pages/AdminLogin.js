import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // UI
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // ✅ Forgot modal state
  const [showForgot, setShowForgot] = useState(false);
  const [fEmail, setFEmail] = useState("");
  const [fKey, setFKey] = useState("");
  const [fNewPass, setFNewPass] = useState("");
  const [fConfirm, setFConfirm] = useState("");
  const [fMsg, setFMsg] = useState("");
  const [fType, setFType] = useState("info"); // info | danger | success
  const [fLoading, setFLoading] = useState(false);

  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      setMsg("");
      setLoading(true);

      // ✅ UPDATED ENDPOINT
      const res = await api.post("/api/admin/login", { email, password });

      // ✅ token save
      localStorage.setItem("freshmart_token", res.data.token);
      localStorage.setItem("freshmart_user", JSON.stringify(res.data.user));

      // rememberMe UI only
      navigate("/dashboard");
    } catch (err) {
      setMsg(err?.response?.data?.msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const openForgot = () => {
    setFEmail(email || "");
    setFKey("");
    setFNewPass("");
    setFConfirm("");
    setFMsg("");
    setFType("info");
    setShowForgot(true);
  };

  const closeForgot = () => setShowForgot(false);

  const forgotSubmit = async (e) => {
    e.preventDefault();

    // ✅ validations
    if (!fEmail.trim() || !fKey.trim() || !fNewPass.trim() || !fConfirm.trim()) {
      setFType("danger");
      setFMsg("All fields are required.");
      return;
    }

    if (fNewPass.length < 6) {
      setFType("danger");
      setFMsg("New password must be at least 6 characters.");
      return;
    }

    if (fNewPass !== fConfirm) {
      setFType("danger");
      setFMsg("Passwords do not match.");
      return;
    }

    try {
      setFLoading(true);
      setFMsg("");

      // ✅ UPDATED ENDPOINT
      const res = await api.post("/api/admin/reset-password", {
        email: fEmail,
        resetKey: fKey,
        newPassword: fNewPass,
      });

      setFType("success");
      setFMsg(res.data?.msg || "✅ Password updated");

      setFKey("");
      setFNewPass("");
      setFConfirm("");
    } catch (err) {
      setFType("danger");
      setFMsg(err?.response?.data?.msg || "Reset failed");
    } finally {
      setFLoading(false);
    }
  };

  return (
    <div
      className="position-relative overflow-hidden"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 10% 10%, rgba(25,135,84,0.18), transparent 60%)," +
          "radial-gradient(1000px 500px at 90% 20%, rgba(13,110,253,0.12), transparent 55%)," +
          "linear-gradient(180deg, #f8fafc, #ffffff)",
      }}
    >
      {/* decorative blobs */}
      <div
        className="position-absolute"
        style={{
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "rgba(25,135,84,0.15)",
          filter: "blur(20px)",
          top: -140,
          left: -140,
        }}
      />
      <div
        className="position-absolute"
        style={{
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: "rgba(13,110,253,0.12)",
          filter: "blur(22px)",
          bottom: -200,
          right: -200,
        }}
      />

      <div className="container py-5">
        <div className="row align-items-center g-5" style={{ minHeight: "80vh" }}>
          {/* LEFT */}
          <div className="col-lg-6">
            <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill border bg-white shadow-sm">
              <span
                className="d-inline-block rounded-circle"
                style={{ width: 10, height: 10, background: "#198754" }}
              />
              <small className="fw-semibold text-dark">Admin Portal</small>
              <small className="text-muted">• Secure</small>
            </div>

            <h1 className="fw-bold mt-4 mb-3" style={{ lineHeight: 1.1 }}>
              Green Leaf <span className="text-success">Grocer</span>
            </h1>

            <p className="text-muted fs-5 mb-4" style={{ maxWidth: 520 }}>
              Manage vendors, products, orders and offers with role-based secure access.
            </p>

            <div className="row g-3" style={{ maxWidth: 560 }}>
              <div className="col-md-6">
                <div className="p-3 rounded-4 border bg-white shadow-sm">
                  <div className="fw-semibold mb-1">Vendor Approvals</div>
                  <div className="text-muted small">Approve / reject vendors & products</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 rounded-4 border bg-white shadow-sm">
                  <div className="fw-semibold mb-1">Order Control</div>
                  <div className="text-muted small">Track orders and manage offers</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="col-lg-6 d-flex justify-content-lg-end justify-content-center">
            <div
              className="card border-0 shadow-lg"
              style={{
                width: 420,
                borderRadius: 18,
                background: "rgba(255,255,255,0.78)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="card-body p-4 p-md-5">
                <div className="mb-3">
                  <h4 className="fw-bold mb-1">Sign in</h4>
                  <div className="text-muted small">Admin access only</div>
                </div>

                {msg && (
                  <div className="alert alert-danger py-2 text-center mb-3">
                    {msg}
                  </div>
                )}

                <form onSubmit={submit}>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      className="form-control form-control-lg"
                      type="email"
                      placeholder="admin@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Password</label>
                    <div className="input-group input-group-lg">
                      <input
                        className="form-control"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-light border"
                        style={{ minWidth: 72 }}
                        onClick={() => setShowPassword((s) => !s)}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="rememberMe">
                        Remember me
                      </label>
                    </div>

                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none"
                      onClick={openForgot}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    className="btn btn-success btn-lg w-100 fw-semibold"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <small className="text-muted">
                    © {new Date().getFullYear()} Green Leaf Grocer
                  </small>
                </div>
              </div>
            </div>
          </div>
          {/* /RIGHT */}
        </div>
      </div>

      {/* ✅ Forgot Password Modal */}
      {showForgot && (
        <>
          <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{ background: "rgba(0,0,0,0.45)", zIndex: 1050 }}
            onClick={closeForgot}
          />

          <div
            className="position-fixed top-50 start-50 translate-middle"
            style={{ zIndex: 1060, width: "min(560px, 92vw)" }}
          >
            <div className="card shadow-lg border-0" style={{ borderRadius: 14 }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5 className="fw-bold mb-1">Reset password</h5>
                    <div className="text-muted small">
                      Enter reset key and set a new password.
                    </div>
                  </div>
                  <button className="btn btn-sm btn-light border" onClick={closeForgot}>
                    ✕
                  </button>
                </div>

                {fMsg && (
                  <div className={`alert alert-${fType} py-2`}>{fMsg}</div>
                )}

                <form onSubmit={forgotSubmit}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">Admin Email</label>
                      <input
                        className="form-control"
                        type="email"
                        placeholder="admin@gmail.com"
                        value={fEmail}
                        onChange={(e) => setFEmail(e.target.value)}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label">Reset Key</label>
                      <input
                        className="form-control"
                        placeholder="Enter secret reset key"
                        value={fKey}
                        onChange={(e) => setFKey(e.target.value)}
                      />
                      
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">New Password</label>
                      <input
                        className="form-control"
                        type="password"
                        placeholder="New password"
                        value={fNewPass}
                        onChange={(e) => setFNewPass(e.target.value)}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Confirm Password</label>
                      <input
                        className="form-control"
                        type="password"
                        placeholder="Confirm password"
                        value={fConfirm}
                        onChange={(e) => setFConfirm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="d-flex gap-2 justify-content-end mt-4">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={closeForgot}
                      disabled={fLoading}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-success" disabled={fLoading}>
                      {fLoading ? "Updating..." : "Update password"}
                    </button>
                  </div>
                </form>

                <div className="text-muted small mt-3">
                  After password update, login with the new password.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminLogin;
