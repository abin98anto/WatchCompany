const mongoose = require("mongoose");

const couponSchema = mongoose.Schema({
  couponCode: {
    type: String,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  minPurchase: {
    type: Number,
  },
  discountPercentage: {
    type: Number,
  },
  maxDiscount: {
    type: Number,
  },
  usedList: {
    type: Array,
  },
  createdOn: {
    type: Date,
  },
  isUnlisted: {
    type: Boolean,
    default: false,
  },
});

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
