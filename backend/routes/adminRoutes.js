const express = require("express");
const bcrypt = require("bcryptjs");
const Food = require("../models/Food");
const Order = require("../models/Order");
const Admin = require("../models/Admin");
const {
  TOKEN_TTL_MS,
  createAdminSession,
  deleteAdminSession,
  getTokenFromHeader,
  requireAdminAuth,
  validateAdminSession,
} = require("../middleware/adminAuth");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const admin = await Admin.findOne({ email });
  if (!admin) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const passwordMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const { token, expiresAt } = createAdminSession();
  return res.json({
    token,
    expiresAt,
    expiresInMs: TOKEN_TTL_MS,
    email: admin.email,
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

router.put("/foods/:id", requireAdminAuth, async (req, res) => {
  try {
    const { name, category, price, description } = req.body;
    const update = {};

    if (name) update.name = name;
    if (category) update.category = category;
    if (typeof price === "number" && price > 0) update.price = price;
    if (description !== undefined) update.description = description;

    const updated = await Food.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Menu item not found." });
    }

    return res.json(updated);
  } catch {
    return res.status(500).json({ message: "Failed to update menu item." });
  }
});

router.delete("/foods/:id", requireAdminAuth, async (req, res) => {
  try {
    const deleted = await Food.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Menu item not found." });
    }

    return res.json({ message: "Menu item deleted." });
  } catch {
    return res.status(500).json({ message: "Failed to delete menu item." });
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

router.put("/orders/:id/complete", requireAdminAuth, async (req, res) => {
  try {
    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { status: "Completed" },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Order not found." });
    }

    return res.json({ message: "Order completed.", order: updated });
  } catch {
    return res.status(500).json({ message: "Failed to update order." });
  }
});

module.exports = router;
