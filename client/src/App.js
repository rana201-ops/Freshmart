
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Routes, Route } from "react-router-dom";

import AuthLayout from "./components/Layout/AuthLayout";
import UserLayout from "./components/Layout/UserLayout";
import VendorLayout from "./components/vendorLayout/VendorLayout";
import ProtectedRoute from "./components/Layout/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Search from "./pages/Search";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Category from "./pages/Category";
import Products from "./pages/Products";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Offers from "./pages/Offers";
import MyOrders from "./pages/MyOrders";
import Unsubscribe from "./pages/Unsubscribe";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Help from "./pages/Help";
import ProductDetails from "./pages/ProductDetails";
import Success from "./pages/Success";

import VendorLogin from "./pages/vendor/VendorLogin";
import VendorRegister from "./pages/vendor/VendorRegister";

import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorSettings from "./pages/vendor/VendorSettings";

const stripePromise = loadStripe("pk_test_51T6Urq2NiWrORt0wYKzl94hsRkGtLuJaXYxnHNvU4jhwngGHIY6BHvztHHrp6SRD9lUj7mbjRqEnMsZNySyTM8Pm00nLeLueBI");

function App() {
  return (
    <>
      <ScrollToTop />

      {/* ✅ STRIPE WRAPPER START */}
      <Elements stripe={stripePromise}>
        <Routes>

          {/* VENDOR AUTH */}
          <Route path="/vendor/login" element={<VendorLogin />} />
          <Route path="/vendor/register" element={<VendorRegister />} />

          {/* USER AUTH */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/help" element={<Help />} />
          </Route>
            <Route path="/success" element={<Success />} />
          {/* USER AREA */}
          <Route element={<UserLayout />}>

            <Route path="/" element={<Home />} />

            <Route path="offers" element={<Offers />} />

            <Route path="product/:id" element={<ProductDetails />} />

            <Route path="category/:name" element={<Category />} />
            <Route path="category/:name/:subCategory" element={<Products />} />

            <Route path="search" element={<Search />} />

            <Route
              path="cart"
              element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <Cart />
                </ProtectedRoute>
              }
            />

            <Route
              path="wishlist"
              element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <Wishlist />
                </ProtectedRoute>
              }
            />

            <Route
              path="checkout"
              element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <Checkout />
                </ProtectedRoute>
              }
            />

            <Route
              path="my-orders"
              element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <MyOrders />
                </ProtectedRoute>
              }
            />

            <Route path="order-success" element={<OrderSuccess />} />
        

            <Route path="unsubscribe" element={<Unsubscribe />} />

          </Route>

          {/* VENDOR AREA */}
          <Route
            path="/vendor"
            element={
              <ProtectedRoute allowedRoles={["vendor"]}>
                <VendorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<VendorDashboard />} />
            <Route path="products" element={<VendorProducts />} />
            <Route path="orders" element={<VendorOrders />} />
            <Route path="settings" element={<VendorSettings />} />
          </Route>

        </Routes>
      </Elements>
      {/* ✅ STRIPE WRAPPER END */}

    </>
  );
}

export default App;