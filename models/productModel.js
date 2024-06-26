const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  offerPrice: {
    type: Number,
    default: 0,
  },
  categoryDiscountPrice: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
  media: {
    type: [String],
    required: true,
  },
  isUnlisted: {
    type: Boolean,
    default: false,
  },
  createdOn: {
    type: Date,
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
