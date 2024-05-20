const Category = require("../models/categoryModel");
const User = require("../models/userModel");
const Cart = require("../models/cartModel");
require("dotenv").config();


const loadCheckout = async (req, res) => {
  try {
    const Categories = await Category.find({ isUnlisted: false });
    let google;
    req.user ? (google = true) : (google = false);
    const id = req.session.userData || req.user;
    const user = await User.findById(id);
    const cart = await Cart.findOne({ userID: req.session.userData }).populate(
      "products.productID"
    );
    res.render("checkout", {
      categories: Categories,
      google,
      user,
      cart,
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.log(`error loading the checkout page.`);
  }
};

const getAddress = async (req, res) => {
  try {
    const { index } = req.query;
    const id = req.session.userData || req.user.id;
    const user = await User.findById(id);
    const address = user.address[index];
    return res.status(200).json({ address });
  } catch (error) {
    console.log(`error getting the adress.`);
  }
};

const updateAddress = async (req, res) => {
  try {
    const { index } = req.query;
    const { houseName, street, city, state, country, pincode, phoneNumber } =
      req.body;

    try {
      const userId = req.session.userData || req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const addressToUpdate = user.address[index];

      if (!addressToUpdate) {
        return res.status(404).json({ message: "Address not found" });
      }

      addressToUpdate.houseName = houseName;
      addressToUpdate.street = street;
      addressToUpdate.city = city;
      addressToUpdate.state = state;
      addressToUpdate.country = country;
      addressToUpdate.pincode = pincode;
      addressToUpdate.phoneNumber = phoneNumber;
      await user.save();
      res.status(200).json({ address: addressToUpdate });
    } catch (error) {
      console.error("Error updating address:", error);
      res
        .status(500)
        .json({ message: "Failed to update address. Please try again." });
    }
  } catch (error) {
    console.log(`error updating the address.`);
  }
};

module.exports = {
  loadCheckout,
  getAddress,
  updateAddress,
};
