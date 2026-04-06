import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const VendorLogin = () => {
  const [data, setData] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const { login, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const email = (data.email || "").trim().toLowerCase();
    const password = data.password || "";
    if (!email || !password) return setError("Please enter email and password.");

    try {
      const result = await login(email, password);
      const role = result?.user?.role;

      if (role !== "vendor") {
        logout();
        return setError("This is a customer account. Please login from Navbar.");
      }

      navigate("/vendor", { replace: true });
    } catch (err) {
      if (!err?.response) setError("Server not reachable. Check backend.");
      else setError(err?.response?.data?.msg || "Login failed");
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
            Vendor Portal
          </div>
        </div>

        <div className="card shadow border-0 rounded-4 overflow-hidden">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">Vendor Login</h5>
            <p className="text-muted mb-3" style={{ fontSize: 13 }}>
              Login to manage products and orders.
            </p>

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

<div className="text-end mb-3">
  <Link
    to="/forgot-password"
    className="text-success fw-semibold"
    style={{ fontSize: 13, textDecoration: "none" }}
  >
    Forgot password?
  </Link>
</div>

              <button type="submit" className="btn btn-success w-100">
                Continue to Vendor Panel
              </button>
            </form>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <span className="text-muted" style={{ fontSize: 13 }}>
                New vendor?
              </span>
              <Link to="/vendor/register" className="fw-semibold text-success">
                Create vendor account
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

export default VendorLogin;
