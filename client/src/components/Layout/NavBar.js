/// Navbar.jsx
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "../../context/AuthContext";
import { ShopContext } from "../../context/ShopContext";
import logo from "../../assets/image.png";
import api from "../../api";
const EMPTY_ARR = [];



const Navbar = () => {
  const [categories, setCategories] = useState([]);

  const [openCat, setOpenCat] = useState(false);
  const [openAcc, setOpenAcc] = useState(false);
  const [hoverKey, setHoverKey] = useState(null);
  const [q, setQ] = useState("");
  const [scrolled, setScrolled] = useState(false); // ✅ NEW (UI only)

  const dropdownRef = useRef(null);
  const accRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const auth = useContext(AuthContext);
  const shop = useContext(ShopContext);

  const user = auth?.user || null;
  const logout = auth?.logout || (() => {});
  const cart = shop?.cart ?? EMPTY_ARR;
const wishlist = shop?.wishlist ?? EMPTY_ARR;
  const clearCart = shop?.clearCart || (() => {});
  const clearWishlist = shop?.clearWishlist || (() => {});

  const role = user?.role || null;
const isUser = role === "user";
const isVendor = role === "vendor";

  useEffect(() => {
    setOpenCat(false);
    setOpenAcc(false);
  }, [location]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpenCat(false);
      if (accRef.current && !accRef.current.contains(e.target)) setOpenAcc(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ✅ NEW: shadow only on scroll (UI only)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
  let mounted = true;

  api.get("/api/categories")
    .then(res => {
      if (mounted) setCategories(res.data || []);
    })
    .catch(() => mounted && setCategories([]));

  return () => { mounted = false };
}, []);

  const navStyle = (isActive, key) => {
    const isHover = hoverKey === key;
    const on = isActive || isHover;
    return {
      borderRadius: 999,
      padding: "8px 12px",
      transition: "all 0.18s ease",
      color: on ? "#198754" : "#212529",
      background: on ? "rgba(25,135,84,0.12)" : "transparent",
      fontWeight: isActive ? 800 : 650,
      whiteSpace: "nowrap",
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      position: "relative",
      lineHeight: 1,
    };
  };

  const cartCount = useMemo(() => {
   return (cart || []).reduce((sum, it) => sum + Number(it.cartQty ?? 1), 0);
  }, [cart]);

  const wishCount = useMemo(() => (wishlist || []).length, [wishlist]);

  const onSearch = (e) => {
    e.preventDefault();
    const query = q.trim().replace(/\s+/g," ");
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setQ("");
  };

  const Badge = ({ count, color = "bg-success" }) => {
    if (!count) return null;
    return (
      <span
        className={`badge ${color}`}
        style={{
          position: "absolute",
          top: -8,
          right: -10,
          borderRadius: 999,
          fontSize: 10,
          padding: "3px 5px",
          border: "2px solid #fff",
          lineHeight: 1,
          minWidth: 18,
          textAlign: "center",
        }}
      >
        {count}
      </span>
    );
  };

  return (
    <nav
      className="bg-white sticky-top"
      style={{
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        boxShadow: scrolled ? "0 10px 30px rgba(0,0,0,0.10)" : "none",
        transition: "box-shadow 0.2s ease",
      }}
    >
      {/* tighter padding */}
      <div className="container-fluid" style={{ padding: "10px 20px" }}>
        {/* Desktop grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            alignItems: "center",
            columnGap: 18,
            width: "100%",
            minHeight: 60,
          }}
        >
          {/* LEFT */}
          <div className="d-flex align-items-center" style={{ gap: 14 }}>
            <Link
              to="/"
              className="d-flex align-items-center text-decoration-none"
              style={{ gap: 8 }}
            >
              <img
                src={logo}
                alt="FreshMart"
                style={{
                  width: 36,
                  height: 36,
                  objectFit: "contain",
                  display: "block",
                }}
              />
              {/* ✅ Brand text (UI only) */}
              <span
                style={{
                  fontWeight: 900,
                  fontSize: 18,
                  color: "#198754",
                  letterSpacing: 0.3,
                  lineHeight: 1,
                }}
              >
                FreshMart
              </span>
            </Link>

            {/* Categories dropdown (desktop) */}
            <div className="dropdown d-none d-md-block" ref={dropdownRef} style={{ position: "relative" }}>
              <button
                className="btn btn-light btn-sm"
                style={{
                  borderRadius: 999,
                  fontWeight: 800,
                  padding: "10px 14px",
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "#fff",
                  height: 44,
                  display: "inline-flex",
                  alignItems: "center",
                }}
                onClick={() => setOpenCat((p) => !p)}
                type="button"
              >
                Categories <span style={{ opacity: 0.7, marginLeft: 6 }}>▾</span>
              </button>

              <ul
  className={`dropdown-menu ${openCat ? "show" : ""}`}
  style={{
    display: openCat ? "block" : "none",
    position: "absolute",
    top: "112%",
    left: 0,
    minWidth: 240,
    borderRadius: 14,
    padding: 8,
    border: "1px solid rgba(0,0,0,0.08)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.10)"
  }}
>
  {categories.length === 0 ? (
    <li className="dropdown-item text-muted">No categories</li>
  ) : (
    categories.map((cat) => (
      <li key={cat.slug}>
        <button
          className="dropdown-item"
         onClick={() => {
  navigate(`/category/${cat.slug}`)
  document.querySelector("#fmMobileMenu")?.classList.remove("show")
}}
        >
          {cat.name}
        </button>
      </li>
    ))
  )}
</ul>
            </div>
          </div>

          {/* CENTER SEARCH (desktop only) */}
          <div className="d-none d-md-block" style={{ width: "100%" }}>
            <form onSubmit={onSearch}>
              <div className="input-group" style={{ maxWidth: 720, margin: "0 auto" }}>
                <input
                  className="form-control"
                  placeholder="Search fruits, vegetables, dairy..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  style={{
                    borderRadius: "999px 0 0 999px",
                    height: 44,
                    border: "1px solid rgba(0,0,0,0.10)",
                    paddingLeft: 14,
                    boxShadow: "none",
                  }}
                />
                <button
                  className="btn btn-success"
                  type="submit"
                  style={{
                    borderRadius: "0 999px 999px 0",
                    fontWeight: 850,
                    padding: "0 16px",
                    height: 44,
                    minWidth: 96, // ✅ compact
                  }}
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT LINKS (desktop) */}
          <div className="d-none d-md-flex align-items-center" style={{ gap: 16, justifyContent: "flex-end" }}>
            <NavLink
              to="/offers"
              style={({ isActive }) => navStyle(isActive, "offers")}
              onMouseEnter={() => setHoverKey("offers")}
              onMouseLeave={() => setHoverKey(null)}
            >
              Offers
            </NavLink>

            {(!user || user.role !== "vendor") && (
              <>
                <NavLink
                  to="/wishlist"
                  style={({ isActive }) => navStyle(isActive, "wishlist")}
                  onMouseEnter={() => setHoverKey("wishlist")}
                  onMouseLeave={() => setHoverKey(null)}
                >
                  <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    Wishlist
                    <Badge count={wishCount} color="bg-danger" />
                  </span>
                </NavLink>

                <NavLink
                  to="/cart"
                  style={({ isActive }) => navStyle(isActive, "cart")}
                  onMouseEnter={() => setHoverKey("cart")}
                  onMouseLeave={() => setHoverKey(null)}
                >
                  <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    Cart
                    <Badge count={cartCount} color="bg-success" />
                  </span>
                </NavLink>

                {isUser && (
                  <NavLink
                    to="/my-orders"
                    style={({ isActive }) => navStyle(isActive, "myorders")}
                    onMouseEnter={() => setHoverKey("myorders")}
                    onMouseLeave={() => setHoverKey(null)}
                  >
                    My Orders
                  </NavLink>
                )}
                {/* Sell on FreshMart (hide only for vendor) */}
{(!user || user.role !== "vendor") && (
  <NavLink
    to="/vendor/login"
    style={({ isActive }) => navStyle(isActive, "sell")}
    onMouseEnter={() => setHoverKey("sell")}
    onMouseLeave={() => setHoverKey(null)}
  >
    Sell on FreshMart
  </NavLink>
)}
              </>
            )}

            {/* Account dropdown (desktop) */}
            <div ref={accRef} style={{ position: "relative" }}>
              <button
                className="btn btn-outline-success btn-sm"
                style={{
                  borderRadius: 999,
                  fontWeight: 850,
                  padding: "10px 14px",
                  height: 44,
                  display: "inline-flex",
                  alignItems: "center",
                }}
                onClick={() => setOpenAcc((p) => !p)}
                type="button"
              >
                {user ? user.name || "Account" : "Account"} <span style={{ opacity: 0.7, marginLeft: 6 }}>▾</span>
              </button>

              <div
                className="dropdown-menu dropdown-menu-end"
                style={{
                  display: openAcc ? "block" : "none",
                  position: "absolute",
                  top: "112%",
                  right: 0,
                  minWidth: 240,
                  borderRadius: 14,
                  padding: 8,
                  border: "1px solid rgba(0,0,0,0.08)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
                }}
              >
                {!user ? (
                  <>
                    <button className="dropdown-item" onClick={() => navigate("/login")} style={{ borderRadius: 12 }}>
                      Login
                    </button>
                    <button className="dropdown-item" onClick={() => navigate("/signup")} style={{ borderRadius: 12 }}>
                      Signup
                    </button>
                  </>
                ) : (
                  <>
                    {user.role === "vendor" && (
                      <button className="dropdown-item" onClick={() => navigate("/vendor")} style={{ borderRadius: 12 }}>
                        Vendor Dashboard
                      </button>
                    )}
                    {user?.lastLogin && (
  <div
    style={{
      padding: "8px 12px",
      fontSize: 12,
      color: "#6c757d"
    }}
  >
    Last login: {new Date(user.lastLogin).toLocaleString()}
  </div>
)}
                    <div className="dropdown-divider" />
                    <button
                      className="dropdown-item text-danger"
                      onClick={() => {
                        setOpenAcc(false);
                        clearCart();
                        clearWishlist();
                        logout();
navigate("/", { replace: true });   // ✅ home page
                      }}
                      style={{ borderRadius: 12, fontWeight: 750 }}
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            className="btn btn-light btn-sm d-md-none"
            style={{
              justifySelf: "end",
              borderRadius: 12,
              padding: "10px 12px",
              border: "1px solid rgba(0,0,0,0.08)",
              background: "#fff",
              height: 44,
            }}
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#fmMobileMenu"
            aria-controls="fmMobileMenu"
          >
            ☰
          </button>
        </div>

        {/* MOBILE SEARCH ROW ONLY */}
        <div className="mt-2 d-md-none">
          <form onSubmit={onSearch}>
            <div className="input-group">
              <input
                className="form-control"
                placeholder="Search fruits, vegetables, dairy..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ borderRadius: "14px 0 0 14px", height: 44 }}
              />
              <button
                className="btn btn-success"
                type="submit"
                style={{ borderRadius: "0 14px 14px 0", fontWeight: 850, height: 44, minWidth: 92 }}
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* MOBILE OFFCANVAS MENU */}
      <div
  className="offcanvas offcanvas-end"
  tabIndex="-1"
  id="fmMobileMenu"
  style={{ width: "85%", maxWidth: "380px" }}
>
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="fmMobileMenuLabel">
            Menu
          </h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" />
        </div>

        <div className="offcanvas-body d-flex flex-column gap-2">
          <div className="fw-semibold text-muted mb-1">Categories</div>
        {categories.length === 0 ? (
  <div className="text-muted">No categories</div>
) : (
  categories.map((cat) => (
    <button
      key={cat.slug}
     className="btn btn-light text-start py-2"
      onClick={() => navigate(`/category/${cat.slug}`)}
    >
      {cat.name}
    </button>
  ))
)}

          <hr className="my-3" />

          <button
            className="btn btn-light text-start"
            data-bs-dismiss="offcanvas"
            onClick={() => navigate("/offers")}
            style={{ borderRadius: 12 }}
          >
            Offers
          </button>

         {!isVendor && (
            <>
              <button
                className="btn btn-light text-start"
                data-bs-dismiss="offcanvas"
                onClick={() => navigate("/wishlist")}
                style={{ borderRadius: 12 }}
              >
                Wishlist ({wishCount})
              </button>
              <button
                className="btn btn-light text-start"
                data-bs-dismiss="offcanvas"
                onClick={() => navigate("/cart")}
                style={{ borderRadius: 12 }}
              >
                Cart ({cartCount})
              </button>
              {isUser && (
                <button
                  className="btn btn-light text-start"
                  data-bs-dismiss="offcanvas"
                  onClick={() => navigate("/my-orders")}
                  style={{ borderRadius: 12 }}
                >
                  My Orders
                </button>
              )}
              {!isVendor && (
  <button
    className="btn btn-light text-start"
    data-bs-dismiss="offcanvas"
    onClick={() => navigate("/vendor/login")}
    style={{ borderRadius: 12 }}
  >
    Sell on FreshMart
  </button>
)}
            </>
          )}

          <hr className="my-3" />

          {!user ? (
            <>
              <button
                className="btn btn-outline-success"
                data-bs-dismiss="offcanvas"
                onClick={() => navigate("/login")}
                style={{ borderRadius: 12 }}
              >
                Login
              </button>
              <button
                className="btn btn-success"
                data-bs-dismiss="offcanvas"
                onClick={() => navigate("/signup")}
                style={{ borderRadius: 12 }}
              >
                Signup
              </button>
            </>
          ) : (
            <>
              {user.role === "vendor" && (
                <button
                  className="btn btn-outline-secondary"
                  data-bs-dismiss="offcanvas"
                  onClick={() => navigate("/vendor")}
                  style={{ borderRadius: 12 }}
                >
                  Vendor Dashboard
                </button>
              )}
              <button
                className="btn btn-outline-danger"
                data-bs-dismiss="offcanvas"
                onClick={() => {
                  clearCart();
                  clearWishlist();
                  logout();
navigate("/", { replace: true });
                }}
                style={{ borderRadius: 12 }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;