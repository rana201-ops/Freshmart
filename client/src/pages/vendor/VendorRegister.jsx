import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const VendorRegister = () => {
  const [data, setData] = useState({
    name: "",
    shopName: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { signup } = useContext(AuthContext);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const name = data.name.trim();
    const shopName = (data.shopName || "").trim();
    const email = data.email.trim().toLowerCase();
    const password = data.password;
    const confirm = data.confirm;

    if (!name || !shopName || !email || !password || !confirm) return setError("Please fill all fields.");
    if (!email.includes("@") || !email.includes(".")) return setError("Enter a valid email.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    if (email === "admin@gmail.com") return setError("Admin cannot signup here.");

    try {
      setLoading(true);
      await signup(name, email, password, "vendor", shopName);
      navigate("/vendor/login", { replace: true, state: { email } });
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
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 20% 10%, rgba(25,135,84,.12), transparent 60%), radial-gradient(900px 500px at 90% 20%, rgba(13,110,253,.10), transparent 55%), linear-gradient(180deg, #f6fff8 0%, #ffffff 70%)",
        paddingTop: 56,
        paddingBottom: 56,
      }}
    >
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="text-center mb-3">
          <div className="fw-bold" style={{ fontSize: 34, letterSpacing: 0.2 }}>
            Fresh<span className="text-success">Mart</span>
          </div>
          <div className="text-muted" style={{ fontSize: 13 }}>
            Start selling on FreshMart
          </div>
        </div>

        <div className="card shadow border-0 rounded-4 overflow-hidden">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">Create Vendor Account</h5>
            <p className="text-muted mb-3" style={{ fontSize: 13 }}>
              Next step: complete settings for admin approval.
            </p>

            {error && <div className="alert alert-danger py-2">{error}</div>}

            <form onSubmit={submit} autoComplete="on">
              <label className="form-label">Owner Name</label>
              <input
                className="form-control mb-3"
                placeholder="Enter your name"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                required
              />

              <label className="form-label">Shop / Business Name</label>
              <input
                className="form-control mb-3"
                placeholder="e.g., Patel Grocery Mart"
                value={data.shopName}
                onChange={(e) => setData({ ...data, shopName: e.target.value })}
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
                {loading ? "Creating..." : "Create Vendor Account"}
              </button>
            </form>

           {/* Already have account */}
<div className="d-flex justify-content-between align-items-center mt-3">
  <span className="text-muted" style={{ fontSize: 13 }}>
    Already a vendor?
  </span>

  <Link
    to="/vendor/login"
    className="fw-semibold"
    style={{ color: "#198754", textDecoration: "none" }}
  >
    Login →
  </Link>
</div>

            <hr className="my-3" />
            <div className="text-muted" style={{ fontSize: 12 }}>
              By continuing, you agree to FreshMart’s Terms & Privacy Policy.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorRegister;
