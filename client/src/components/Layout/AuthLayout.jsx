import { Outlet, Link } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, #f7fbff 0%, #ffffff 60%)",
      }}
    >
      {/* Logo */}
      <header
        style={{
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <Link to="/" className="text-decoration-none">
          <span style={{ fontSize: 34, fontWeight: 800 }}>
            Fresh<span style={{ color: "#198754" }}>Mart</span>
          </span>
        </Link>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer
        style={{
          height: 64,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          fontSize: 13,
          color: "#6b7280",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          background: "rgba(255,255,255,0.8)",
        }}
      >
        <div>© {new Date().getFullYear()} FreshMart</div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/privacy" style={{ color: "#198754", textDecoration: "none" }}>
            Privacy
          </Link>
          <span>•</span>
          <Link to="/terms" style={{ color: "#198754", textDecoration: "none" }}>
            Terms
          </Link>
          <span>•</span>
          <Link to="/help" style={{ color: "#198754", textDecoration: "none" }}>
            Help
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;