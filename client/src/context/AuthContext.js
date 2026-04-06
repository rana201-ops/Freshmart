import { createContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

export const AuthContext = createContext();

const API = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

const LS_USER = "freshmart_user";
const LS_TOKEN = "freshmart_token";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem(LS_USER);
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem(LS_TOKEN) || null;
  });

  // ✅ NEW: Auth Popup/Modal State (global)
  const [authModal, setAuthModal] = useState({
    open: false,
    message: "",
    from: "/",
  });

  // ✅ NEW: open / close modal helpers
  const openAuthModal = (message = "Please login/register to continue.", from = "/") => {
    setAuthModal({ open: true, message, from });
  };

  const closeAuthModal = () => {
    setAuthModal((p) => ({ ...p, open: false }));
  };

  const api = useMemo(() => axios.create({ baseURL: API }), []);

  // ✅ keep axios header in sync with token state
  useEffect(() => {
    if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    else delete api.defaults.headers.common["Authorization"];
  }, [token, api]);

  const login = async (email, password) => {
    const e = (email || "").trim().toLowerCase();
    const p = password || "";

    const res = await api.post("/api/auth/login", { email: e, password: p });

    const t = res.data?.token;
    const u = res.data?.user;

    if (!t || !u) throw new Error("Invalid login response from server");
    if (u?.role === "admin") throw new Error("Admin login not allowed in client");

    const fixedUser =
      u?.role === "vendor"
        ? { ...u, vendorStatus: u.vendorStatus || "draft" }
        : u;

    // ✅ IMPORTANT: set axios header immediately
    api.defaults.headers.common["Authorization"] = `Bearer ${t}`;

    setToken(t);
    setUser(fixedUser);

    localStorage.setItem(LS_TOKEN, t);
    localStorage.setItem(LS_USER, JSON.stringify(fixedUser));

    // ✅ NEW: login success => close popup if open
    setAuthModal((prev) => ({ ...prev, open: false }));

    return { token: t, user: fixedUser };
  };

  const signup = async (name, email, password, role = "user", shopName = "") => {
    const n = (name || "").trim();
    const e = (email || "").trim().toLowerCase();
    const p = password || "";

    const safeRole = role === "vendor" ? "vendor" : "user";

    const payload = { name: n, email: e, password: p, role: safeRole };
    if (safeRole === "vendor") payload.shopName = (shopName || "").trim();

    const res = await api.post("/api/auth/register", payload);
    if (res.status !== 201) throw new Error("Signup failed");

    return res.data;
  };

  // ✅ Refresh user (fix 401) — send token explicitly
  const refreshUser = async () => {
    try {
      const t = localStorage.getItem(LS_TOKEN);
      if (!t) return;

      const res = await api.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${t}` },
      });

      const u = res.data?.user;

      if (u) {
        const fixedUser =
          u?.role === "vendor"
            ? { ...u, vendorStatus: u.vendorStatus || "draft" }
            : u;

        setUser(fixedUser);
        localStorage.setItem(LS_USER, JSON.stringify(fixedUser));
      }
    } catch (err) {
      console.log("refreshUser failed", err?.response?.data || err.message);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(LS_USER);
    localStorage.removeItem(LS_TOKEN);
    delete api.defaults.headers.common["Authorization"];

    // ✅ NEW: logout => close modal also
    setAuthModal((prev) => ({ ...prev, open: false }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        signup,
        logout,
        refreshUser,

        // ✅ NEW exports for popup/modal
        authModal,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;