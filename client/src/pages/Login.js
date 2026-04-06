import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const [data, setData] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const { login, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";
  const infoMsg = location.state?.msg || "";

  useEffect(() => {
    if (location.state?.email) {
      setData((p) => ({ ...p, email: location.state.email }));
    }
  }, [location.state]);

  useEffect(() => {
    if (location.state?.msg) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const email = (data.email || "").trim().toLowerCase();
    const password = data.password || "";
    if (!email || !password) return setError("Please enter email and password.");

    try {
      const result = await login(email, password);
      const role = result?.user?.role;

      if (role === "admin") {
        logout();
        return setError("Admin login is not available in the client app.");
      }

      if (role === "vendor") {
        logout();
        return setError("This is a vendor account. Please login from Home → Sell on FreshMart.");
      }

      navigate(from, { replace: true });
    } catch (err) {
      if (!err?.response) setError("Server not reachable. Check backend.");
      else setError(err?.response?.data?.msg || "Login failed");
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 72px - 64px)",
        background: "transparent",
        paddingTop: 32,
        paddingBottom: 32,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div className="container" style={{ maxWidth: 520 }}>
        <div
          className="card border-0 rounded-4 overflow-hidden"
          style={{
            boxShadow: "0 18px 50px rgba(0,0,0,0.10)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div className="card-body p-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h5 className="fw-bold mb-0">Sign in</h5>
              <span className="text-muted" style={{ fontSize: 12 }}>
                🔒 Secure
              </span>
            </div>

            <p className="text-muted mb-3" style={{ fontSize: 13 }}>
              Login to continue shopping.
            </p>

            {infoMsg && <div className="alert alert-warning py-2">{infoMsg}</div>}
            {error && <div className="alert alert-danger py-2">{error}</div>}

            <form onSubmit={submit} autoComplete="on">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control mb-3"
                placeholder="Enter your email"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                required
              />

              <label className="form-label">Password</label>
              <div className="input-group mb-2">
                <input
                  type={show ? "text" : "password"}
                  className="form-control"
                  placeholder="Enter your password"
                  value={data.password}
                  onChange={(e) => setData({ ...data, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShow(!show)}
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>

              {/*  forgot password link */}
              <div className="text-end mb-3">
                <Link to="/forgot-password" className="text-success fw-semibold" style={{ fontSize: 13 }}>
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="btn btn-success w-100">
                Continue
              </button>
            </form>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <span className="text-muted" style={{ fontSize: 13 }}>
                New here?
              </span>
              <Link
                to="/signup"
                state={{ from, msg: infoMsg, email: data.email }}
                className="fw-semibold text-success"
              >
                Create account
              </Link>
            </div>

            <hr className="my-3" />
            <div className="text-muted" style={{ fontSize: 12 }}>
              By continuing, you agree to FreshMart’s Terms & Privacy Policy.
            </div>

            
            <div className="mt-3 d-flex justify-content-between align-items-center" style={{ fontSize: 13 }}>
              <Link to="/help" className="text-success fw-semibold" style={{ textDecoration: "none" }}>
                Need help?
              </Link>
              <span className="text-muted">🔒 Secure checkout</span>
            </div>

            <div className="d-flex gap-3 mt-2 text-muted" style={{ fontSize: 12 }}>
              <span>🚚 Fast Delivery</span>
              <span>↩ Easy Returns</span>
              <span>💳 Secure Payments</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;