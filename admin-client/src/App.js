import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./components/adminLayout/AdminLayout";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageProducts from "./pages/admin/ManageProducts";
import ManageVendors from "./pages/admin/ManageVendors";
import ManageOrders from "./pages/admin/ManageOrders";
import ManageOffers from "./pages/admin/ManageOffers";
import ProductNames from "./pages/admin/ProductNames";
import AdminSubscribers from "./pages/admin/AdminSubscribers"; // ✅ NEW
import ManageCategories from "./pages/admin/ManageCategories";

import ProtectedRoute from "./ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ public */}
        <Route path="/login" element={<AdminLogin />} />

        {/* ✅ protected + layout */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/products" element={<ManageProducts />} />
          <Route path="/vendors" element={<ManageVendors />} />
          <Route path="/orders" element={<ManageOrders />} />
          <Route path="/offers" element={<ManageOffers />} />
          <Route path="/product-names" element={<ProductNames />} />
          <Route path="/admin/categories" element={<ManageCategories />} />
          
          {/* ✅ NEW ROUTE */}
          <Route path="/subscribers" element={<AdminSubscribers />} />
        </Route>

        {/* ✅ default route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* ✅ fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
