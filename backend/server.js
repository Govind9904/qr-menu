const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const foodRoutes = require("./routes/foodRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const Admin = require("./models/Admin");

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://192.168.1.44:5173";
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/qrmenu";
const PORT = process.env.PORT || 8000;

// Enable CORS
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));
app.use(express.json());

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");

    const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin";

    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await Admin.create({ email: adminEmail, passwordHash });
      console.log(`Created default admin user: ${adminEmail}`);
    }
  })
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("QR Menu API Running");
});

app.use("/foods", foodRoutes);
app.use("/", orderRoutes);
app.use("/admin", adminRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});