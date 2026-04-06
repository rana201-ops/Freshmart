import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const BACKEND = process.env.REACT_APP_API_URL || "http://localhost:5000";

const getImg = (img) => {
  if (!img) return "https://via.placeholder.com/600x600?text=FreshMart";
  const s = String(img);
  if (s.startsWith("http")) return s;
  if (s.startsWith("/uploads")) return BACKEND + s;
  const fileName = s.split("\\").pop().split("/").pop();
  return `${BACKEND}/uploads/${fileName}`;
};

const Cart = () => {
  const { cart, updateQty, removeFromCart, cartTotal } = useContext(ShopContext);
  const navigate = useNavigate();

  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1400);
  };

  const getLabel = (item) =>
    item.chosenQtyLabel || item.qtyLabel || `${item.qty} ${item.unit}`;

  const itemTotal = (item) => {
    const price = Number(item.finalPrice ?? item.price ?? 0);
    const qty = Number(item.cartQty ?? 1);
    return price * qty;
  };

  // simple summary (optional)
  const deliveryFee = cart.length > 0 ? 0 : 0; // keep free for now
  const grandTotal = Number(cartTotal || 0) + deliveryFee;

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-end mb-3">
        <div>
          <h3 className="fw-bold mb-1">Your Cart 🛒</h3>
          <div className="text-muted" style={{ fontSize: 13 }}>
            Review items and checkout securely
          </div>
        </div>
        <div className="text-muted" style={{ fontSize: 13 }}>
          {cart.length} item(s)
        </div>
      </div>

      {/* Empty */}
      {cart.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-4 text-center">
          <div className="fw-bold" style={{ fontSize: 18 }}>
            Your cart is empty 🛍️
          </div>
          <div className="text-muted mt-1">
            Add products to your cart and they’ll show here.
          </div>

          <button
            className="btn btn-success mt-3 px-4"
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {/* LEFT: cart items */}
          <div className="col-12 col-lg-8">
            <div className="d-flex flex-column gap-3">
              {cart.map((item) => (
                <div
                  key={item.key}
                  className="card border-0 shadow-sm rounded-4 overflow-hidden"
                >
                  <div className="row g-0 align-items-center">
                    {/* Image */}
                    <div
                      className="col-4 col-md-3"
                      style={{ background: "#f3f4f6" }}
                    >
                      <img
                        src={getImg(item.image)}
                        alt={item.name}
                        style={{
                          width: "100%",
                          height: 130,
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/600x600?text=No+Image";
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div className="col-8 col-md-9">
                      <div className="p-3 p-md-4">
                        <div className="d-flex justify-content-between gap-3">
                          <div style={{ minWidth: 0 }}>
                            <div
                            className="fw-semibold"
                            style={{
                           display: "-webkit-box",
                           WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden"
                          }}
           >
                              {item.name}
                            </div>

                            <div className="text-muted mt-1" style={{ fontSize: 13 }}>
                              {item.vendorShopName ? (
                                <>
                                  Sold by <b>{item.vendorShopName}</b>{" "}
                                  <span style={{ opacity: 0.7 }}>
                                    ({item.vendorEmail || "NA"})
                                  </span>
                                </>
                              ) : (
                                "Verified vendor"
                              )}
                            </div>

                            <div className="text-muted mt-1" style={{ fontSize: 13 }}>
                              Pack: <b>{getLabel(item)}</b>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="text-end">
                            <div className="fw-bold text-success" style={{ fontSize: 18 }}>
                              ₹{Number(item.finalPrice ?? item.price ?? 0)}
                            </div>
                            <div className="text-muted" style={{ fontSize: 12 }}>
                              per pack
                            </div>
                          </div>
                        </div>

                        {/* Qty + Remove */}
                        <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                          {/* Qty stepper */}
                          <div className="d-flex align-items-center gap-2">
                            <button
                              className="btn btn-light border"
                              style={{ width: 40, height: 36 }}
                              onClick={() => {
                                updateQty(item.key, "dec");
                              }}
                              title="Decrease"
                            >
                              −
                            </button>

                            <div
                              className="px-3 py-2 border rounded-3 fw-bold"
                              style={{ minWidth: 54, textAlign: "center" }}
                            >
                              {item.cartQty ?? 1}
                            </div>

                            <button
                              className="btn btn-light border"
                              style={{ width: 40, height: 36 }}
                              onClick={() => {
                                updateQty(item.key, "inc");
                              }}
                              title="Increase"
                            >
                              +
                            </button>
                          </div>

                          {/* Line total */}
                          <div className="fw-semibold">
                            Total:{" "}
                            <span className="text-success fw-bold">
                              ₹{itemTotal(item)}
                            </span>
                          </div>

                          {/* Remove */}
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => {
                              removeFromCart(item.key);
                              showToast("Removed from Cart ❌");
                            }}
                          >
                            Remove
                          </button>
                        </div>

                        <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                          Fast delivery • Easy returns • Secure checkout
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: summary */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 sticky-top" style={{ top: 90 }}>
              <div className="fw-bold" style={{ fontSize: 16 }}>
                Order Summary
              </div>

              <div className="d-flex justify-content-between mt-3">
                <div className="text-muted">Items total</div>
                <div className="fw-semibold">₹{Number(cartTotal || 0)}</div>
              </div>

              <div className="d-flex justify-content-between mt-2">
                <div className="text-muted">Delivery</div>
                <div className="fw-semibold text-success">
                  {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                </div>
              </div>

              <hr />

              <div className="d-flex justify-content-between">
                <div className="fw-bold">Grand Total</div>
                <div className="fw-bold text-success">₹{grandTotal}</div>
              </div>

              <button
                className="btn btn-success w-100 mt-3"
                onClick={() => navigate("/checkout")}
              >
                Proceed to Checkout
              </button>

              <button
                className="btn btn-light border w-100 mt-2"
                onClick={() => navigate("/")}
              >
                Continue Shopping
              </button>

              <div className="text-muted mt-3" style={{ fontSize: 12 }}>
                By placing your order, you agree to FreshMart’s Terms & Privacy Policy.
              </div>
            </div>
          </div>
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

export default Cart;
