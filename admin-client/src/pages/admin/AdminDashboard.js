import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import api from "../../api";

const cards = [
  {
    to: "/products",
    title: "Manage Products",
    desc: "Approve / reject vendor products",
    badge: "Approvals",
    tone: "success",
  },
  {
    to: "/vendors",
    title: "Manage Vendors",
    desc: "View vendor activity",
    badge: "Vendors",
    tone: "primary",
  },
  {
    to: "/orders",
    title: "Manage Orders",
    desc: "View all customer orders",
    badge: "Orders",
    tone: "dark",
  },
  {
    to: "/offers",
    title: "Manage Offers",
    desc: "Add / edit offers shown to users",
    badge: "Offers",
    tone: "warning",
  },
  {
    to: "/product-names",
    title: "Product Names",
    desc: "Category-wise master product list",
    badge: "Master",
    tone: "success",
    highlight: true,
  },
  {
  to: "/subscribers",
  title: "Newsletter Subscribers",
  desc: "View subscribed emails",
  badge: "Newsletter",
  tone: "info",
},
{
  to: "/admin/categories",
  title: "Manage Categories",
  desc: "Add / edit categories and subcategories",
  badge: "Categories",
  tone: "secondary",
}

];

/* ✅ NEW: Admin earnings summary */
const COMMISSION_RATE = 0.10;

const calcAdminEarnings = (orders) => {
  const list = Array.isArray(orders) ? orders : [];

  const delivered = list.filter(
    (o) => String(o?.overallStatus || "").toLowerCase() === "delivered"
  );

  const totalSales = delivered.reduce(
    (sum, o) => sum + Number(o?.finalTotal || 0),
    0
  );

  const commission = Math.round(totalSales * COMMISSION_RATE);

  return {
    totalSales,
    commission,
    deliveredOrders: delivered.length,
    commissionRate: COMMISSION_RATE,
    totalOrders: list.length,
  };
};

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
  pendingProducts: 0,
  pendingVendors: 0,
  pendingPayments: 0
});

  const loadOrders = async () => {
    try {
      const res = await api.get("/api/orders/all");
      setOrders(res.data || []);
    } catch (e) {
      setOrders([]);
      console.log(e);
    }
  };
  const loadStats = async () => {
  try {

    const [productsRes, vendorsRes, ordersRes] = await Promise.all([
      api.get("/api/products/all"),
      api.get("/api/admin/vendors"),
      api.get("/api/orders/all"),
    ]);

    const products = productsRes.data || [];
    const vendors = vendorsRes.data || [];
    const orders = ordersRes.data || [];

    const pendingProducts = products.filter(
      (p) => String(p.status).toLowerCase() === "pending"
    ).length;

    const pendingVendors = vendors.filter(
      (v) => String(v.vendorStatus).toLowerCase() === "pending_review"
    ).length;

    const pendingPayments = orders.filter(
      (o) => String(o?.payment?.status).toLowerCase() === "pending"
    ).length;

    setStats({
      pendingProducts,
      pendingVendors,
      pendingPayments
    });

  } catch (e) {
    console.log(e);
  }
};

  useEffect(() => {
  loadOrders();
  loadStats();
}, []);
  const earnings = useMemo(() => calcAdminEarnings(orders), [orders]);
  const ordersTrendData = useMemo(() => {

  const map = {};

  orders.forEach(o => {

   const date = new Date(o.createdAt).toISOString().split("T")[0];
    if(!map[date]){
      map[date] = 0;
    }

    map[date] += 1;

  });

  return Object.keys(map)
.sort((a,b)=> new Date(a) - new Date(b))
.map(d => ({
  date: d,
  orders: map[d]
}));

}, [orders]);

const revenueData = useMemo(() => {

  const map = {};

  orders.forEach(o => {

    const date = new Date(o.createdAt).toLocaleDateString();

    const revenue = Number(o?.finalTotal || 0);

    if(!map[date]){
      map[date] = 0;
    }

    map[date] += revenue;

  });

  return Object.keys(map).map(d => ({
    date: d,
    revenue: map[d]
  }));

}, [orders]);

  return (
  <div className="container-fluid py-4 admin-page" style={{ padding: "24px" }}>
      {/* Header */}
      <div className="admin-header mb-4">
        <h2 className="fw-bold mb-1">Admin Dashboard</h2>
        <div className="text-muted">
          Manage products, vendors, orders, offers,product names, Categories and Newsletter
        </div>
      </div>

      {/* ✅ NEW: Earnings cards (top summary) */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div
            className="rounded-4 p-3 h-100"
            style={{
              border: "1px solid rgba(25,135,84,.10)",
              background: "linear-gradient(135deg, #ffffff, #f8fbf9)",
              boxShadow: "0 10px 22px rgba(0,0,0,.06)",
            }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  Total Sales (Delivered)
                </div>
                <div className="fw-bold" style={{ fontSize: 28, lineHeight: 1.1 }}>
                  ₹{earnings.totalSales}
                </div>
                <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                  {earnings.deliveredOrders} delivered orders
                </div>
              </div>
              <div style={{ fontSize: 22 }}>💰</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div
            className="rounded-4 p-3 h-100"
            style={{
              border: "1px solid rgba(25,135,84,.10)",
              background: "linear-gradient(135deg, #ffffff, #f8fbf9)",
              boxShadow: "0 10px 22px rgba(0,0,0,.06)",
            }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  Commission ({Math.round(earnings.commissionRate * 100)}%)
                </div>
                <div className="fw-bold" style={{ fontSize: 28, lineHeight: 1.1 }}>
                  ₹{earnings.commission}
                </div>
                <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                  Platform earning
                </div>
              </div>
              <div style={{ fontSize: 22 }}>🧾</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div
            className="rounded-4 p-3 h-100"
            style={{
              border: "1px solid rgba(25,135,84,.10)",
              background: "linear-gradient(135deg, #ffffff, #f8fbf9)",
              boxShadow: "0 10px 22px rgba(0,0,0,.06)",
            }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  Total Orders
                </div>
                <div className="fw-bold" style={{ fontSize: 28, lineHeight: 1.1 }}>
                  {earnings.totalOrders}
                </div>
                <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                  All statuses
                </div>
              </div>
              <div style={{ fontSize: 22 }}>📦</div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Analytics */}
<div className="mb-4">

  <h4 className="fw-bold mb-3">Platform Analytics</h4>

  <div className="row g-3">

    {/* Orders Trend */}
    <div className="col-md-6">
      <div
  className="p-3 rounded-4"
  style={{
    background: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)"
  }}
>
        <h6 className="fw-bold mb-2">Orders Trend</h6>

        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={ordersTrendData}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="date"/>
            <YAxis/>
            <Tooltip/>
          <Line
  type="monotone"
  dataKey="orders"
  stroke="#198754"
  strokeWidth={3}
  dot={{ r: 4 }}
/>
          </LineChart>
        </ResponsiveContainer>

      </div>
    </div>

    {/* Revenue Chart */}
    <div className="col-md-6">
      <div
  className="p-3 rounded-4"
  style={{
    background: "#fff",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)"
  }}
>
        <h6 className="fw-bold mb-3">Revenue Overview</h6>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="date"/>
            <YAxis/>
            <Tooltip/>
          <Bar dataKey="revenue" fill="#0d6efd"/>
          </BarChart>
        </ResponsiveContainer>

      </div>
      
    </div>

  </div>

</div>

      {/* Cards */}
      <div className="row g-3">
        {cards.map((c) => (
          <div key={c.to} className="col-12 col-sm-6 col-lg-4">
            <Link to={c.to} className="text-decoration-none">
              <div
                className={`card admin-card2 h-100 ${
                  c.highlight ? "admin-card2-highlight" : ""
                }`}
              >
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span
                      className={`badge admin-badge rounded-pill bg-${c.tone}-subtle text-${c.tone} px-3 py-2`}
                    >
                     {c.to === "/products"
  ? stats.pendingProducts
  : c.to === "/vendors"
  ? stats.pendingVendors
  : c.to === "/orders"
  ? stats.pendingPayments
  : c.badge}
                    </span>

                    <div className="admin-card2-icon" aria-hidden="true">
                      <span className="admin-card2-arrow">→</span>
                    </div>
                  </div>

                  <h5 className="fw-bold text-dark mb-1">{c.title}</h5>
                  <div className="text-muted small">{c.desc}</div>

                  <div className="admin-card2-footer mt-3">
                    <span className="admin-open small">
                      Open module <span className="ms-1">→</span>
                    </span>
                  </div>
                </div>
              </div>

            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
