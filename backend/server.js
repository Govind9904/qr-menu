const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const foodRoutes = require("./routes/foodRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors());
app.use(express.json());


mongoose
  .connect("mongodb://127.0.0.1:27017/qrmenu")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));


app.get("/", (req, res) => {
  res.send("QR Menu API Running");
});

app.use("/foods", foodRoutes);
app.use("/", orderRoutes);
app.use("/admin", adminRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
