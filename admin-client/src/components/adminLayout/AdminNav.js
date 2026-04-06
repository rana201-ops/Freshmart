import { NavLink, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Tag,
  List,
  Mail,
  Layers
} from "lucide-react";

const AdminNav = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("freshmart_token");
    localStorage.removeItem("freshmart_user");
    logout();
    navigate("/login");
  };

 const linkClass = ({ isActive }) =>
  `d-flex align-items-center gap-2 px-3 py-2 rounded transition ${
    isActive
      ? "bg-success text-white shadow-sm"
      : "text-dark hover-bg"
  } text-decoration-none fw-semibold`;
  return (
    <div
     style={{
  width: "240px",
  height: "100vh",
  position: "fixed",
  left: 0,
  top: 0,
  background: "linear-gradient(180deg, #ffffff, #f8f9fa)",
  borderRight: "1px solid #eee",
  padding: "20px",
  boxShadow: "2px 0 10px rgba(0,0,0,0.05)"
}}
    >
      {/* Logo */}
      <div className="mb-4">
      <h5 className="fw-bold mb-1">
          Green Leaf <span className="text-success">Grocer</span>
        </h5>
        <small className="text-muted">Admin Panel</small>
      </div>

      {/* Menu */}
      <div className="d-flex flex-column gap-2">

        <NavLink to="/dashboard" className={linkClass}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>

        <NavLink to="/products" className={linkClass}>
          <Package size={18} /> Products
        </NavLink>

        <NavLink to="/vendors" className={linkClass}>
          <Users size={18} /> Vendors
        </NavLink>

        <NavLink to="/orders" className={linkClass}>
          <ShoppingCart size={18} /> Orders
        </NavLink>

        <NavLink to="/offers" className={linkClass}>
          <Tag size={18} /> Offers
        </NavLink>

        <NavLink to="/product-names" className={linkClass}>
          <List size={18} /> Product Names
        </NavLink>

        <NavLink to="/admin/categories" className={linkClass}>
          <Layers size={18} /> Categories
        </NavLink>

        <NavLink to="/subscribers" className={linkClass}>
          <Mail size={18} /> Newsletter
        </NavLink>

      </div>

      {/* Bottom */}
      <div className="mt-auto pt-4">
        <div className="text-muted small mb-2">{user?.email}</div>

        <button
          className="btn btn-outline-danger btn-sm w-100"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminNav;