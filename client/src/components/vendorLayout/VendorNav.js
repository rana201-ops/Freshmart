import { Link, NavLink, useNavigate } from "react-router-dom";
import { useContext, useMemo } from "react";
import { AuthContext } from "../../context/AuthContext";

const statusMeta = (s) => {
  if (s === "approved") return { text: "Approved", cls: "success" };
  if (s === "pending_review") return { text: "Under Review", cls: "warning", dark: true };
  if (s === "rejected") return { text: "Rejected", cls: "danger" };
  return { text: "Draft", cls: "secondary" };
};

const VendorNav = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const vendorStatus = user?.vendorStatus || "draft";
  const isApproved = vendorStatus === "approved";
  const meta = useMemo(() => statusMeta(vendorStatus), [vendorStatus]);

  const onLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const linkStyle = ({ isActive }) => ({
    textDecoration: "none",
    color: isActive ? "#198754" : "#212529",
    fontWeight: 700,
    padding: "8px 12px",
    borderRadius: 12,
    background: isActive ? "rgba(25,135,84,.12)" : "transparent",
    whiteSpace: "nowrap",
  });

  const onGoSettings = () => navigate("/vendor/settings");

  const DisabledNavBtn = ({ label }) => (
    <button
      type="button"
      onClick={onGoSettings}
      className="btn btn-link"
      style={{
        padding: "8px 12px",
        borderRadius: 12,
        textDecoration: "none",
        color: "#adb5bd",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
      title="Complete verification to unlock"
    >
      {label} 🔒
    </button>
  );

  const profileLabel = user?.shopName || user?.name || "Profile";

  return (
    <header className="shadow-sm bg-white sticky-top" style={{ borderBottom: "1px solid rgba(0,0,0,.06)" }}>
      <div className="container-fluid px-3 px-md-4">
        <div className="d-flex align-items-center justify-content-between py-2 gap-3 flex-wrap">
          {/* ✅ Brand (Admin jaisa left text) */}
          <Link to="/" className="text-decoration-none d-flex align-items-center">
            <div className="fw-bold" style={{ fontSize: 22, lineHeight: 1 }}>
              Green Leaf <span style={{ color: "#198754" }}>Grocer</span>
              <span className="text-muted" style={{ fontSize: 14, fontWeight: 700 }}> (Vendor)</span>
            </div>
          </Link>

          {/* Links */}
          <nav className="d-flex gap-2 align-items-center flex-wrap justify-content-center">
            <NavLink to="/vendor" end style={linkStyle}>
              Dashboard
            </NavLink>

            {isApproved ? (
              <>
                <NavLink to="/vendor/products" style={linkStyle}>
                  Products
                </NavLink>
                <NavLink to="/vendor/orders" style={linkStyle}>
                  Orders
                </NavLink>
              </>
            ) : (
              <>
                <DisabledNavBtn label="Products" />
                <DisabledNavBtn label="Orders" />
              </>
            )}

            <NavLink to="/vendor/settings" style={linkStyle}>
              Settings
            </NavLink>
          </nav>

          {/* Right */}
          <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
            <span className={`badge bg-${meta.cls} ${meta.dark ? "text-dark" : ""}`} style={{ borderRadius: 999 }}>
              {meta.text}
            </span>

            <div className="dropdown">
              <button
                className="btn btn-sm btn-outline-success dropdown-toggle"
                style={{ borderRadius: 999, fontWeight: 800 }}
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                title={user?.email}
              >
                {profileLabel}
              </button>

              <ul className="dropdown-menu dropdown-menu-end">
                <li className="px-3 py-2">
                  <div className="fw-semibold">Signed in</div>
                  <div className="text-muted" style={{ fontSize: 13 }}>
                    {user?.email}
                  </div>
                </li>

                <li><hr className="dropdown-divider" /></li>

                <li>
                  <button className="dropdown-item" onClick={onGoSettings}>
                    Store Settings
                  </button>
                </li>

                <li>
                  <button className="dropdown-item text-danger" onClick={onLogout}>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default VendorNav;
