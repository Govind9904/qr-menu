const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  tableNumber: Number,

  items: [
    {
      foodId: String,
      name: String,
      qty: Number,
      price: Number,
    },
  ],

  status: {
    type: String,
    default: "Pending",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);
