import { useContext, useEffect, useMemo, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useContext(ShopContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", phone: "", address: "" });

  // Offers + Coupon
  const [offers, setOffers] = useState([]);
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(null);
  const [msg, setMsg] = useState("");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("cod"); // cod | online
  const [isPaying, setIsPaying] = useState(false);
  const [cardError, setCardError] = useState("");
  const stripe = useStripe();
  const cardOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#1f2937",
      fontFamily: "system-ui, sans-serif",
      "::placeholder": {
        color: "#9ca3af"
      }
    },
    invalid: {
      color: "#ef4444"
    }
  }
};
const elements = useElements();

  const safeCartTotal = Number(cartTotal || 0);
  const discount = Number(applied?.discount || 0);
  const finalTotal = Math.max(0, safeCartTotal - discount);

  useEffect(()=>{
 window.scrollTo(0,0)
},[])

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/offers");
        setOffers(res.data || []);
      } catch {
        setOffers([]);
      }
    })();
  }, []);

  const applyCoupon = async () => {
    setMsg("");
    const code = coupon.trim().toUpperCase();
    const total = Number(cartTotal || 0);

    if (!code) return setMsg("Enter coupon code");
    if (!total || total <= 0) return setMsg("Cart total is 0. Add items first.");

    try {
      const res = await api.post("/api/offers/apply", { code, cartTotal: total });

      setApplied({
        code: res.data.offer.code,
        title: res.data.offer.title,
        type: res.data.offer.discountType,
        value: res.data.offer.discountValue,
        min: res.data.offer.minOrder,
        validTill: res.data.offer.validTill,
        discount: Number(res.data.discount || 0),
      });

      setMsg(`Coupon applied: ${res.data.offer.code}`);
    } catch (e) {
      setApplied(null);
      setMsg(e?.response?.data?.msg || "Invalid coupon");
    }
  };

  const applyFromOffer = async (code) => {
    if (!code) return;
    const total = Number(cartTotal || 0);
    setCoupon(code);
    setMsg("");

    if (!total || total <= 0) return setMsg("Cart total is 0. Add items first.");

    try {
      const res = await api.post("/api/offers/apply", { code, cartTotal: total });

      setApplied({
        code: res.data.offer.code,
        title: res.data.offer.title,
        type: res.data.offer.discountType,
        value: res.data.offer.discountValue,
        min: res.data.offer.minOrder,
        validTill: res.data.offer.validTill,
        discount: Number(res.data.discount || 0),
      });

      setMsg(`Coupon applied: ${res.data.offer.code}`);
    } catch (e) {
      setApplied(null);
      setMsg(e?.response?.data?.msg || "Cannot apply this coupon");
    }
  };

  const removeCoupon = () => {
    setApplied(null);
    setCoupon("");
    setMsg("Coupon removed");
  };
useEffect(() => {
  if (!applied) return;

  const total = Number(cartTotal || 0);

  if (total <= 0) {
    setApplied(null);
    setCoupon("");
    setMsg("Coupon removed because cart is empty.");
    return;
  }

  const min = Number(applied.min || 0);
  if (min > 0 && total < min) {
    setApplied(null);
    setCoupon("");
    setMsg(`Coupon removed: minimum ₹${min} required.`);
  }
}, [cartTotal, applied]);  // ✅ cart total change = re-check coupon

  const validateBeforePay = () => {
    if (!user) {
      alert("Please login first");
      navigate("/login");
      return false;
    }
    if (!form.name || !form.phone || !form.address) {
      alert("Please fill all details");
      return false;
    }
    if (!cart || cart.length === 0) {
      alert("Cart is empty");
      return false;
    }
    return true;
  };

  // ✅ Create DB order first (for BOTH COD + ONLINE)
  const createDbOrder = async (method) => {
    const payload = {
      items: cart.map((i) => {
        const packs = Number(i.cartQty ?? 1);
        const selectedPrice = Number(i.finalPrice ?? i.price) || 0;
        const unitLabel =
          i.chosenQtyLabel ||
          i.qtyLabel ||
          (i.qty && i.unit ? `${i.qty} ${i.unit}` : "");

        return {
          productId: i._id || i.id || null,
          name: i.name,
          price: selectedPrice,
          qty: packs,
          image: i.image,
          vendorEmail: i.vendorEmail || "",
          vendorShopName: i.vendorShopName || "",
          chosenQtyLabel: unitLabel,
        };
      }),

      total: safeCartTotal,
      discount,
      finalTotal,

      coupon: applied
        ? { code: applied.code, type: applied.type, value: applied.value, discount }
        : null,

      payment: {
        method,
        status: method === "cod" ? "pending" : "pending",
      },

      name: form.name,
      phone: form.phone,
      address: form.address,
    };

    const res = await api.post("/api/orders", payload);
    return res.data?.order;
  };

  // Open Razorpay popup + verify
  

  const payNow = async () => {
  setMsg("");
  if (!validateBeforePay()) return;

  try {
    setIsPaying(true);

    if (paymentMethod === "cod") {
      await createDbOrder("cod");
      alert("Order Placed (COD)");
      clearCart();
      navigate("/order-success");
      return;
    }

    // ONLINE PAYMENT
    const order = await createDbOrder("online");

    const res = await api.post("/api/payments/stripe/create-intent", {
      amount: finalTotal,
      dbOrderId: order._id,
    });

    const result = await stripe.confirmCardPayment(
      res.data.clientSecret,
      {
       payment_method: {
  card: elements.getElement(CardElement),
  billing_details: {
    name: form.name,
    phone: form.phone,
    address: {
      line1: form.address
    }
  }
}
      }
    );

    if (result.error) {
      throw new Error(result.error.message);
    }

   if (result.paymentIntent.status === "succeeded") {

  await api.post("/api/orders/mark-paid", {
    orderId: order._id,
  });

  alert("✅ Payment Successful");

  clearCart();
  navigate("/order-success");
}

  } catch (err) {
    const backendMsg =
      err?.response?.data?.msg ||
      err?.message ||
      "Payment failed";

    setMsg(backendMsg);
    alert(backendMsg);

  } finally {
    setIsPaying(false);
  }
};

  const discountLabel = useMemo(() => {
    if (!applied) return "";
    return `${applied.code} • -₹${discount}`;
  }, [applied, discount]);

  const lineTotal = (i) => {
    const unitPrice = Number(i.finalPrice ?? i.price) || 0;
    const packs = Number(i.cartQty ?? 1);
    return unitPrice * packs;
  };

  const unitLabel = (i) =>
    i.chosenQtyLabel || i.qtyLabel || (i.qty && i.unit ? `${i.qty} ${i.unit}` : "");

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">

  <div className="text-center flex-fill">
    <div
  className="fw-bold d-flex align-items-center justify-content-center"
  style={{
    background:"#198754",
    color:"#fff",
    borderRadius:"50%",
    width:28,
    height:28,
    margin:"0 auto"
  }}
>
1
</div>
    <small>Delivery</small>
  </div>

  <div style={{flex:1,height:2,background:"#e5e7eb"}}></div>

  <div className="text-center flex-fill">
    <div
  className="fw-bold d-flex align-items-center justify-content-center"
  style={{
    background:"#198754",
    color:"#fff",
    borderRadius:"50%",
    width:28,
    height:28,
    margin:"0 auto"
  }}
>
2
</div>
    <small>Offers</small>
  </div>

  <div style={{flex:1,height:2,background:"#e5e7eb"}}></div>

  <div className="text-center flex-fill">
   <div
  className="fw-bold d-flex align-items-center justify-content-center"
  style={{
    background:"#198754",
    color:"#fff",
    borderRadius:"50%",
    width:28,
    height:28,
    margin:"0 auto"
  }}
>
3
</div>
    <small>Payment</small>
  </div>

</div>
      <div className="d-flex justify-content-between align-items-end mb-3">
        <div>
          <h3 className="fw-bold mb-1">Checkout</h3>
          <div className="text-muted" style={{ fontSize: 13 }}>
            Secure checkout • Fast delivery • Easy returns
          </div>
        </div>

        <button className="btn btn-link text-success fw-semibold p-0" onClick={() => navigate("/cart")}>
          ← Back to Cart
        </button>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-7">
          {/* Delivery */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold mb-0">Delivery Details</h6>
              <span className="badge bg-light text-dark border" style={{ borderRadius: 999 }}>
                Step 1
              </span>
            </div>

            <div className="row g-2">
              <div className="col-12">
                <label className="form-label text-muted" style={{ fontSize: 13 }}>
                  Full Name
                </label>
                <input
                  className="form-control form-control-lg"
                  value={form.name}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                    setForm({ ...form, name: v });
                  }}
                  placeholder="Your name"
                />
              </div>

              <div className="col-12">
                <label className="form-label text-muted" style={{ fontSize: 13 }}>
                  Mobile Number
                </label>
                <input
                  className="form-control"
                  value={form.phone}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setForm({ ...form, phone: v });
                  }}
                  placeholder="10-digit mobile"
                />
              </div>

              <div className="col-12">
                <label className="form-label text-muted" style={{ fontSize: 13 }}>
                  Delivery Address
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="House no, street, area, city, pincode"
                />
              </div>
            </div>
          </div>

          {/* Coupons */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="fw-bold mb-0">Offers & Coupons</h6>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  Apply best offer for your cart
                </div>
              </div>
              <span className="badge bg-light text-dark border" style={{ borderRadius: 999 }}>
                Step 2
              </span>
            </div>

            {msg && (
              <div className="alert alert-info py-2 mt-3 mb-0 rounded-4" style={{ fontSize: 14 }}>
                {msg}
              </div>
            )}

            <div className="d-flex gap-2 flex-wrap mt-3">
              <input
                className="form-control"
                placeholder="Enter code (e.g., FRESH20)"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
              />

              {!applied ? (
                <button className="btn btn-success" onClick={applyCoupon}>
                  Apply
                </button>
              ) : (
                <button className="btn btn-outline-danger" onClick={removeCoupon}>
                  Remove
                </button>
              )}
            </div>

            {applied && (
              <div className="mt-2">
                <span className="badge bg-light text-dark border" style={{ borderRadius: 999 }}>
                  Applied: <b>{discountLabel}</b>
                </span>
                <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                  {applied.title}
                </div>
              </div>
            )}

            <div className="mt-4">
              <div className="fw-semibold mb-2">Available Coupons</div>

              {offers.length === 0 ? (
                <div className="text-muted" style={{ fontSize: 13 }}>
                  No offers available right now.
                </div>
              ) : (
                <div className="row g-2">
                  {offers
                    .filter((o) => !!o.code)
                    .slice(0, 6)
                    .map((o, idx) => {
                      const discountText =
                        o.discountType === "AMOUNT"
                          ? `₹${o.discountValue} OFF`
                          : `${o.discountValue}% OFF`;

                      return (
                        <div className="col-12 col-md-6" key={o._id || idx}>
                          <button
                            type="button"
                            className="w-100 text-start border rounded-4 p-3"
                            style={{ background: "#fff" }}
                            onClick={() => applyFromOffer(o.code)}
                          >
                            <div className="d-flex justify-content-between align-items-start gap-2">
                              <div>
                                <div className="fw-semibold text-success">{o.title}</div>
                                <div className="text-muted" style={{ fontSize: 12 }}>
                                  {o.desc}
                                </div>

                                <div className="d-flex gap-2 flex-wrap mt-2">
                                  <span className="badge bg-light text-dark border" style={{ borderRadius: 999 }}>
                                    Code: <b>{o.code}</b>
                                  </span>
                                  <span className="badge bg-light text-dark border" style={{ borderRadius: 999 }}>
                                    {discountText}
                                  </span>
                                  {o.minOrder ? (
                                    <span className="badge bg-light text-dark border" style={{ borderRadius: 999 }}>
                                      Min ₹{o.minOrder}
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <span className="badge bg-success" style={{ borderRadius: 999 }}>
                                Apply
                              </span>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <h6 className="fw-bold mb-0">Payment Method</h6>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  Choose how you want to pay
                </div>
              </div>

              <span className="badge bg-light text-dark border" style={{ borderRadius: 999 }}>
                Step 3
              </span>
            </div>

         <div className="d-flex gap-3 flex-wrap mt-3">

{/* COD */}
<label
  className="rounded-4 p-3 d-flex align-items-center gap-2"
  style={{
    minWidth: 240,
    cursor: "pointer",
    border: paymentMethod === "online"
  ? "2px solid #16a34a"
  : "1px solid #e5e7eb",
background: paymentMethod === "online"
  ? "#f0fdf4"
  : "#fff"
  }}
>
  <input
    type="radio"
    name="pm"
    checked={paymentMethod === "cod"}
    onChange={() => setPaymentMethod("cod")}
  />
  <div>
    <div className="fw-semibold">Cash on Delivery</div>
    <div className="text-muted" style={{ fontSize: 12 }}>
      Pay at your doorstep
    </div>
  </div>
</label>

{/* ONLINE */}
<label
  className="rounded-4 p-3 d-flex align-items-center gap-2"
  style={{
    minWidth: 240,
    cursor: "pointer",
    border: paymentMethod === "online"
      ? "2px solid #198754"
      : "1px solid #ddd"
  }}
>
  <input
    type="radio"
    name="pm"
    checked={paymentMethod === "online"}
    onChange={() => setPaymentMethod("online")}
  />
  <div>
    <div className="fw-semibold">Online Payment (Stripe)</div>
    <div className="text-muted" style={{ fontSize: 12 }}>
      Card / UPI / Netbanking
    </div>
  </div>
</label>

</div>
           {paymentMethod === "online" && (

<div
className="mt-3 rounded-4"
style={{
background:"#ffffff",
boxShadow:"0 4px 20px rgba(0,0,0,0.05)",
border:"1px solid #e5e7eb",
padding:"18px"
}}
>

<div className="fw-semibold mb-1">
💳 Enter your card details
</div>

<div className="text-muted mb-3" style={{fontSize:13}}>
Your card details are encrypted and processed securely by Stripe
</div>

{/* Name on card */}

<div className="mb-3">
<label className="form-label fw-semibold">
Cardholder Name 
<span className="text-muted ms-1" style={{fontSize:12}}>
(as printed on card)
</span>
</label>
<input
className="form-control"
placeholder="Name on card"
value={form.name}
onChange={(e) => setForm({ ...form, name: e.target.value })}
/>
</div>

{/* Card element */}

<div
style={{
background:"#fff",
padding:"12px",
borderRadius:"10px",
border:"1px solid #e5e7eb"
}}
>
<div className="mb-2 text-muted" style={{fontSize:12}}>
Card Number • Expiry • CVC
</div>
<CardElement
  options={cardOptions}
  onChange={(e) => {
    setCardError(e.error ? e.error.message : "");
  }}
/>
<div className="text-muted mt-2" style={{fontSize:12}}>
Example: 4242 4242 4242 4242 • 12/34 • 123
</div>

</div>
{cardError && (
  <div className="mt-2 p-2 rounded-3" style={{ background:"#fef2f2", color:"#dc2626", fontSize:13 }}>
    ⚠️ {cardError}
  </div>
)}

<div className="text-muted mt-2" style={{fontSize:12}}>
We accept Visa, Mastercard and RuPay cards
</div>

</div>

)}

            <button
              className="w-100 mt-4"

              onClick={payNow}
              disabled={
  isPaying ||
  cart.length === 0 ||
  (paymentMethod==="online" && (!stripe || !elements || cardError))
}
              style={{
  background:"linear-gradient(135deg,#16a34a,#22c55e)",
  border:"none",
  color:"#fff",
  padding:"14px",
  fontWeight:700,
  borderRadius:"14px",
  fontSize:"16px"
}}
            >
              {isPaying
                ? "Processing..."
                : paymentMethod === "cod"
                ? `Place Order (COD) • ₹${finalTotal}`
                : `Pay Now • ₹${finalTotal}`}
            </button>

            <div className="text-muted mt-2" style={{ fontSize: 12 }}>
              By placing your order, you agree to FreshMart’s Terms & Privacy Policy.
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 p-4 sticky-top" style={{ top: 90 }}>
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0">Order Summary</h6>
              <span className="text-muted" style={{ fontSize: 13 }}>
                {cart.length} item(s)
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="alert alert-light border rounded-4 mt-3 mb-0">
                Your cart is empty.
              </div>
            ) : (
              <>
                <div className="mt-3 d-flex flex-column gap-2">
                  {cart.map((i, idx) => (
                    <div
                      key={`${i._id || i.id || i.name}-${unitLabel(i)}-${idx}`}
                      className="d-flex justify-content-between"
                      style={{ fontSize: 14 }}
                    >
                      <div className="text-truncate me-2" style={{ maxWidth: "70%" }}>
                        <span className="fw-semibold">{i.name}</span>{" "}
                        <span className="text-muted">
                          {unitLabel(i) ? `(${unitLabel(i)})` : ""} × {Number(i.cartQty ?? 1)}
                        </span>
                      </div>
                      <div className="fw-semibold">₹{lineTotal(i)}</div>
                    </div>
                  ))}
                </div>

                <hr className="my-3" />

                <div className="d-flex justify-content-between">
                  <span className="text-muted">Subtotal</span>
                  <b>₹{safeCartTotal}</b>
                </div>

                <div className="d-flex justify-content-between mt-2">
                  <span className="text-muted">Discount</span>
                  <b className="text-success">- ₹{discount}</b>
                </div>

                {applied ? (
                  <div className="mt-2">
                    <span className="badge bg-light text-dark border" style={{ borderRadius: 999 }}>
                      Applied: <b>{discountLabel}</b>
                    </span>
                  </div>
                ) : null}

                <hr className="my-3" />

                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold">Final Total</span>
                  <span className="fw-bold text-success" style={{ fontSize: 20 }}>
                    ₹{finalTotal}
                  </span>
                </div>

                <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                  Free delivery on eligible items • Taxes included where applicable
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {isPaying && (
  <div
    className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
    style={{ background: "rgba(0,0,0,0.5)", zIndex: 9999 }}
  >
    <div className="bg-white p-4 rounded-4 text-center">
      <div className="spinner-border text-success mb-2"></div>
      <div>Processing Payment...</div>
    </div>
  </div>
)}
    </div>
  );
};

export default Checkout;
