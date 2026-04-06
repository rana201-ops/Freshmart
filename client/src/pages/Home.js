
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate,useLocation } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import api from "../api";
import { ShopContext } from "../context/ShopContext";
import { useSearchParams } from "react-router-dom";



const BACKEND = process.env.REACT_APP_API_URL || "";
const getImg = (img) => {
  if (!img) return "https://via.placeholder.com/600x600?text=FreshMart";
  if (String(img).startsWith("http")) return img;
  if (String(img).startsWith("/uploads")) return BACKEND + img;
  const fileName = String(img).split("\\").pop().split("/").pop();
  return `${BACKEND}/uploads/${fileName}`;
};

const Home = () => {
  const CATEGORY_ICONS = {
  "fresh-fruits": "🍎",
  "green-vegetables": "🥬",
  "organic-dairy": "🥛",
  "healthy-staples": "🌾",
  "bakery": "🥐",
};
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loadingProducts,setLoadingProducts]=useState(true)
  const { addToCart, addToWishlist } = useContext(ShopContext);
  const location = useLocation();
const { user, openAuthModal } = useContext(AuthContext);
const [stats, setStats] = useState({ avgRating: 0, total: 0 });

  const [email, setEmail] = useState("");
  const [reviews, setReviews] = useState([]);

  const [trending, setTrending] = useState([]);

  const [toast, setToast] = useState("");
  const [params] = useSearchParams();
const success = params.get("success");
const emailFromUrl = params.get("email");
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  };

  const subscribe = async () => {
  try {
    if (!email.trim()) return showToast("Enter email ✉️");

    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!ok) return showToast("Enter valid email ❗");

    // PAYMENT START
    const res = await api.post("/api/subscription/create-subscription", {
      email: email.trim(),
    });

    // Redirect to Stripe payment page
    window.location.href = res.data.url;

  } catch (err) {
    showToast("Payment start failed ❌");
  }
};
  useEffect(() => {
  let mounted = true;

  (async () => {
    try {
      const res = await api.get("/api/categories");
      if(mounted) setCategories(res.data || []);
    } catch {
      if(mounted) setCategories([]);
    }
  })();

  return () => mounted = false;
}, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("/api/reviews/latest?limit=3");
        setReviews(r.data || []);
        const s = await api.get("/api/reviews/stats");
setStats(s.data || { avgRating: 0, total: 0 });
      } catch {
        setReviews([]);
      }
    })();
  }, []);


  useEffect(() => {
  if (success && emailFromUrl) {
    api.post("/api/subscribers/subscribe", {
      email: emailFromUrl,
    });

    showToast("Payment successful 🎉 Subscribed!");

    // URL clean
    window.history.replaceState({}, document.title, "/");
  }
}, [success, emailFromUrl]);

  useEffect(() => {
  (async () => {
    try {
      const p = await api.get("/api/products");
      const arr = Array.isArray(p.data) ? p.data : [];
      const shuffled = [...arr].sort(() => Math.random() - 0.5);
      setTrending(shuffled.slice(0, 8));
    } catch {
      setTrending([]);
    } finally {
      setLoadingProducts(false);
    }
  })();
}, []);

  const Stars = ({ rating }) => {
    const r = Math.max(0, Math.min(5, Number(rating || 0)));
    return (
      <div style={{ fontSize: 14, letterSpacing: 0.5 }}>
        {"⭐".repeat(r)}
        <span style={{ opacity: 0.35 }}>{"⭐".repeat(5 - r)}</span>
      </div>
    );
  };

  const COLORS = {
  primary: "#198754",
  primaryDark: "#157347",
  softHero: "#f2fbf6",
  lightGray: "#f6f8fa",
  surface: "#ffffff",
  border: "rgba(0,0,0,0.06)",
  muted: "#6b7280",
};

  const sectionWhite = {
  background: "#ffffff",
  padding: "50px 0",
};

const sectionGray = {
  background: "#f8f9fa",
  padding: "50px 0",
};
  return (
    <>
      {/* HERO (soft + clean) */}
    <section
  style={{
    background: `linear-gradient(180deg, ${COLORS.softHero} 0%, #ffffff 100%)`,
    minHeight: "90vh",
    display: "flex",
    alignItems: "center",
  }}
>
      <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <div className="d-flex flex-wrap gap-2 mb-3">
                <span className="badge text-bg-light border rounded-pill px-3 py-2 fw-semibold">
                  ✅ Fresh & Organic
                </span>
                <span className="badge text-bg-light border rounded-pill px-3 py-2 fw-semibold">
                  🚚 Fast Delivery
                </span>
                <span className="badge text-bg-light border rounded-pill px-3 py-2 fw-semibold">
                  ⭐ Verified Vendors
                </span>
              </div>

              <h1
                className="fw-bold"
                style={{
                  fontSize: "clamp(28px, 4vw, 46px)",
                  lineHeight: 1.08,
                  color: "#111827",
                }}
              >
                The Green Leaf Grocer —{" "}
                <span style={{ color: COLORS.primary }}>fresh groceries</span>{" "}
                delivered fast.
              </h1>

              <p className="mt-3" style={{ fontSize: 15, color: COLORS.muted }}>
                Fruits, vegetables, dairy & staples — sourced from trusted vendors
                and delivered to your doorstep.
              </p>

              <div className="d-flex flex-column flex-sm-row gap-2 mt-3">
                <Link to="/category/fresh-fruits" className="btn btn-success px-4">
                  Shop Now
                </Link>
                <Link to="/offers" className="btn btn-outline-success px-4">
                  View Offers
                </Link>
              </div>

              <div style={{ color: COLORS.muted, fontSize: 13 }} className="mt-3">
                ✔ Quality checked &nbsp; ✔ Easy returns &nbsp; ✔ Secure checkout
              </div>
            </div>

            <div className="col-lg-5">
              <div
                style={{
  height: "clamp(200px, 40vw, 360px)",
  borderRadius: 18,
  background:
    "url('https://www.ecommercenews.pe/wp-content/uploads/2023/10/freshmart.jpg') center/cover",
}}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES (alt section bg for separation) */}
      <section style={sectionWhite}>
        <div className="container">
          <h4 className="fw-bold mb-1" style={{ color: "#111827" }}>
            Shop Organic Categories
          </h4>
          <div style={{ color: COLORS.muted, fontSize: 13 }} className="mb-3">
            Choose what you need today
          </div>

          <div className="row g-3">
  {categories.map((c) => (
    <div className="col-6 col-md-4 col-lg-2" key={c._id}>
      <Link to={`/category/${c.slug}`} className="text-decoration-none">
        <div
          className="card text-center p-4 h-100"
          style={{
            borderRadius: 18,
            border: `1px solid ${COLORS.border}`,
            boxShadow: "0 8px 18px rgba(0,0,0,.06)",
            background: "#fff",
          }}
        >
          <div style={{ fontSize: 36 }}>
            {CATEGORY_ICONS[c.slug] || "🛒"}
          </div>

          <h6 className="mt-3 fw-semibold" style={{ color: "#111827" }}>
            {c.name}
          </h6>

          <small style={{ color: COLORS.muted }}>Explore →</small>
        </div>
      </Link>
    </div>
  ))}
</div>
        </div>
      </section>

      {/* TRENDING PRODUCTS */}
<section style={sectionGray}>
  <div className="container">

    <div className="d-flex justify-content-between align-items-end mb-3">
      <div>
        <h4 className="fw-bold mb-1" style={{ color: "#111827" }}>
          Products
        </h4>
        <div style={{ color: COLORS.muted, fontSize: 13 }}>
          Approved products from verified vendors
        </div>
      </div>

      <button
        className="btn btn-link fw-semibold"
        onClick={() => navigate("/search")}
        style={{ textDecoration: "none", color: COLORS.primary }}
      >
        Explore →
      </button>
    </div>

    <div className="row g-3">

      {loadingProducts ? (

        <div className="text-center py-5">
          Loading products...
        </div>

      ) : trending.length === 0 ? (

        <div className="text-center text-muted py-5">
          No products available
        </div>

      ) : (

        trending.map((p) => (
          <div className="col-6 col-md-4 col-lg-3" key={p._id}>

            <div
              className="card rounded-4 h-100 overflow-hidden"
              role="button"
              style={{
                cursor: "pointer",
                border: `1px solid ${COLORS.border}`,
                boxShadow: "0 10px 22px rgba(0,0,0,.07)",
                background: "#fff",
                transition: "transform .15s ease",
              }}
              onClick={() => navigate(`/product/${p._id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                const img = e.currentTarget.querySelector("img");
                if (img) img.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                const img = e.currentTarget.querySelector("img");
                if (img) img.style.transform = "scale(1)";
              }}
            >

              <div
                style={{
                  height: "clamp(140px, 20vw, 180px)",
                  background: "#f3f4f6"
                }}
                className="position-relative"
              >

                <img
                  src={getImg(p.image)}
                  alt={p.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.3s"
                  }}
                  onError={(e) =>
                    (e.currentTarget.src =
                      "https://via.placeholder.com/600x600?text=No+Image")
                  }
                />

                <button
                  className="btn btn-light btn-sm position-absolute"
                  style={{
                    top: 10,
                    right: 10,
                    borderRadius: 999,
                    border: `1px solid ${COLORS.border}`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();

                    if (!user) {
                      openAuthModal(
                        "Please login/register to save to Wishlist ❤️",
                        location.pathname
                      );
                      return;
                    }

                    addToWishlist(p);
                    showToast("Added to Wishlist ❤️");
                  }}
                >
                  ❤️
                </button>

              </div>

              <div className="p-3">

                <div
                  className="fw-semibold"
                  style={{
                    fontSize: 14,
                    lineHeight: 1.2,
                    color: "#111827",
                  }}
                >
                  {p.name}
                </div>

                <div
                  style={{ color: COLORS.muted, fontSize: 12 }}
                  className="mt-1"
                >
                  {p.qtyLabel || ""}
                </div>

                <div className="d-flex justify-content-between align-items-center mt-2">

                  <div
                    className="fw-bold"
                    style={{ color: COLORS.primary }}
                  >
                    ₹{p.price}
                  </div>

                  <button
                    className="btn btn-success btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();

                      if (!user) {
                        openAuthModal(
                          "Please login/register to add items to Cart 🛒",
                          location.pathname
                        );
                        return;
                      }

                      addToCart(p);
                      showToast("Added to Cart ✅");
                    }}
                  >
                    Add to cart
                  </button>

                </div>

                {p.vendorShopName && (
                  <div
                    style={{ color: COLORS.muted, fontSize: 12 }}
                    className="mt-1"
                  >
                    Sold by {p.vendorShopName}
                  </div>
                )}

              </div>

            </div>

          </div>
        ))

      )}

    </div>

  </div>
</section>

      {/* REVIEWS (alt bg for separation) */}
     <section style={sectionWhite}>
       <div className="container">
          <div className="text-center mb-4">

  <h4 className="fw-bold mb-1" style={{ color: "#111827" }}>
    What Customers Say
  </h4>

  <div style={{ fontSize: 14, color: COLORS.muted }}>
    ⭐ {stats.avgRating?.toFixed(1)} / 5 ({stats.total} reviews)
  </div>

  <p className="mb-0" style={{ color: COLORS.muted }}>
    Latest verified reviews ⭐
  </p>

</div>

          {reviews.length === 0 ? (
            <div
              className="alert text-center rounded-4 mb-0"
              style={{
                background: "#fff",
                border: `1px solid ${COLORS.border}`,
                color: COLORS.muted,
              }}
            >
              No reviews yet. After delivery, customers can add reviews from My Orders.
            </div>
          ) : (
            <div className="row g-4 justify-content-center">
              {reviews.map((r) => (
                <div className="col-12 col-md-6 col-lg-4" key={r._id}>
                  <div
                    className="card rounded-4 h-100"
                    style={{
                      border: `1px solid ${COLORS.border}`,
                      boxShadow: "0 10px 22px rgba(0,0,0,.07)",
                      background: "#fff",
                    }}
                  >
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div
                            className="fw-semibold text-capitalize"
                            style={{ color: "#111827" }}
                          >
                            {r.userName || "Customer"}
                          </div>
                          <small
                            style={{ color: COLORS.muted }}
                            className="d-block"
                          >
                            {r.vendorShopName
                              ? `Bought from ${r.vendorShopName}`
                              : "Verified purchase"}
                          </small>
                        </div>

                        <span className="badge bg-success rounded-pill px-3 py-2">
                          Verified
                        </span>
                      </div>

                      <div className="mt-2">
                        <Stars rating={r.rating} />
                      </div>

                      {r.productName && (
                        <div style={{ color: COLORS.muted }} className="small mt-2">
                          Product: <b>{r.productName}</b>
                        </div>
                      )}

                      <p
                        style={{
                          color: COLORS.muted,
                          fontSize: 14,
                          lineHeight: 1.6,
                        }}
                        className="mt-3 mb-0"
                      >
                        “{r.comment}”
                      </p>

                      <div style={{ color: COLORS.muted }} className="small mt-3">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="text-center mt-4">
  <Link to="/reviews" className="btn btn-outline-success">
    View All Reviews
  </Link>
</div>
        </div>
      </section>

      

      {/* FOOTER */}
{/* FOOTER */}
<footer
  style={{
    background: "linear-gradient(135deg,#0f172a,#1f2937)",
    color: "#e5e7eb",
    padding: "60px 0 25px"
  }}
>

<div className="container">

{/* Newsletter */}
<div className="text-center mb-5">
  <p style={{ textAlign: "center", fontSize: 15, color: "#9ca3af" }}>
  Subscribe for just <b style={{ color: "#22c55e" }}>₹49/month</b> 🎉
</p>
{success && (
  <div style={{ color: "#22c55e", marginBottom: 10 }}>
    🎉 You are now subscribed!
  </div>
)}
<h5 className="fw-bold text-white mb-3">
Get fresh deals & grocery updates 📩
</h5>

<div className="d-flex flex-column flex-sm-row justify-content-center gap-2">

<input
className="form-control"
style={{maxWidth:420}}
placeholder="Enter your email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
/>

<button className="btn btn-success px-4" onClick={subscribe}>
Subscribe
</button>

</div>

</div>

<hr style={{borderColor:"rgba(255,255,255,0.1)"}}/>

<div className="row g-4 mt-3">

{/* Brand */}
<div className="col-md-4">

<h5 className="fw-bold text-white">
FreshMart
</h5>

<p style={{fontSize:14}}>
Fresh groceries delivered to your doorstep.
Quality fruits, vegetables, dairy and daily essentials
from trusted vendors.
</p>

{/* Social Icons */}
<div className="mt-3 d-flex gap-3">

<a href="/" onClick={(e)=>e.preventDefault()}>📘</a>
<a href="/" onClick={(e)=>e.preventDefault()}>📸</a>
<a href="/" onClick={(e)=>e.preventDefault()}>🐦</a>
<a href="/" onClick={(e)=>e.preventDefault()}>🌐</a>

</div>

</div>

{/* Customer */}
<div className="col-md-4">

<h6 className="text-white mb-3">
Customer
</h6>

<ul className="list-unstyled small">

<li>
<Link to="/help" className="text-decoration-none text-light">
Help Center
</Link>
</li>

<li>
<Link to="/my-orders" className="text-decoration-none text-light">
Track Orders
</Link>
</li>

<li>
<Link to="/wishlist" className="text-decoration-none text-light">
Wishlist
</Link>
</li>

<li>
<Link to="/offers" className="text-decoration-none text-light">
Offers
</Link>
</li>

</ul>

</div>

{/* Legal */}
<div className="col-md-4">

<h6 className="text-white mb-3">
Legal
</h6>

<ul className="list-unstyled small">

<li>
<Link to="/privacy" className="text-decoration-none text-light">
Privacy Policy
</Link>
</li>

<li>
<Link to="/terms" className="text-decoration-none text-light">
Terms & Conditions
</Link>
</li>

</ul>

{/* Payment icons */}
<div className="mt-3">

<div className="small text-muted mb-1">
Secure Payments
</div>

<div style={{fontSize:22}}>
💳 🪙 📱
</div>

</div>

</div>

</div>

<hr style={{borderColor:"rgba(255,255,255,0.1)"}}/>



</div>

</footer>
      {/* TOAST */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            background: COLORS.primary,
            color: "#fff",
            padding: "10px 16px",
            borderRadius: 12,
            boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
            zIndex: 9999,
            fontWeight: 700,
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
};

export default Home;