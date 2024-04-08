const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    // required: true,
  },
  isAdmin: {
    type: String,
    default: 0,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  createdOn: {
    type: Date,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
