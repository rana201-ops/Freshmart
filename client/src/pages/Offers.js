import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import api from "../api";

const pickGradient = (seed = "") => {
  const grads = [
    "linear-gradient(135deg,#198754,#20c997)",
    "linear-gradient(135deg,#0d6efd,#6f42c1)",
    "linear-gradient(135deg,#fd7e14,#ffc107)",
    "linear-gradient(135deg,#dc3545,#fd7e14)",
  ];
  const idx = Math.abs(String(seed).length) % grads.length;
  return grads[idx];
};

const OfferCard = ({ o }) => {
  const bg = useMemo(() => pickGradient(o?._id || o?.title), [o]);
  const navigate = useNavigate();
const { user } = useContext(AuthContext);

  const discountText =
    o.discountType === "AMOUNT" ? `₹${o.discountValue} OFF` : `${o.discountValue}% OFF`;

  const copy = async () => {
    if (!o.code) return;
    try {
      await navigator.clipboard.writeText(o.code);
      alert("✅ Coupon copied");
    } catch {
      window.prompt("Copy coupon code:", o.code);
    }
  };

  return (
    <div className="card shadow-sm border-0 h-100" style={{ borderRadius: 16, overflow: "hidden" }}>
      {/* Banner */}
      <div style={{ background: bg, color: "#fff", padding: 16 }}>
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div>
            <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 700, letterSpacing: 0.5 }}>
              LIMITED TIME
            </div>
            <div className="fw-bold" style={{ fontSize: 20, lineHeight: 1.1 }}>
              {o.title}
            </div>

            <div className="mt-2 d-flex gap-2 flex-wrap">
              <span className="badge text-bg-light" style={{ borderRadius: 999, color: "#198754", fontWeight: 800 }}>
                {discountText}
              </span>
              {o.minOrder ? (
                <span className="badge text-bg-light" style={{ borderRadius: 999, color: "#198754", fontWeight: 800 }}>
                  Min ₹{o.minOrder}
                </span>
              ) : null}
            </div>
          </div>

          <span className="badge text-bg-light" style={{ borderRadius: 999, color: "#198754", fontWeight: 800 }}>
            NEW
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="card-body">
        <div className="text-muted" style={{ fontSize: 14 }}>
          {o.desc}
        </div>

        <div className="d-flex flex-wrap gap-2 mt-3">
          {o.validTill ? (
            <span className="badge text-bg-light border" style={{ borderRadius: 999, fontWeight: 600 }}>
              Valid till {new Date(o.validTill).toLocaleDateString()}
            </span>
          ) : (
            <span className="badge text-bg-light border" style={{ borderRadius: 999, fontWeight: 600 }}>
              No expiry
            </span>
          )}
          <span className="badge text-bg-light border" style={{ borderRadius: 999, fontWeight: 600 }}>
            FreshMart Deals
          </span>
        </div>

        {/* Coupon row */}
        <div
          className="mt-3 p-2 border d-flex justify-content-between align-items-center"
          style={{ borderRadius: 12, background: "rgba(25,135,84,0.06)" }}
        >
          <div style={{ minWidth: 0 }}>
            <div className="text-muted" style={{ fontSize: 12 }}>
              Coupon code
            </div>
            <div className="fw-bold text-truncate" style={{ letterSpacing: 1 }}>
              {o.code || "Auto applied / No code"}
            </div>
          </div>

          {o.code ? (
            <button className="btn btn-success btn-sm" onClick={copy} style={{ borderRadius: 999 }}>
              Copy
            </button>
          ) : (
            <span className="badge text-bg-success" style={{ borderRadius: 999 }}>
              Auto
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="d-flex gap-2 mt-3">
          <button
            className="btn btn-success w-100"
            style={{ borderRadius: 999, fontWeight: 700 }}
            onClick={() => {
  if (!user) {
    return navigate("/login", {
      state: { from: "/checkout", msg: "Please login/register to use offers 🎁" },
    });
  }
  navigate("/checkout");
}}
          >
            Use in Checkout
          </button>

          <button
            className="btn btn-light border w-100"
            style={{ borderRadius: 999, fontWeight: 700 }}
            onClick={() => (window.location.href = "/")}
          >
            Shop now
          </button>
        </div>
      </div>
    </div>
  );
};

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const res = await api.get("/api/offers"); // active + non-expired
      setOffers(res.data || []);
    } catch (e) {
      setOffers([]);
      setErr(e?.response?.data?.msg || "Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
        <div>
          <h2 className="fw-bold mb-0">Latest Offers</h2>
          <div className="text-muted">Save more with coupons & deals</div>
        </div>
        <button className="btn btn-sm btn-outline-secondary" onClick={load} style={{ borderRadius: 999 }}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="row g-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="col-12 col-sm-6 col-lg-4" key={i}>
              <div className="card shadow-sm border-0" style={{ borderRadius: 16, overflow: "hidden" }}>
                <div style={{ height: 84, background: "#e9ecef" }} />
                <div className="card-body">
                  <div className="placeholder-glow">
                    <div className="placeholder col-8 mb-2" />
                    <div className="placeholder col-12 mb-2" />
                    <div className="placeholder col-6" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {err && <div className="alert alert-danger">{err}</div>}

      {!loading && !err && offers.length === 0 ? (
        <div className="card shadow-sm border-0" style={{ borderRadius: 16 }}>
          <div className="card-body text-center p-4">
            <div style={{ fontSize: 44 }}>🎁</div>
            <div className="fw-bold" style={{ fontSize: 18 }}>
              No offers available right now
            </div>
            <div className="text-muted">Check later — we add new deals frequently.</div>
            <button
              className="btn btn-success mt-3"
              style={{ borderRadius: 999, fontWeight: 700 }}
              onClick={() => (window.location.href = "/")}
            >
              Go to Home
            </button>
          </div>
        </div>
      ) : null}

      {!loading && !err && offers.length > 0 ? (
        <div className="row g-3">
          {offers.map((o) => (
            <div className="col-12 col-sm-6 col-lg-4" key={o._id}>
              <OfferCard o={o} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default Offers;
