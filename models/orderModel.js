const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  orderId: {
    type: String,
  },
  products: [
    {
      productPrice: {
        type: Number,
      },
      productName: {
        type: String,
      },
      media: {
        type: String,
      },
      quantity: {
        type: Number,
      },
      price: {
        type: Number,
      },
      subtotal: {
        type: Number,
      },
    },
  ],
  orderStatus: {
    type: String,
  },
  billTotal: {
    type: Number,
  },
  address: {
    type: Object,
  },
  paymentMethod: {
    type: String,
  },
  paymentStatus: {
    type: String,
  },
  createdOn: {
    type: Date,
  },
  showDate: {
    type: String,
  },
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
