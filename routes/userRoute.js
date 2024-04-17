const express = require("express");
const user_route = express.Router();
const userAuth = require("../middleware/userAuth");

// Loading Controllers.
const userController = require("../controllers/userController");
const cartController = require("../controllers/cartController");

// Loads Landing Page.
user_route.get("/", userController.loadLandingPage);
user_route.post('/add_to_cart', cartController.addToCart);

// Signup Process.
user_route.get("/signup", userAuth.isLogout, userController.loadSignUp);
user_route.post("/signup", userController.sendOTP);
user_route.post("/otp", userController.verifyOTP);
user_route.post("/check-email", userController.checkEmail);
user_route.post("/resend-otp", userController.resendOTP);

// Login Process.
user_route.get("/login", userAuth.isLogout, userController.loadLogin);
user_route.post("/login", userController.verifyLogin);

// User Logout Function.
user_route.get("/logout", userController.logoutUser);

// Shop Page.
user_route.get("/shop", userController.loadShop);
user_route.get("/filterByCategory", userController.filterCategory);

// Cart Page.
user_route.get("/cart", userController.loadCart);

//Settings Page.
user_route.get("/my_profile", userAuth.isLogin, userController.loadMyProfile);
user_route.post("/my_profile", userController.updateProfile);
user_route.get("/my_address", userAuth.isLogin, userController.loadMyAddress);
user_route.post("/add_address", userController.addAddress);
user_route.post("/update_address", userController.updateAddress);
user_route.get("/my_orders", userAuth.isLogin, userController.loadMyOrders);
user_route.get("/my_wallet", userAuth.isLogin, userController.loadMyWallet);

// Single Product Page.
user_route.get("/load_product", userController.loadProduct);

module.exports = user_route;
