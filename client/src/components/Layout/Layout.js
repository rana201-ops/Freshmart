import React from "react";
import NavBar from "./NavBar";
import Footer from "./Footer";

const Layout = ({ children }) => {
  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column" 
    }}>
      <NavBar />

      <main style={{ flex: 1, padding: "20px" }}>
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default Layout;


