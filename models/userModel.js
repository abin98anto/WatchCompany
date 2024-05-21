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
  address: [
    {
      houseName: {
        type: String,
      },
      street: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      country: {
        type: String,
      },
      pincode: {
        type: Number,
      },
      phoneNumber: {
        type: Number,
      },
      addressType: {
        type: String,
      },
    },
  ],
  referralCode: {
    type: String,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
