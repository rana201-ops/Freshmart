import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import AuthGateModal from "../common/AuthGateModal";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./NavBar";
import Footer from "./Footer";

const UserLayout = () => {
  const { pathname } = useLocation();

  // ✅ Vendor routes par User Navbar/Footer hide
  const isVendorRoute = pathname.startsWith("/vendor");
    const navigate = useNavigate();
  const { authModal, closeAuthModal } = useContext(AuthContext);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {!isVendorRoute && <Navbar />}

      {/* ✅ NO global padding here (prevents huge white gaps) */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {!isVendorRoute && <Footer />}
      <AuthGateModal
  open={authModal.open}
  message={authModal.message}
  onClose={closeAuthModal}
  onLogin={() => {
    closeAuthModal();
    navigate("/login", {
      state: {
        from: authModal.from,
        msg: authModal.message,
      },
    });
  }}
  onSignup={() => {
    closeAuthModal();
    navigate("/signup", {
      state: {
        from: authModal.from,
        msg: authModal.message,
      },
    });
  }}
/>
    </div>
    
  );
};


export default UserLayout;
