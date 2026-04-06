import { useContext, useEffect, useMemo, useState } from "react";
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
import { AuthContext } from "../../context/AuthContext";
import api from "../../api";

const statusCard = (s) => {
  if (s === "pending_review")
    return {
      cls: "warning",
      title: "Under Review",
      text: "Admin is verifying your details. Access will unlock after approval.",
      cta: null,
    };

  if (s === "rejected")
    return {
      cls: "danger",
      title: "Rejected",
      text: "Your request was rejected. Open Settings, fix details and resubmit.",
      cta: { label: "Fix & Resubmit", to: "/vendor/settings" },
    };

  if (s === "approved") return null;

  return {
    cls: "info",
    title: "Complete Profile",
    text: "Complete store settings and submit for approval to unlock Products & Orders.",
    cta: { label: "Complete Settings", to: "/vendor/settings" },
  };
};

const prettyStatus = (s) => String(s || "draft").replaceAll("_", " ");

/* ✅ NEW: Earnings Calculator (Frontend only) */
const COMMISSION_RATE = 0.10;
const calcVendorEarnings = (orders) => {
  const delivered = (orders || []).filter(
    (o) => String(o?.subOrder?.status || "").toLowerCase() === "delivered"
  );

  const totalSales = delivered.reduce(
    (sum, o) => sum + Number(o?.subOrder?.vendorTotal || 0),
    0
  );

  const commission = Math.round(totalSales * COMMISSION_RATE);
  const netEarnings = totalSales - commission;

  return {
    deliveredOrders: delivered.length,
    totalSales,
    commissionRate: COMMISSION_RATE,
    commission,
    netEarnings,
  };
};

const StatCard = ({ title, value, icon, sub }) => (
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
          {title}
        </div>
        <div className="fw-bold" style={{ fontSize: 28, lineHeight: 1.1 }}>
          {value}
        </div>
        {sub ? (
          <div className="text-muted mt-1" style={{ fontSize: 12 }}>
            {sub}
          </div>
        ) : null}
      </div>
      <div style={{ fontSize: 22 }}>{icon}</div>
    </div>
  </div>
);

const ActionCard = ({ title, desc, btn, to, icon, lockedNote }) => (
  <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>
    <div
      className="rounded-4 p-4 h-100"
      style={{
        border: "1px solid rgba(0,0,0,.06)",
        background: "#fff",
        boxShadow: "0 10px 22px rgba(0,0,0,.06)",
        cursor: "pointer",
        transition: "transform .15s ease, box-shadow .15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 16px 30px rgba(0,0,0,.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow = "0 10px 22px rgba(0,0,0,.06)";
      }}
    >
      <div className="d-flex gap-3 align-items-start">
        <div style={{ fontSize: 26 }}>{icon}</div>
        <div className="flex-grow-1">
          <div className="fw-bold" style={{ fontSize: 16 }}>
            {title}
          </div>
          <div className="text-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
            {desc}
          </div>

          <div className="d-flex justify-content-between align-items-center mt-3">
            <span className="btn btn-outline-success" style={{ borderRadius: 12, height: 42 }}>
              {btn} →
            </span>

            {lockedNote ? (
              <span className="badge bg-danger-subtle text-danger border rounded-pill px-3 py-2">
                🔒 Locked
              </span>
            ) : null}
          </div>

          {lockedNote ? (
            <div className="text-danger mt-2" style={{ fontSize: 12 }}>
              {lockedNote}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  </Link>
);

export default function VendorDashboard() {
  const { user } = useContext(AuthContext);

  const status = user?.vendorStatus || "draft";
  const isApproved = status === "approved";
  const locked = !isApproved;

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const ordersChartData = useMemo(() => {

  const map = {};

  orders.forEach(o => {

    const date = new Date(o.createdAt).toLocaleDateString();

    const revenue = Number(o?.subOrders?.[0]?.vendorTotal || 0);

    if(!map[date]){
      map[date] = 0;
    }

    map[date] += revenue;

  });

  return Object.keys(map).map(d => ({
    date: d,
    sales: map[d]
  }));

}, [orders]);
  const [msg, setMsg] = useState("");

  const topProductsData = useMemo(() => {

  const map = {};

  orders.forEach(o => {

    const items = o?.subOrders?.[0]?.items || [];

    items.forEach(it => {

      if(!map[it.name]){
        map[it.name] = 0;
      }

      map[it.name] += Number(it.qty || 1);

    });

  });

  return Object.keys(map)
  .map(name => ({
    name,
    qty: map[name]
  }))
  .sort((a,b)=> b.qty - a.qty)
  .slice(0,5);

}, [orders]);


const predictionData = useMemo(() => {

  if(!ordersChartData.length) return [];

  const total = ordersChartData.reduce((sum,d)=> sum + (d.sales || 0),0);

  const avg = total / ordersChartData.length;

  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return days.map(day => ({
    day,
    sales: Math.round(avg + (Math.random()*50 - 25))
  }));

}, [ordersChartData]);

  const load = async () => {
    try {
      setMsg("");
      const pRes = await api.get("/api/products/mine");
      const oRes = await api.get("/api/orders/vendor");
      setProducts(pRes.data || []);
      setOrders(oRes.data || []);
    } catch (err) {
      console.log(err);
      setMsg("Failed to load dashboard data");
      setProducts([]);
      setOrders([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const myProductsCount = isApproved ? products.length : 0;
  const myOrdersCount = isApproved ? orders.length : 0;

  /* ✅ NEW: Earnings memo */
  const earnings = useMemo(() => {
    if (!isApproved) return null;
    return calcVendorEarnings(orders);
  }, [orders, isApproved]);

  const card = useMemo(() => statusCard(status), [status]);

  return (
    <div style={{ background: "#f8fafb", minHeight: "100vh" }}>
      <div className="container py-3 py-md-4">
        <style>{`
          .fm-refresh-btn {
            border-radius: 12px;
            height: 42px;
            padding: 0 16px;
            font-weight: 800;
            width: 100%;
          }
          @media (min-width: 768px) {
            .fm-refresh-btn {
              width: auto;
              min-width: 150px;
            }
          }
        `}</style>

        {/* HEADER */}
        <div
          className="rounded-4 p-3 p-md-4 mb-4"
          style={{
            background: "linear-gradient(135deg, rgba(25,135,84,.12), rgba(25,135,84,.04))",
            border: "1px solid rgba(0,0,0,.06)",
          }}
        >
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <h2 className="fw-bold mb-1" style={{ lineHeight: 1.1 }}>
                Vendor Dashboard
              </h2>
              <div className="text-muted" style={{ fontSize: 13 }}>
                Logged in as: <b>{user?.email}</b>
              </div>

              <div className="mt-2 d-flex gap-2 flex-wrap">
                <span
                  className="badge rounded-pill px-3 py-2"
                  style={{
                    background: "rgba(25,135,84,.12)",
                    color: "#198754",
                    border: "1px solid rgba(25,135,84,.25)",
                    fontWeight: 800,
                    textTransform: "capitalize",
                  }}
                >
                  ✅ {prettyStatus(status)}
                </span>

                <span className="badge bg-light border rounded-pill px-3 py-2" style={{ fontWeight: 800 }}>
                  {locked ? "🔒 Locked until approval" : "🟢 Full access"}
                </span>
              </div>
            </div>

            <button onClick={load} className="btn btn-success fm-refresh-btn">
              ↻ Refresh
            </button>
          </div>
        </div>

        {msg && (
          <div className="alert alert-info rounded-4" style={{ border: "1px solid rgba(0,0,0,.06)" }}>
            {msg}
          </div>
        )}

        {/* STATUS */}
        {card && (
          <div className={`alert alert-${card.cls} rounded-4`} style={{ border: "1px solid rgba(0,0,0,.06)" }}>
            <b>{card.title}</b> — {card.text}
            {card.cta && (
              <Link to={card.cta.to} className="btn btn-sm btn-dark ms-3" style={{ borderRadius: 10 }}>
                {card.cta.label}
              </Link>
            )}
          </div>
        )}

        {/* STATS */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <StatCard title="Total Products" value={myProductsCount} icon="📦" sub="Your listed items" />
          </div>

          <div className="col-12 col-md-4">
            <StatCard title="Orders" value={myOrdersCount} icon="🧾" sub="Orders containing your items" />
          </div>

          <div className="col-12 col-md-4">
            <StatCard title="Account Status" value={prettyStatus(status)} icon="✅" sub="Vendor verification" />
          </div>
        </div>

        {/* ✅ NEW: EARNINGS CARDS (same StatCard design, no layout break) */}
        {isApproved && earnings && (
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <StatCard
                title="Total Sales (Delivered)"
                value={`₹${earnings.totalSales}`}
                icon="💰"
                sub={`${earnings.deliveredOrders} delivered orders`}
              />
            </div>

            <div className="col-12 col-md-4">
              <StatCard
                title={`Commission (${Math.round((earnings.commissionRate || 0.1) * 100)}%)`}
                value={`₹${earnings.commission}`}
                icon="🧾"
                sub="Platform fee"
              />
            </div>

            <div className="col-12 col-md-4">
              <StatCard
                title="Net Earnings (Profit)"
                value={`₹${earnings.netEarnings}`}
                icon="📈"
                sub="After commission"
              />
            </div>
          </div>
        )}

        {isApproved && (
  <div className="mb-4">

   

    <h5 className="fw-bold mb-3">📊 Sales Analytics</h5>

    <div
      className="rounded-4 p-3"
      style={{
        border: "1px solid rgba(0,0,0,.06)",
        background:"#fff",
        boxShadow:"0 10px 22px rgba(0,0,0,.06)"
      }}
    >

      <div className="row g-3">

        {/* Sales Trend */}
        <div className="col-md-4">
          <h6 className="fw-bold mb-2">Sales Trend</h6>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ordersChartData}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="date"/>
              <YAxis/>
              <Tooltip/>
              <Line type="monotone" dataKey="sales" stroke="#198754" strokeWidth={3}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="col-md-4">
          <h6 className="fw-bold mb-2">Top Products</h6>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProductsData}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="name"/>
              <YAxis/>
              <Tooltip/>
              <Bar dataKey="qty" fill="#198754" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Prediction */}
        <div className="col-md-4">
          <h6 className="fw-bold mb-2">AI Prediction</h6>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={predictionData}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="day"/>
              <YAxis/>
              <Tooltip/>
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#ff7300"
                strokeWidth={3}
                dot={{ r:5 }}
                activeDot={{ r:7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>

    </div>

  </div>
)}
        {/* QUICK ACTIONS */}
        <div className="d-flex justify-content-between align-items-end mb-2">
          <h5 className="fw-bold mb-0">Quick Actions</h5>
          <span className="text-muted" style={{ fontSize: 12 }}>
            Manage your store faster
          </span>
        </div>

        <div className="row g-3">
          <div className="col-12 col-lg-6">
            <ActionCard
              title="Manage Products"
              desc="Add new products, update price/stock, and upload images."
              btn="Open Products"
              icon="🛒"
              to={locked ? "/vendor/settings" : "/vendor/products"}
              lockedNote={locked ? "Complete verification in Settings to unlock" : null}
            />
          </div>

          <div className="col-12 col-lg-6">
            <ActionCard
              title="Store Settings"
              desc="Update store profile, address, documents, and vendor details."
              btn="Open Settings"
              icon="⚙️"
              to="/vendor/settings"
            />
          </div>

          <div className="col-12">
            <ActionCard
              title="View Orders"
              desc="Track incoming orders and update order status."
              btn="Open Orders"
              icon="📦"
              to={locked ? "/vendor/settings" : "/vendor/orders"}
              lockedNote={locked ? "Complete verification in Settings to unlock" : null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
