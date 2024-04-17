require("dotenv").config();

// load controllers
const Product = require("../models/productModel");
const User = require("../models/userModel");
const Cart = require("../models/cartModel");

// Add to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.session.userData;
    const user = await User.findById(userId);
    console.log(`addToCart: ${user.name}`);

    // await Cart.addItem(productId);
    res.redirect("/my_address");
    // Send a success response
    // res.status(200).json({ message: "Product added to cart successfully" });
  } catch (error) {
    console.error("Error adding product to cart:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  addToCart,
};
