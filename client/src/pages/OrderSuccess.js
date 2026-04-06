import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const OrderSuccess = () => {
  const navigate = useNavigate();

  useEffect(()=>{
  window.scrollTo(0,0)
},[])

  return (
    <div
      className="container py-5 d-flex align-items-center justify-content-center"
      style={{ minHeight: "70vh" }}
    >
      <div
        className="card border-0 shadow rounded-4 text-center p-5"
        style={{ maxWidth: 520, width: "100%" }}
      >
        {/* Success Icon */}
        <div
          className="d-flex align-items-center justify-content-center mb-3"
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(25,135,84,.15)",
            margin: "0 auto",
            fontSize: 40,
          }}
        >
          ✅
        </div>

        <h3 className="fw-bold mb-2">Order Confirmed 🎉</h3>

        <p className="text-muted mb-3">
          Thank you for shopping with <b>FreshMart</b>.  
          Your order has been placed successfully.
        </p>

        <div className="text-muted mb-4" style={{ fontSize: 14 }}>
          📦 You will receive order updates via phone.  
          🚚 Expected delivery: <b>1–2 business days</b>
        </div>

        <div className="d-flex gap-2 justify-content-center flex-wrap">
          <button
            className="btn btn-success px-4"
            onClick={() => navigate("/my-orders")}
          >
            View My Orders
          </button>

          <button
            className="btn btn-outline-success px-4"
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
