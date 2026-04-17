const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

router.post("/orders", async (req, res) => {
  try {
    const { tableNumber, items } = req.body;

    if (!Number.isInteger(tableNumber) || tableNumber <= 0) {
      return res.status(400).json({ message: "tableNumber must be a positive integer." });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order must include at least one item." });
    }

    const hasInvalidItem = items.some(
      (item) =>
        !item.name ||
        typeof item.price !== "number" ||
        item.price < 0 ||
        !Number.isInteger(item.qty) ||
        item.qty <= 0
    );

    if (hasInvalidItem) {
      return res.status(400).json({
        message: "Each item must have name, numeric price, and positive integer qty.",
      });
    }

    const order = new Order({
      tableNumber,
      items,
    });

    await order.save();

    return res.status(201).json({
      message: "Order placed successfully",
      orderId: order._id,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to place order." });
  }
});

router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch orders." });
  }
});

router.put("/orders/:id", async (req, res) => {
  try {
    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { status: "Completed" },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Order not found." });
    }

    return res.json({ message: "Order completed" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update order." });
  }
});

module.exports = router;
