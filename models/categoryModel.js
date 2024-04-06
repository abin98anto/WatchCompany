const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
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
  },
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
