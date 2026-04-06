import React from "react";

export default function AuthGateModal({ open, message, onClose, onLogin, onSignup }) {
  if (!open) return null;

  return (
    <>
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1050 }}
        onClick={onClose}
      />

      <div className="modal fade show" style={{ display: "block", zIndex: 1055 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: 16 }}>
            <div className="modal-header">
              <h5 className="modal-title">Login required</h5>
              <button className="btn-close" onClick={onClose} />
            </div>

            <div className="modal-body">
              <div className="text-muted" style={{ lineHeight: 1.6 }}>
                {message || "Please login/register to continue."}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-light border" onClick={onClose}>Cancel</button>
              <button className="btn btn-outline-success" onClick={onSignup}>Register</button>
              <button className="btn btn-success" onClick={onLogin}>Login</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}