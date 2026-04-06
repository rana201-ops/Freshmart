import { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {

  const { token } = useParams();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [strength, setStrength] = useState("");
  const [show, setShow] = useState(false);

  // password strength checker
  const checkStrength = (value) => {

    if (value.length < 6) {
      setStrength("Weak");
    } else if (value.length < 10) {
      setStrength("Medium");
    } else {
      setStrength("Strong");
    }

  };

  const submit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      setMsg("Password must be at least 6 characters");
      return;
    }

    if (password !== confirm) {
      setMsg("Passwords do not match");
      return;
    }

    try {

      await axios.post(
        `http://localhost:5000/api/auth/reset-password/${token}`,
        { password }
      );

      setMsg("Password updated successfully");

      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);

    } catch (err) {

      setMsg(err?.response?.data?.msg || "Reset failed");

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

          <h5 className="fw-bold mb-3">Reset Password</h5>

          <div className="alert alert-warning">
            This reset link will expire in 15 minutes
          </div>

          {msg && (
            <div className="alert alert-info">
              {msg}
            </div>
          )}

          <form onSubmit={submit}>

            {/* Password */}
            <label className="form-label">New Password</label>

            <div className="input-group mb-2">

              <input
                type={show ? "text" : "password"}
                className="form-control"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  checkStrength(e.target.value);
                }}
              />

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShow(!show)}
              >
                {show ? "Hide" : "Show"}
              </button>

            </div>

            {/* Strength indicator */}
            {strength && (
              <small
                style={{
                  color:
                    strength === "Weak"
                      ? "red"
                      : strength === "Medium"
                      ? "orange"
                      : "green"
                }}
              >
                Password Strength: <b>{strength}</b>
              </small>
            )}

            {/* Confirm password */}
            <label className="form-label mt-3">
              Confirm Password
            </label>

            <input
              type="password"
              className="form-control mb-3"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />

            <button className="btn btn-success w-100">
              Update Password
            </button>

          </form>

        </div>
      </div>
    </div>
  );
};

export default ResetPassword;