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
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;