import { createContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

export const AuthContext = createContext();

const API = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";


// localStorage keys
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

  // axios instance
  const api = useMemo(() => {
    return axios.create({ baseURL: API });
  }, []);

  // attach token to every request
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [token, api]);

  const login = async (email, password) => {
    const e = (email || "").trim().toLowerCase();
    const p = password || "";

    const res = await api.post("/api/auth/login", { email: e, password: p });

    const t = res.data?.token;
    const u = res.data?.user;

    if (!t || !u) throw new Error("Invalid login response from server");

    setToken(t);
    setUser(u);

    localStorage.setItem(LS_TOKEN, t);
    localStorage.setItem(LS_USER, JSON.stringify(u));

    return { token: t, user: u };
  };

  const signup = async (name, email, password) => {
    const n = (name || "").trim();
    const e = (email || "").trim().toLowerCase();
    const p = password || "";

    const res = await api.post("/api/auth/register", {
      name: n,
      email: e,
      password: p,
    });

    // ✅ Confirm backend actually created user
    // Your backend returns 201 on success
    if (res.status !== 201) throw new Error("Signup failed");

    // Optional: backend sends { msg, user }
    // If you want strict check:
    // if (!res.data?.user) throw new Error("Signup failed: user not created");

    return res.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(LS_USER);
    localStorage.removeItem(LS_TOKEN);
    delete api.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
