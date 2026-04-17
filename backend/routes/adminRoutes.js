const express = require("express");
const Food = require("../models/Food");
const Order = require("../models/Order");
const {
  TOKEN_TTL_MS,
  createAdminSession,
  deleteAdminSession,
  getTokenFromHeader,
  requireAdminAuth,
  validateAdminSession,
} = require("../middleware/adminAuth");

const router = express.Router();

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  if (username !== ADMIN_USER || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Invalid username or password." });
  }

  const { token, expiresAt } = createAdminSession();
  return res.json({
    token,
    expiresAt,
    expiresInMs: TOKEN_TTL_MS,
    username: ADMIN_USER,
  });
});

router.get("/session", (req, res) => {
  const token = getTokenFromHeader(req.headers.authorization);

  if (!validateAdminSession(token)) {
    return res.status(401).json({ message: "Session expired" });
  }

  return res.json({ ok: true });
});

router.post("/logout", requireAdminAuth, (req, res) => {
  deleteAdminSession(req.adminToken);
  return res.json({ message: "Logged out" });
});

router.get("/foods", requireAdminAuth, async (req, res) => {
  try {
    const foods = await Food.find();
    return res.json(foods);
  } catch {
    return res.status(500).json({ message: "Failed to fetch menu items." });
  }
});

router.post("/foods/add", requireAdminAuth, async (req, res) => {
  try {
    const { name, price, category } = req.body;

    if (!name || !category || typeof price !== "number" || price <= 0) {
      return res.status(400).json({
        message: "Invalid food payload. name, category, and positive price are required.",
      });
    }

    const food = new Food(req.body);
    await food.save();
    return res.status(201).json(food);
  } catch {
    return res.status(500).json({ message: "Failed to add menu item." });
  }
});

router.get("/orders", requireAdminAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.json(orders);
  } catch {
    return res.status(500).json({ message: "Failed to fetch orders." });
  }
});

module.exports = router;
