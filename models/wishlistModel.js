const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  products: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
      createdOn: {
        type: Date,
        default: Date.now(),
      },
    },
  ],
  createdOn: {
    type: Date,
    default: Date.now(),
  },
});

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

module.exports = Wishlist;
