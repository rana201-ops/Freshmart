
require("dotenv").config();
console.log("Stripe Key:", process.env.STRIPE_SECRET_KEY);
require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
});

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

// ✅ Load .env


const connectDB = require("./config/db");

const app = express();

// =====================================
// ✅ CORS (SAFE & CLEAN)
// =====================================
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3002",

  // old IPs optional (you can remove later)
  "http://192.168.29.218:3000",
  "http://192.168.29.218:3001",

  process.env.FRONTEND_URL, // user client tunnel url
  process.env.ADMIN_URL,    // admin url
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Postman/curl
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // ✅ IMPORTANT (preflight)

// =====================================
// ✅ BODY PARSERS (FIX)
// =====================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================
// ✅ STATIC: serve uploaded images
// =====================================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// =====================================
// ✅ Static / basic route
// =====================================
app.get("/", (req, res) => {
  res.send("FreshMart Backend Running 🚀");
});

// =====================================
// ✅ Routes
// =====================================
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/test", require("./routes/test.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/offers", require("./routes/offer.routes"));
app.use("/api/vendor/settings", require("./routes/vendorSettings.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/payments", require("./routes/payment.routes"));

app.use("/api/product-master", require("./routes/productMaster.routes"));
app.use("/api/reviews", require("./routes/review.routes"));
app.use("/api/subscribers", require("./routes/subscriber.routes"));
app.use("/api/categories", require("./routes/category.routes"));
app.use("/api/subCategories", require("./routes/subCategory.routes"));
app.use("/api/subscription", require("./routes/subscription.routes"));
// =====================================
// ✅ CONNECT DB THEN START SERVER
// =====================================
connectDB()
  .then(() => {
    console.log("✅ MongoDB connected");
    console.log("DB NAME:", mongoose.connection.name);
    console.log("DB HOST:", mongoose.connection.host);

    console.log("PAYMENT_MODE:", process.env.PAYMENT_MODE); // ✅ ADD THIS

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
      console.log(
        `👉 Access from phone using: ${
          process.env.BACKEND_URL || `http://192.168.0.101:${PORT}`
        }`
      );
    });
  })
  .catch((err) => {
    console.log("❌ DB Connection Failed:", err.message);
  });
