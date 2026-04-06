import React from "react";
import AdminNav from "./AdminNav";
import { Outlet } from "react-router-dom";

const AdminLayout = ({ children }) => {
  return (
    <>
      <AdminNav />

      {/* ✅ Content area shifted */}
      <div
        className="container-fluid"
        style={{
  marginLeft: "240px",
  padding: "20px",
  width: "calc(100% - 240px)"
}}
      >
        {children ? children : <Outlet />}
      </div>
    </>
  );
};

export default AdminLayout;
