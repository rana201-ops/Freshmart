import { AuthContext } from "../context/AuthContext";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useContext, useEffect, useMemo, useState } from "react";
import api from "../api";
import { ShopContext } from "../context/ShopContext";

const BACKEND = process.env.REACT_APP_API_URL || "http://localhost:5000";
const getImg = (img) => {
  if (!img) return "https://via.placeholder.com/900x900?text=FreshMart";
  if (String(img).startsWith("http")) return img;
  if (String(img).startsWith("/uploads")) return BACKEND + img;
  const fileName = String(img).split("\\").pop().split("/").pop();
  return `${BACKEND}/uploads/${fileName}`;
};

const getUnitLabel = (p) => {
  if (p?.qtyLabel && String(p.qtyLabel).trim()) return p.qtyLabel;
  if (p?.qty && p?.unit) return `${p.qty} ${p.unit}`;
  return "";
};

const getQtyOptions = (p) => {
  const unit = String(p?.unit || "").toLowerCase();
  const sub = String(p?.subCategory || "").toLowerCase();

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
  const basePrice = Number(p?.price);
  const baseQty = Number(p?.qty);
  const want = Number(qtyWant);

  if (!basePrice || !baseQty || !want) return basePrice || 0;
  return Math.round((basePrice * want) / baseQty);
};

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useContext(ShopContext);
  const { user, openAuthModal } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [qtyWant, setQtyWant] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 1500);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/products/${id}`);
        const p = res.data?.product || res.data;
        setProduct(p || null);
      } catch {
        try {
          const res = await api.get("/api/products");
          const found = (res.data || []).find((p) => String(p._id) === String(id));
          setProduct(found || null);
        } catch {
          setProduct(null);
        }
      }
    })
    ();
  }, [id]);

  useEffect(() => {
  if (!product) return;

  document.title = `${product.name} | FreshMart`;

}, [product]);

useEffect(() => {
  if (!product) return;

  const meta = document.querySelector("meta[name='description']");

  if (meta) {
    meta.setAttribute(
      "content",
      `Buy fresh ${product.name} online from FreshMart. High quality grocery product with fast delivery.`
    );
  }

}, [product]);


  const options = useMemo(() => (product ? getQtyOptions(product) : null), [product]);

  useEffect(() => {
    if (!product) return;
    if (options?.length) setQtyWant((prev) => (prev == null ? options[0] : prev));
    else setQtyWant(null);
  }, [product, options]);

  const unitLabel = useMemo(() => (product ? getUnitLabel(product) : ""), [product]);

  const finalPrice = useMemo(() => {
    if (!product) return 0;
    if (!options?.length) return Number(product.price || 0);
    return calcPrice(product, qtyWant ?? options[0]);
  }, [product, options, qtyWant]);

  const chosenLabel = useMemo(() => {
    if (!product) return "";
    if (options?.length) return `${qtyWant ?? options[0]} ${product.unit}`;
    return unitLabel;
  }, [product, options, qtyWant, unitLabel]);

  const cartPayload = useMemo(() => {
    if (!product) return null;
    return {
      ...product,
      vendorEmail: product.vendorEmail,
      vendorShopName: product.vendorShopName,
      chosenQty: options?.length ? (qtyWant ?? options[0]) : product.qty,
      chosenUnit: product.unit,
      chosenQtyLabel: chosenLabel,
      finalPrice,
    };
  }, [product, options, qtyWant, chosenLabel, finalPrice]);

  const handleAdd = () => {
  if (!cartPayload) return;

  if (!user) {
    openAuthModal("Please login/register to add items to Cart 🛒", location.pathname);
    return;
  }

  addToCart(cartPayload);
  showToast("🛒 Added to Cart");
};

  const handleBuy = () => {
  if (!cartPayload) return;

  if (!user) {
    openAuthModal("Please login/register to continue checkout ✅", location.pathname);
    return;
  }

  addToCart(cartPayload);
  navigate("/checkout");
};

  const goBack = () => {
    // best UX: if some page passed state.from, go there. else use history back
    if (location.state?.from) navigate(location.state.from);
    else navigate(-1);
  };

  if (!product) return <div className="container py-5">Loading...</div>;

  const desc =
    product?.description?.trim() ||
    `Fresh ${product?.name} sourced from verified vendors. Carefully packed and quality checked for freshness.`;

  return (
    <div className="container py-3 py-md-4">
      {/* Back */}
      <button
        className="btn btn-light btn-sm mb-3"
        onClick={goBack}
        style={{ borderRadius: 12, border: "1px solid rgba(0,0,0,.06)" }}
      >
        ← Back
      </button>

      {/* Breadcrumb */}
      <div className="mb-3" style={{ fontSize: 13, wordBreak: "break-word" }}>
        <Link to="/" className="text-decoration-none">
          Home
        </Link>
        <span className="text-muted"> / </span>
        <Link
          to={`/category/${product.category}`}
          className="text-decoration-none text-capitalize"
        >
          {String(product.category || "").replaceAll("-", " ")}
        </Link>
        <span className="text-muted"> / </span>
        <span className="text-muted">{product.name}</span>
      </div>

      <div className="row g-4 align-items-start">
        {/* IMAGE (smaller + mobile-friendly) */}
        <div className="col-12 col-lg-6">
          <div
            className="rounded-4 overflow-hidden shadow-sm"
            style={{
              background: "#f3f4f6",
              border: "1px solid rgba(0,0,0,.06)",
              maxWidth: 720,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "1 / 1", // ecommerce style
                maxHeight: 360,       // prevents huge on phone
              }}
            >
              <img
                src={getImg(product.image)}
                alt={product.name}
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/900x900?text=No+Image";
                }}
              />
            </div>
          </div>
        </div>

        {/* DETAILS */}
        <div className="col-12 col-lg-6">
          <div
            className="card border-0 shadow-sm rounded-4"
            style={{ border: "1px solid rgba(0,0,0,.06)" }}
          >
            <div className="card-body p-3 p-md-4">
              <h2 className="fw-bold mb-1" style={{ lineHeight: 1.15 }}>
                {product.name}
              </h2>

              <div className="text-muted" style={{ fontSize: 13 }}>
                {product.vendorShopName ? (
                  <>
                    Sold by <b>{product.vendorShopName}</b>
                  </>
                ) : (
                  "Verified vendor"
                )}
              </div>

              {/* Price */}
              <div className="mt-3 d-flex align-items-end gap-2">
                <div
                  className="text-success fw-bold"
                  style={{ fontSize: 30, lineHeight: 1 }}
                >
                  ₹{finalPrice}
                </div>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  {chosenLabel ? ` / ${chosenLabel}` : ""}
                </div>
              </div>

              {/* Pack selector */}
              <div className="mt-3">
                {options?.length ? (
                  <>
                    <div className="text-muted mb-1" style={{ fontSize: 12 }}>
                      Choose pack size
                    </div>
                    <select
                      className="form-select"
                      value={qtyWant ?? options[0]}
                      onChange={(e) => setQtyWant(parseFloat(e.target.value))}
                      style={{ borderRadius: 12, height: 44 }}
                    >
                      {options.map((q) => (
                        <option key={q} value={q}>
                          {q} {product.unit}
                        </option>
                      ))}
                    </select>
                  </>
                ) : unitLabel ? (
                  <div className="text-muted" style={{ fontSize: 13 }}>
                    Pack: <b>{unitLabel}</b>
                  </div>
                ) : null}
              </div>

              {/* Buttons */}
              <div className="d-flex gap-2 mt-3 flex-wrap">
                <button
                  className="btn btn-success flex-grow-1"
                  style={{ minWidth: 160, height: 44, borderRadius: 12 }}
                  onClick={handleAdd}
                >
                  Add to Cart
                </button>

                <button
                  className="btn btn-outline-success flex-grow-1"
                  style={{ minWidth: 160, height: 44, borderRadius: 12 }}
                  onClick={handleBuy}
                >
                  Buy Now
                </button>
              </div>

              {/* Badges */}
              <div className="d-flex gap-2 flex-wrap mt-3">
                <span className="badge text-bg-light border rounded-pill px-3 py-2">
                  ✅ Fresh
                </span>
                <span className="badge text-bg-light border rounded-pill px-3 py-2">
                  🚚 Fast delivery
                </span>
                <span className="badge text-bg-light border rounded-pill px-3 py-2">
                  🔁 Easy returns
                </span>
              </div>

              {/* Description */}
              <div className="mt-4">
                <h6 className="fw-bold mb-2">About this product</h6>
                <p className="text-muted mb-0" style={{ lineHeight: 1.7, fontSize: 14 }}>
                  {desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 18,
            right: 18,
            background: "#198754",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 12,
            boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
            zIndex: 9999,
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
