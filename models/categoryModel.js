const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  categoryDiscount: {
    type: Number,
    default: 0,
  },
  isUnlisted: {
    type: Boolean,
    default: false,
  },
  createdOn: {
    type: Date,
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
