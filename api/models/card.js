const mongoose = require("mongoose");
const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' }, // Référence à Car
    quantity: Number,
  });
  
  
  
  const Cart = mongoose.model("Cart", cartSchema);
  module.exports =  Cart
