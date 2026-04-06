
import { Link } from "react-router-dom";
import PageTitle from "../components/common/PageTitle";

export default function Help() {
  return (
    <>
      <PageTitle title="Help Center" />

      <div className="container" style={{ maxWidth: 950, padding: "28px 12px" }}>
        {/*  Premium header */}
        <div
          className="rounded-4 p-4 p-md-5 mb-4"
          style={{
            background:
              "radial-gradient(1200px 500px at 20% 10%, rgba(25,135,84,.14), transparent 60%), linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          }}
        >
          <h2 className="fw-bold mb-1">Help Center</h2>
          <div className="text-muted" style={{ fontSize: 13 }}>
            Need assistance? Find quick answers below.
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <div
              className="card border-0 rounded-4 h-100"
              style={{ boxShadow: "0 12px 34px rgba(0,0,0,0.08)" }}
            >
              <div className="card-body p-4">
                <h6 className="fw-bold mb-2">🔐 Account & Login</h6>
                <div className="text-muted" style={{ fontSize: 14, lineHeight: 1.85 }}>
                  Password reset, login issues, account details.
                </div>

                <div className="mt-3 d-flex gap-2">
                  <Link to="/login" className="btn btn-outline-success btn-sm">
                    Go to Login
                  </Link>
                  <Link to="/forgot-password" className="btn btn-success btn-sm">
                    Reset Password
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div
              className="card border-0 rounded-4 h-100"
              style={{ boxShadow: "0 12px 34px rgba(0,0,0,0.08)" }}
            >
              <div className="card-body p-4">
                <h6 className="fw-bold mb-2">🚚 Orders & Delivery</h6>
                <div className="text-muted" style={{ fontSize: 14, lineHeight: 1.85 }}>
                  Delivery delay, missing items, tracking and order updates.
                </div>

                <div className="mt-3">
                  <span className="badge bg-success">Support: support@freshmart.com</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div
              className="card border-0 rounded-4 h-100"
              style={{ boxShadow: "0 12px 34px rgba(0,0,0,0.08)" }}
            >
              <div className="card-body p-4">
                <h6 className="fw-bold mb-2">💳 Payments</h6>
                <div className="text-muted" style={{ fontSize: 14, lineHeight: 1.85 }}>
                  Payment failed, refund status, and invoice queries (demo).
                </div>
                <div className="mt-3 text-muted" style={{ fontSize: 13 }}>
                  Tip: Try a different payment method or check bank limits.
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div
              className="card border-0 rounded-4 h-100"
              style={{ boxShadow: "0 12px 34px rgba(0,0,0,0.08)" }}
            >
              <div className="card-body p-4">
                <h6 className="fw-bold mb-2">↩ Returns & Refunds</h6>
                <div className="text-muted" style={{ fontSize: 14, lineHeight: 1.85 }}>
                  Damaged items, wrong items, return eligibility (demo).
                </div>
                <div className="mt-3 text-muted" style={{ fontSize: 13 }}>
                  Contact support with your order ID for faster help.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-muted" style={{ fontSize: 13 }}>
          For urgent help (demo): <b>+91 98765 43210</b>
        </div>

        {/*  Back to home */}
        <div className="mt-4">
          <Link to="/" className="btn btn-outline-success btn-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </>
  );
}