import { useEffect, useState, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Signup = () => {
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";
  const infoMsg = location.state?.msg || "";
  const { signup } = useContext(AuthContext);

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

    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    const password = data.password;
    const confirm = data.confirm;

    if (!name || !email || !password || !confirm) return setError("Please fill all fields.");
    if (!email.includes("@") || !email.includes(".")) return setError("Enter a valid email.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    if (email === "admin@gmail.com") return setError("Admin cannot signup here.");

    try {
      setLoading(true);
      await signup(name, email, password, "user");
      navigate("/login", {
        replace: true,
        state: { email, from, msg: infoMsg },
      });
    } catch (err) {
      if (!err?.response) setError("Server not reachable. Check backend.");
      else setError(err?.response?.data?.msg || "Signup failed");
    } finally {
      setLoading(false);
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
              <h5 className="fw-bold mb-0">Sign up</h5>
              <span className="text-muted" style={{ fontSize: 12 }}>
                ✅ Quick setup
              </span>
            </div>

            <p className="text-muted mb-3" style={{ fontSize: 13 }}>
              Signup to get offers, wishlist, and faster checkout.
            </p>

            {infoMsg && <div className="alert alert-warning py-2">{infoMsg}</div>}
            {error && <div className="alert alert-danger py-2">{error}</div>}

            <form onSubmit={submit} autoComplete="on">
              <label className="form-label">Full Name</label>
              <input
                className="form-control mb-3"
                placeholder="Enter your name"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                required
              />

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
              <input
                type="password"
                className="form-control mb-3"
                placeholder="Min 6 characters"
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
                required
              />

              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-control mb-3"
                placeholder="Re-enter password"
                value={data.confirm}
                onChange={(e) => setData({ ...data, confirm: e.target.value })}
                required
              />

              <button className="btn btn-success w-100" disabled={loading}>
                {loading ? "Creating..." : "Create account"}
              </button>
            </form>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <span className="text-muted" style={{ fontSize: 13 }}>
                Already have an account?
              </span>
              <Link
                to="/login"
                state={{ from, msg: infoMsg, email: data.email }}
                className="fw-semibold text-success"
              >
                Login
              </Link>
            </div>

            <hr className="my-3" />
            <div className="text-muted" style={{ fontSize: 12 }}>
              By signing up, you agree to FreshMart’s Terms & Privacy Policy.
            </div>

            {/* ✅ ecommerce feel */}
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

export default Signup;