const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("./config/db");
const User = require("./models/User");

const seedUsers = async () => {
  try {
    await connectDB();

    // ✅ Admin
    const adminEmail = "admin@gmail.com";
    const adminPass = "admin123";

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const hash = await bcrypt.hash(adminPass, 10);
      admin = await User.create({
        name: "Admin",
        email: adminEmail,
        password: hash,
        role: "admin",
      });
      console.log("✅ Admin created:", admin.email);
    } else {
      console.log("ℹ️ Admin already exists:", admin.email);
    }

    // ✅ Vendor
    const vendorEmail = "vendor@gmail.com";
    const vendorPass = "vendor123";

    let vendor = await User.findOne({ email: vendorEmail });
    if (!vendor) {
      const hash = await bcrypt.hash(vendorPass, 10);
      vendor = await User.create({
        name: "Vendor",
        email: vendorEmail,
        password: hash,
        role: "vendor",
      });
      console.log("✅ Vendor created:", vendor.email);
    } else {
      console.log("ℹ️ Vendor already exists:", vendor.email);
    }

    console.log("✅ Seeding done.");
    process.exit();
  } catch (err) {
    console.log("❌ Seed error:", err.message);
    process.exit(1);
  }
};

seedUsers();
