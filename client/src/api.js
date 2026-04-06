import axios from "axios";

const API = (process.env.REACT_APP_API_URL || "http://127.0.0.1:5000").replace(/\/$/, "");

const api = axios.create({
  baseURL: API,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("freshmart_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("freshmart_token");
    }

    console.log(
      "API ERROR:",
      err?.response?.data?.message || err.message
    );

    return Promise.reject(err);
  }
);

export default api;