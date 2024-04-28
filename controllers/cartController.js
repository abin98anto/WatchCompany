require("dotenv").config();

// load controllers
const Product = require("../models/productModel");
const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const Category = require("../models/categoryModel");

// cart page.
const loadCart = async (req, res) => {
  try {
    // console.log(`req.body: ${req.body}`);
    const user = await User.findById(req.session.userData);
    const products = await Product.find({ isUnlisted: false });
    const categories = await Category.find({
      isUnlisted: false,
      isDeleted: false,
    });
    const cart = await Cart.findOne({ userID: req.session.userData }).populate(
      "products.productID"
    );
    // const populatedCart = cart.products.map((item) => ({
    //   productID: item.productID,
    //   quantity: item.quantity,
    // }));

    // console.log(populatedCart);
    // console.log(cart);
    res.render("cart", {
      categories: categories,
      products: products,
      user: user,
      cart: cart,
      google: "",
    });
  } catch (error) {
    console.log(`error loading cart page. ${error}`);
  }
};

const addToCart = async (req, res) => {
  const { productId } = req.body;

  try {
    // Retrieve userID from the session
    const userId = req.session.userData;

    if (!userId) {
      throw new Error("User ID not found in session");
    }

    // Find or create cart associated with the user
    let cart = await Cart.findOne({ userID: userId });

    if (!cart) {
      console.log(`Creating new cart for the user.`);
      // Create a new cart if one doesn't exist
      cart = new Cart({ userID: userId, products: [] });
    }

    // Check if the product is already in the cart
    const existingProduct = cart.products.find((p) =>
      p.productID.equals(productId)
    );

    if (existingProduct) {
      console.log(`Product exists in the cart, increasing the quantity.`);
      // Increase quantity if the product is already in the cart
      existingProduct.quantity++;
    } else {
      console.log(`Adding a new product to the cart.`);
      // Add the product to the cart with quantity 1
      cart.products.push({ productID: productId, quantity: 1 });
    }

    // Save the updated cart
    await cart.save();

    // Send success response
    res.status(200).json({ message: "Product added to cart successfully" });
  } catch (error) {
    console.error("Error adding product to cart:", error);
    // Send failure response
    res.status(500).json({ error: "Failed to add product to cart" });
  }
};

// Checks if the product is in the Cart.
const checkProductInCart = async (req, res) => {
  const { productId } = req.body;
  const userId = req.session.userData;

  try {
    // Find the cart associated with the user
    const cart = await Cart.findOne({ userID: userId });

    if (!cart) {
      console.log(`no cart found for the user.`);
      res.status(200).json({ exists: false });
      return;
    }

    // Check if the product exists in the cart
    const productExists = cart.products.some((p) =>
      p.productID.equals(productId)
    );

    res.status(200).json({ exists: productExists });
  } catch (error) {
    console.error("Error checking product in cart:", error);
    res.status(500).json({ error: "Failed to check product in cart" });
  }
};

module.exports = {
  loadCart,
  addToCart,
  checkProductInCart,
};
