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
      productId: {
        type: String,
      },
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
      cancelProduct: {
        type: Boolean,
        default: false,
      },
      cancelReason: {
        type: String,
        default: "",
      },
      returnProduct: {
        type: Boolean,
        default: false,
      },
      returnReason: {
        type: String,
        default: "",
      },
      productStatus: {
        type: String,
        default: "pending",
      },
    },
  ],
  orderStatus: {
    type: String,
  },
  billTotal: {
    type: Number,
  },
  discount: {
    type: Number,
  },
  subTotal: {
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
  cancelAll: {
    type: Boolean,
    default: false,
  },
  cancelReason: {
    type: String,
    default: "",
  },
  returnAll: {
    type: Boolean,
    default: false,
  },
  returnReason: {
    type: String,
    default: "",
  },
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
