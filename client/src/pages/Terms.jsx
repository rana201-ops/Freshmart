
import { Link } from "react-router-dom";
import PageTitle from "../components/common/PageTitle";

export default function Terms() {
  return (
    <>
      <PageTitle title="Terms & Conditions" />

      <div className="container" style={{ maxWidth: 950, padding: "28px 12px" }}>
        {/* ✅ Premium header */}
        <div
          className="rounded-4 p-4 p-md-5 mb-4"
          style={{
            background:
              "radial-gradient(1200px 500px at 20% 10%, rgba(25,135,84,.14), transparent 60%), linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          }}
        >
          <h2 className="fw-bold mb-1">Terms & Conditions</h2>
          <div className="text-muted" style={{ fontSize: 13 }}>
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>

        <div
          className="card border-0 rounded-4"
          style={{ boxShadow: "0 12px 34px rgba(0,0,0,0.08)" }}
        >
          <div className="card-body p-4 p-md-5">
            <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.85 }}>
              By using <b>FreshMart</b>, you agree to these Terms. Please read them carefully.
            </p>

            <hr className="my-4" />

            <h6 className="fw-bold">1) Account responsibility</h6>
            <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.85 }}>
              You are responsible for maintaining the confidentiality of your account credentials
              and all activities under your account.
            </p>

            <h6 className="fw-bold mt-4">2) Orders & pricing</h6>
            <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.85 }}>
              Product availability, offers, and pricing may change. Orders are confirmed after
              successful checkout.
            </p>

            <h6 className="fw-bold mt-4">3) Returns & refunds (demo)</h6>
            <ul className="text-muted" style={{ fontSize: 14, lineHeight: 1.85 }}>
              <li>Damaged items may be eligible for return/refund (as per policy)</li>
              <li>Refund timelines depend on the payment method</li>
            </ul>

            <h6 className="fw-bold mt-4">4) Prohibited use</h6>
            <ul className="text-muted" style={{ fontSize: 14, lineHeight: 1.85 }}>
              <li>Fraudulent activity or misuse of offers</li>
              <li>Abusive behavior, fake orders, or false claims</li>
            </ul>

            <h6 className="fw-bold mt-4">5) Changes to terms</h6>
            <p className="text-muted mb-0" style={{ fontSize: 14, lineHeight: 1.85 }}>
              We may update these Terms from time to time. Continued use means you accept the
              updated Terms.
            </p>

            {/* ✅ Back to home */}
            <div className="mt-4">
              <Link to="/" className="btn btn-outline-success btn-sm">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}