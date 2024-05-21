const mongoose = require("mongoose");

const referralSchema = mongoose.Schema({
  offerAmount: {
    type: Number,
  },
});

const Referral = mongoose.model("Referral", referralSchema);

module.exports = Referral;
