const mongoose = require("mongoose");

const cartSchema = mongoose.Schema({
  userID: {
    type: String,
    required: true,
  },
  products: [
    {
      productID: {
        type: String,
      },
      quantity: {
        type: Number,
        default: 1,
      },
    },
  ],
});

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
