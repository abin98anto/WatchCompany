const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const walletSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  walletBalance: {
    type: Number,
    default: 0,
  },
  transactions: [
    {
      transactionType: {
        type: String,
      },
      amount: {
        type: Number,
      },
      createdOn: {
        type: Date,
        default: Date.now(),
      },
      description: {
        type: String,
      },
      orderId: {
        type: String,
      },
    },
  ],
});

const Wallet = mongoose.model("Wallet", walletSchema);
module.exports = Wallet;
