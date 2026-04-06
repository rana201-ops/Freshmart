import { useState } from "react";
import axios from "axios";

const ForgotPassword = () => {

  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    if (!email) {
      setMsg("Please enter your email");
      return;
    }

    try {

      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        { email }
      );

      setLoading(false);

      setMsg(res.data.msg);

    } catch (err) {

      setLoading(false);
      setMsg(err?.response?.data?.msg || "Something went wrong");

    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 72px - 64px)",
        display: "flex",
        alignItems: "center"
      }}
    >
      <div className="container" style={{ maxWidth: 500 }}>

        <div className="card p-4">

          <h5 className="fw-bold mb-3">Forgot Password</h5>

          <p className="text-muted" style={{ fontSize: 13 }}>
            Enter your registered email to reset your password.
          </p>

          {msg && (
            <div className="alert alert-info">
              {msg}
            </div>
          )}

          <form onSubmit={submit}>

            <label className="form-label">Email</label>

            <input
              type="email"
              className="form-control mb-3"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button
              className="btn btn-success w-100"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

          </form>

        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;