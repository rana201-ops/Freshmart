const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is undefined");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log(" MongoDB connected");
  } catch (err) {
    console.log(" MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
