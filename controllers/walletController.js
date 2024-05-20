const Wallet = require("../models/walletModel");
// const Orders = require("../models/orderModel");
const Category = require("../models/categoryModel");
// const Product = require("../models/productModel");
const User = require("../models/userModel");
// const Cart = require("../models/cartModel");
// const { google } = require("../config/keys");
// const Wishlist = require("../models/wishlistModel");

// Render my_wallet
const loadMyWallet = async (req, res) => {
  try {
    // console.log(`loading my wallet...`);
    const userId = req.session.userData;
    // console.log(`userId : ${userId}`);
    const user = await User.findById(userId);
    // console.log(`user : ${user}`);
    const categories = await Category.find({ isUnlisted: false });
    // console.log(`categories : ${categories}`);
    let wallet = await Wallet.findOne({ userId: userId });
    // console.log(`transactions : ${wallet}`);
    if (!wallet) {
      wallet = { userId, walletBalance: 0, transactions: [] };
    }
    // console.log(`transactions : ${wallet}`);
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
