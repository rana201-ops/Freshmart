import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { AuthContext } from "../context/AuthContext";

const BACKEND = "http://localhost:5000";

const getImg = (img) => {
  if (!img) return "https://via.placeholder.com/600x600?text=FreshMart";
  const s = String(img);
  if (s.startsWith("http")) return s;
  if (s.startsWith("/uploads")) return BACKEND + s;
  const fileName = s.split("\\").pop().split("/").pop();
  return `${BACKEND}/uploads/${fileName}`;
};

const Wishlist = () => {
  const { wishlist, addToCart, removeFromWishlist } = useContext(ShopContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1500);
  };

  // ✅ Login guard (no alert inside render)
  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [user, navigate]);

  if (!user) return null;

  const moveToCart = (item) => {
    addToCart(item);
    removeFromWishlist(item.key); // ✅ IMPORTANT
    showToast("Moved to Cart ✅");
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-end mb-3">
        <div>
          <h3 className="fw-bold mb-1">My Wishlist ❤️</h3>
          <div className="text-muted" style={{ fontSize: 13 }}>
            Save items and buy later
          </div>
        </div>

        <div className="text-muted" style={{ fontSize: 13 }}>
          {wishlist.length} item(s)
        </div>
      </div>

      {/* Empty state */}
      {wishlist.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-4 text-center">
          <div className="fw-bold" style={{ fontSize: 18 }}>
            Your wishlist is empty
          </div>
          <div className="text-muted mt-1">
            Add products you like and they’ll show here.
          </div>

          <button
            className="btn btn-success mt-3 px-4"
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="row g-3">
          {wishlist.map((item) => (
            <div className="col-12" key={item.key}>
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="row g-0 align-items-center">
                  {/* Image */}
                  <div className="col-4 col-md-2" style={{ background: "#f3f4f6" }}>
                    <img
                      src={getImg(item.image)}
                      alt={item.name}
                      style={{ width: "100%", height: 120, objectFit: "cover" }}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/600x600?text=No+Image";
                      }}
                      role="button"
                      onClick={() => navigate(`/product/${item._id || item.id}`)}
                    />
                  </div>

                  {/* Details */}
                  <div className="col-8 col-md-10">
                    <div className="p-3 p-md-4">
                      <div className="d-flex justify-content-between gap-3">
                        <div style={{ minWidth: 0 }}>
                          <div
                            className="fw-semibold text-truncate"
                            style={{ fontSize: 16, cursor: "pointer" }}
                            onClick={() => navigate(`/product/${item._id || item.id}`)}
                            title="Open product"
                          >
                            {item.name}
                          </div>

                          <div className="text-muted mt-1" style={{ fontSize: 13 }}>
                            {item.vendorShopName ? (
                              <>
                                Sold by <b>{item.vendorShopName}</b>
                              </>
                            ) : (
                              "Verified vendor"
                            )}
                          </div>

                          {(item.chosenQtyLabel || item.qtyLabel) && (
                            <div className="text-muted mt-1" style={{ fontSize: 13 }}>
                              Pack: <b>{item.chosenQtyLabel || item.qtyLabel}</b>
                            </div>
                          )}
                        </div>

                        {/* Price */}
                        <div className="text-end">
                          <div className="fw-bold text-success" style={{ fontSize: 18 }}>
                            ₹{Number(item.finalPrice ?? item.price ?? 0)}
                          </div>
                          <div className="text-muted" style={{ fontSize: 12 }}>
                            inclusive of taxes
                          </div>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="d-flex gap-2 flex-wrap mt-3">
                        <button className="btn btn-success" onClick={() => moveToCart(item)}>
                          Move to Cart
                        </button>

                        <button
                          className="btn btn-outline-danger"
                          onClick={() => {
                            removeFromWishlist(item.key); // ✅ IMPORTANT
                            showToast("Removed from Wishlist ❌");
                          }}
                        >
                          Remove
                        </button>

                        <button
                          className="btn btn-light border"
                          onClick={() => navigate(`/product/${item._id || item.id}`)}
                        >
                          View
                        </button>
                      </div>

                      
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            background: "#198754",
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
    </div>
  );
};

export default Wishlist;
