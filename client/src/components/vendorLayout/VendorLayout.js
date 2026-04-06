import { useContext, useEffect } from "react";
import { Outlet } from "react-router-dom";
import VendorNav from "./VendorNav";
import { AuthContext } from "../../context/AuthContext";

const VendorLayout = () => {
  const { user, refreshUser } = useContext(AuthContext);

  useEffect(() => {
    if (user?.role === "vendor") {
      refreshUser();
    }
  }, [user?.role, refreshUser]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <VendorNav />

      <main style={{ flex: 1, padding: 20 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default VendorLayout;
