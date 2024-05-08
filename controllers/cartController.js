require("dotenv").config();

// load controllers
const Product = require("../models/productModel");
const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const Category = require("../models/categoryModel");

// Render Cart.
const loadCart = async (req, res) => {
  try {
    const user = await User.findById(req.session.userData);
    const products = await Product.find({ isUnlisted: false });
    const categories = await Category.find({
      isUnlisted: false,
      isDeleted: false,
    });
    const cart = await Cart.findOne({ userID: req.session.userData }).populate(
      "products.productID"
    );
    let google;
    req.user ? (google = true) : (google = false);
    res.render("cart", {
      categories: categories,
      products: products,
      user: user,
      cart: cart,
      google,
    });
  } catch (error) {
    console.log(`error loading cart page. ${error}`);
  }
};

// Add to Cart.
const addToCart = async (req, res) => {
  const { productId } = req.body;

  try {
    const userId = req.session.userData;

    if (!userId) {
      throw new Error("User ID not found in session");
    }

    let cart = await Cart.findOne({ userID: userId });
    if (!cart) {
      cart = new Cart({ userID: userId, products: [] });
    }

    const existingProduct = cart.products.find((p) =>
      p.productID.equals(productId)
    );
    if (!existingProduct) {
      cart.products.push({ productID: productId, quantity: 1 });
    }

    await cart.save();
    res.status(200).json({ message: "Product added to cart successfully" });
  } catch (error) {
    console.error("Error adding product to cart:", error);
    res.status(500).json({ error: "Failed to add product to cart" });
  }
};

// Checks if a product is already in the Cart.
const checkProductInCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.userData;

    const cart = await Cart.findOne({ userID: userId });

    if (!cart) {
      console.log(`no cart found for the user.`);
      res.status(200).json({ exists: false });
      return;
    }

    const productExists = cart.products.some((p) =>
      p.productID.equals(productId)
    );

    res.status(200).json({ exists: productExists });
  } catch (error) {
    console.error("Error checking product in cart:", error);
    res.status(500).json({ error: "Failed to check product in cart" });
  }
};

// Updaing the quantity.
const updateQuantity = async (req, res) => {
  try {
    const { productId, amount } = req.query;
    const userId = req.session.userData || req.user.id;
    const cart = await Cart.findOne({ userID: userId });
    const existingProduct = cart.products.find((item) =>
      item.productID.equals(productId)
    );
    const parsedAmount = parseInt(amount);
    existingProduct.quantity += parsedAmount;
    await cart.save();
    res.status(200).json({ message: "Quantity updated successfully", cart });
  } catch (error) {
    console.log(`error updating the quantity in the cart: ${error}`);
  }
};

// Remove from Cart.
const deleteItem = async (req, res) => {
  try {
    const { productId } = req.query;
    const userId = req.session.userData || req.user.id;
    const cart = await Cart.findOne({ userID: userId });
    const productIndex = cart.products.findIndex((item) =>
      item.productID.equals(productId)
    );
    if (productIndex === -1) {
      return res.status(404).json({ error: "Product not found in cart" });
    }
    cart.products.splice(productIndex, 1);
    await cart.save();
    res.status(200).json({ message: "Product removed from cart", cart });
  } catch (error) {
    console.log(`error deleteing item.`);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  loadCart,
  addToCart,
  checkProductInCart,
  updateQuantity,
  deleteItem,
};
