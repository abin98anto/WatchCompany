const Wallet = require("../models/walletModel");
const Category = require("../models/categoryModel");
const User = require("../models/userModel");

// Render my_wallet
const loadMyWallet = async (req, res) => {
  try {
    const userId = req.session.userData;
    const user = await User.findById(userId);
    const categories = await Category.find({ isUnlisted: false });
    let wallet = await Wallet.findOne({ userId: userId });
    if (!wallet) {
      wallet = new Wallet({ userId, walletBalance: 0, transactions: [] });
      await wallet.save();
    }
    let google;
    req.user
      ? ((google = true), (logout = "/auth/logout"))
      : ((google = false), (logout = "/logout"));
    res.render("my_wallet", {
      categories: categories,
      user: user,
      google: google,
      logout,
      wallet,
    });
  } catch (error) {
    console.log(`Error loading my_wallet: ${error}`);
  }
};

module.exports = {
  loadMyWallet,
};
