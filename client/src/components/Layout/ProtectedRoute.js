import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Not logged in
  if (!user) {
    // ✅ Vendor routes pe logout -> home
    if (allowedRoles.includes("vendor")) {
      return <Navigate to="/" replace />;
    }

    // ✅ User-only routes -> login (cart/wishlist/checkout)
    return (
  <Navigate
    to="/login"
    replace
    state={{
      from: location.pathname,
      msg: "Please login / register to continue 🛒",
    }}
  />
);
  }

  // Logged in but role not allowed
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "vendor") return <Navigate to="/vendor" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
