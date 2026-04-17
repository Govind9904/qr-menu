const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
    name : String,
    price : Number,
    category : String,
    image : String,
    description : String
})

module.exports = mongoose.model("Food",foodSchema);