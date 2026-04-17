const express = require("express");
const router = express.Router();
const Food = require("../models/Food");

router.get("/", async (req, res) => {
  try {
    const food = await Food.find();
    res.json(food);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch food items." });
  }
});

router.post("/add", async (req, res) => {
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
  } catch (error) {
    return res.status(500).json({ message: "Failed to add food item." });
  }
});

module.exports = router;
