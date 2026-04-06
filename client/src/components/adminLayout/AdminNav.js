import { Link, NavLink } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

const AdminNav = () => {
  const { user, logout } = useContext(AuthContext);

  const style = ({ isActive }) => ({
    textDecoration: "none",
    color: isActive ? "#198754" : "#212529",
    fontWeight: isActive ? "600" : "400",
  });

  return (
    <header className="shadow-sm bg-white">
      <div className="container d-flex justify-content-between align-items-center py-2">
        <Link
          to="/admin"
          className="fw-bold fs-4 text-decoration-none text-dark"
        >
          Green Leaf <span className="text-success">Grocer</span>{" "}
          <span className="fs-6">(Admin)</span>
        </Link>

        <nav className="d-flex gap-4">
          <NavLink to="/admin" end style={style}>
            Dashboard
          </NavLink>

          <NavLink to="/admin/products" style={style}>
            Products
          </NavLink>

          {/* ✅ NEW */}
          <NavLink to="/admin/product-names" style={style}>
            Product Names
          </NavLink>
        </nav>

        <div className="d-flex gap-3 align-items-center">
          <small className="text-muted">{user?.email}</small>
          <button className="btn btn-sm btn-outline-danger" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminNav;
