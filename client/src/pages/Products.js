import { AuthContext } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import api from "../api";

const Products = () => {
  const { name, subCategory } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { user, openAuthModal } = useContext(AuthContext);
  const { addToCart, addToWishlist } = useContext(ShopContext);

  const [subCategories, setSubCategories] = useState([]);
  const [activeSub, setActiveSub] = useState(subCategory || "");
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedQty, setSelectedQty] = useState({});
  const [hoverCardId, setHoverCardId] = useState(null); // ✅ UI only

  const BACKEND = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const getImg = (img) => {
    if (!img) return "https://via.placeholder.com/600x600?text=FreshMart";
    if (String(img).startsWith("http")) return img;
    if (String(img).startsWith("/uploads")) return BACKEND + img;
    const fileName = String(img).split("\\").pop().split("/").pop();
    return `${BACKEND}/uploads/${fileName}`;
  };

  useEffect(() => {
    const loadCats = async () => {
      try {
        const loadSubs = async () => {
  try {
    const res = await api.get(
      `/api/subCategories?categorySlug=${name}`
    );

    const subs = (res.data || []).map((s) => s.slug);
    setSubCategories(subs);

    if (!subCategory && subs.length) {
      setActiveSub(subs[0]);
      navigate(`/category/${name}/${subs[0]}`, { replace: true });
    }
  } catch {
    setSubCategories([]);
  }
};

if (name) loadSubs();
      } catch {
        setSubCategories([]);
      }
    };

    if (name) loadCats();
  }, [name]); // eslint-disable-line

  useEffect(() => {
    if (subCategory) setActiveSub(subCategory);
  }, [subCategory]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await api.get("/api/products", {
          params: { category: name, subCategory: activeSub },
        });
        setProducts(res.data || []);
      } catch {
        setProducts([]);
      }
    };

    if (name && activeSub) loadProducts();
  }, [name, activeSub]);

  const getUnitLabel = (p) => {
    if (p.qtyLabel && String(p.qtyLabel).trim()) return p.qtyLabel;
    if (p.qty && p.unit) return `${p.qty} ${p.unit}`;
    return "";
  };

  const getQtyOptions = (p) => {
    const unit = String(p.unit || "").toLowerCase();
    const sub = String(p.subCategory || "").toLowerCase();

    if (sub === "milk" && unit === "ml") return [500, 1000];
    if (sub === "cheese" && unit === "g") return [200, 500, 1000];

    if (unit === "g") return [250, 500, 1000];
    if (unit === "ml") return [250, 500, 1000];

    if (unit === "kg") return [0.5, 1, 2];
    if (unit === "l" || unit === "ltr" || unit === "liter") return [0.5, 1, 2];

    if (unit === "piece") return [1, 2, 3, 5];
    if (unit === "dozen") return [1, 2];
    if (unit === "pack") return [1, 2, 3];

    return null;
  };

  const calcPrice = (p, qtyWant) => {
    const basePrice = Number(p.price);
    const baseQty = Number(p.qty);
    const want = Number(qtyWant);
    if (!basePrice || !baseQty || !want) return basePrice;
    return Math.round((basePrice * want) / baseQty);
  };

  const showMsg = (txt) => {
    setMessage(txt);
    setTimeout(() => setMessage(""), 1200);
  };

  const titleText = (name || "").replaceAll("-", " ");

  // ✅ UI-only styles
  const sidebarWrapStyle = {
    position: "sticky",
    top: 90, // navbar ke niche
  };

  const listBtnStyle = (active) => ({
    border: "1px solid rgba(0,0,0,.06)",
    fontWeight: active ? 800 : 650,
    borderRadius: 14,
    marginBottom: 10,
    padding: "12px 14px",
    textTransform: "capitalize",
    background: active ? "rgba(25,135,84,0.12)" : "#fff",
    color: active ? "#198754" : "#212529",
    boxShadow: active ? "0 10px 25px rgba(25,135,84,0.10)" : "none",
    transition: "all 0.2s ease",
  });

  const cardStyle = (isHover) => ({
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: isHover ? "0 18px 45px rgba(0,0,0,0.14)" : "0 10px 26px rgba(0,0,0,0.06)",
    transform: isHover ? "translateY(-6px)" : "translateY(0px)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
    borderRadius: 18,
  });

  const heartBtnStyle = {
    top: 10,
    right: 10,
    borderRadius: 999,
    background: "rgba(255,255,255,0.95)",
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
    width: 36,
    height: 36,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.18s ease",
  };

  return (
    <div className="container py-4">
      {message && (
        <div
          className="alert alert-success text-center rounded-4"
          style={{ border: "1px solid rgba(25,135,84,0.20)" }}
        >
          {message}
        </div>
      )}

      <div className="row g-4">
        {/* SIDEBAR */}
        <div className="col-12 col-md-3">
          <div style={sidebarWrapStyle}>
            <div className="card border-0 shadow-sm rounded-4 p-3">
              <div className="fw-bold text-capitalize" style={{ fontSize: 16 }}>
                {titleText}
              </div>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Browse sub-categories
              </div>

              <div className="list-group list-group-flush mt-3">
                {subCategories.map((sub) => {
                  const active = activeSub === sub;
                  return (
                    <button
                      key={sub}
                      type="button"
                      className="list-group-item list-group-item-action border-0"
                      style={listBtnStyle(active)}
                      onClick={() => navigate(`/category/${name}/${sub}`)}
                    >
                      {sub.replaceAll("-", " ")}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* PRODUCTS */}
        <div className="col-12 col-md-9">
          <div className="d-flex justify-content-between align-items-end mb-3">
            <div>
              <h4 className="mb-1 text-capitalize" style={{ fontWeight: 900, letterSpacing: 0.2 }}>
                {activeSub ? activeSub.replaceAll("-", " ") : "Products"}
              </h4>
              <div className="text-muted" style={{ fontSize: 13 }}>
                Choose pack size and add to cart
              </div>
            </div>
            <small className="text-muted">Showing {products.length} items</small>
          </div>

          {products.length === 0 ? (
            <div className="alert alert-light border rounded-4">No products available.</div>
          ) : (
            <div className="row g-3">
              {products.map((p) => {
                const unitLabel = getUnitLabel(p);
                const options = getQtyOptions(p);

                const qtyWant = options ? selectedQty[p._id] ?? options[0] : Number(p.qty) || 1;
                const finalPrice = options ? calcPrice(p, qtyWant) : p.price;

                const payload = {
                  ...p,
                  vendorEmail: p.vendorEmail,
                  vendorShopName: p.vendorShopName,
                  chosenQty: qtyWant,
                  chosenUnit: p.unit,
                  chosenQtyLabel: options ? `${qtyWant} ${p.unit}` : unitLabel,
                  finalPrice,
                };

                const isHover = hoverCardId === p._id;

                return (
                  <div className="col-6 col-md-4 col-lg-3" key={p._id}>
                    <div
                      className="card border-0 h-100 overflow-hidden"
                      style={cardStyle(isHover)}
                      onMouseEnter={() => setHoverCardId(p._id)}
                      onMouseLeave={() => setHoverCardId(null)}
                    >
                      {/* clickable image */}
                      <div
                        role="button"
                        onClick={() => navigate(`/product/${p._id}`)}
                        style={{
                          height: "clamp(140px, 20vw, 180px)",
                          background: "#f3f4f6",
                        }}
                        className="position-relative"
                      >
                        <img
                          src={getImg(p.image)}
                          alt={p.name}
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transform: isHover ? "scale(1.04)" : "scale(1)",
                            transition: "transform 0.25s ease",
                          }}
                          onError={(e) => {
                            e.currentTarget.src = "https://via.placeholder.com/600x600?text=No+Image";
                          }}
                        />

                        {/* wishlist icon */}
                        <button
                          className="btn btn-light btn-sm position-absolute"
                          style={{
                            ...heartBtnStyle,
                            transform: isHover ? "scale(1.03)" : "scale(1)",
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

                            addToWishlist(payload);
                            showMsg("❤️ Added to Wishlist");
                          }}
                          title="Add to wishlist"
                        >
                          ❤️
                        </button>
                      </div>

                      <div className="card-body p-3 d-flex flex-column">
                        {/* name */}
                        <div
                        role="button"
                        onClick={() => navigate(`/product/${p._id}`)}
                        className="fw-semibold"
                        style={{
                        fontSize: 14,
                        lineHeight: 1.2,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                        }}
     > 
                      {p.name}
                        </div>

                        {/* vendor */}
                        <div className="text-muted mt-1" style={{ fontSize: 12, color: "#7a7a7a" }}>
                          {p.vendorShopName ? (
                            <>
                              Sold by <span style={{ fontWeight: 700 }}>{p.vendorShopName}</span>
                            </>
                          ) : (
                            "Verified vendor"
                          )}
                        </div>

                        {/* Pack size */}
                        <div className="mt-2">
                          {options ? (
                            <>
                              <div className="text-muted" style={{ fontSize: 12, marginBottom: 6 }}>
                                Pack size
                              </div>

                              <select
                                className="form-select form-select-sm"
                                value={qtyWant}
                                onChange={(e) =>
                                  setSelectedQty((prev) => ({
                                    ...prev,
                                    [p._id]: Number(e.target.value),
                                  }))
                                }
                                onClick={(e) => e.stopPropagation()}
                                style={{ borderRadius: 12 }}
                              >
                                {options.map((q) => (
                                  <option key={q} value={q}>
                                    {q} {p.unit}
                                  </option>
                                ))}
                              </select>
                            </>
                          ) : unitLabel ? (
                            <div className="text-muted" style={{ fontSize: 12 }}>
                              {unitLabel}
                            </div>
                          ) : null}
                        </div>

                        {/* price */}
                        <div className="mt-2 d-flex justify-content-between align-items-center">
                          <div className="fw-bold text-success" style={{ fontSize: 15 }}>
                            ₹{finalPrice}
                          </div>
                          {options ? (
                            <div className="text-muted" style={{ fontSize: 12 }}>
                              / {qtyWant} {p.unit}
                            </div>
                          ) : null}
                        </div>

                        {/* add */}
                        <button
                          className="btn btn-success btn-sm mt-3 w-100"
                          style={{
                            height: 42,
                            borderRadius: 12,
                            fontWeight: 800,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();

                            if (!user) {
                              openAuthModal(
                                "Please login/register to add items to Cart 🛒",
                                location.pathname
                              );
                              return;
                            }

                            addToCart(payload);
                            showMsg("🛒 Added to Cart");
                          }}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;