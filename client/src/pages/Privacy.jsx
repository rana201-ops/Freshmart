// ✅ Privacy.jsx (final)
import { Link } from "react-router-dom";
import PageTitle from "../components/common/PageTitle";

export default function Privacy() {
  return (
    <>
      <PageTitle title="Privacy Policy" />

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
          <h2 className="fw-bold mb-1">Privacy Policy</h2>
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
              At <b>FreshMart</b>, we value your trust. This Privacy Policy explains how we
              collect, use, and protect your personal information when you use our website/app.
            </p>

            <hr className="my-4" />

            <h6 className="fw-bold">1) Information we collect</h6>
            <ul className="text-muted" style={{ fontSize: 14, lineHeight: 1.85 }}>
              <li>Account details: name, email</li>
              <li>Delivery information: address, phone (if provided)</li>
              <li>Order information: items purchased, order history</li>
              <li>Device/log data: basic analytics to improve experience</li>
            </ul>

            <h6 className="fw-bold mt-4">2) How we use your information</h6>
            <ul className="text-muted" style={{ fontSize: 14, lineHeight: 1.85 }}>
              <li>To create and manage your account</li>
              <li>To process orders and provide delivery updates</li>
              <li>To provide customer support</li>
              <li>To improve product recommendations and user experience</li>
            </ul>

            <h6 className="fw-bold mt-4">3) Payments</h6>
            <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.85 }}>
              We do not store your card details on our servers. Payments are processed securely
              via trusted payment providers (demo project).
            </p>

            <h6 className="fw-bold mt-4">4) Data security</h6>
            <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.85 }}>
              We use standard security practices to protect your information. Please keep your
              password confidential.
            </p>

            <h6 className="fw-bold mt-4">5) Contact</h6>
            <p className="text-muted mb-0" style={{ fontSize: 14, lineHeight: 1.85 }}>
              For privacy questions, contact: <b>support@freshmart.com</b>
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