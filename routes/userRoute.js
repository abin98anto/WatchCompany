const express = require("express");
const user_route = express.Router();
const userAuth = require("../middleware/userAuth");

// Loading Controllers.
const userController = require("../controllers/userController");
const cartController = require("../controllers/cartController");
const productController = require("../controllers/productsController");
const checkoutController = require("../controllers/checkoutController");
const orderController = require("../controllers/orderController");

// Loads Landing Page.
user_route.get("/", userController.loadLandingPage);

// Signup Process.
user_route.get("/signup", userAuth.isLogout, userController.loadSignUp);
user_route.post("/signup", userController.sendOTP);
user_route.post("/otp", userController.verifyOTP);
user_route.post("/check-email", userController.checkEmail);
user_route.post("/resend-otp", userController.resendOTP);

// Login Process.
user_route.get("/login", userAuth.isLogout, userController.loadLogin);
user_route.post("/login", userController.verifyLogin);
user_route.get(
  "/forgot_password",
  userAuth.isLogout,
  userController.loadForgotPassword
);
user_route.post("/forgotPassword_otp", userController.passwordOTP);
user_route.post("/forgotPassword_verifyotp", userController.passwordVerifyOTP);
user_route.post("/updatePassword", userController.changePassword);

// User Logout Function.
user_route.get("/logout", userController.logoutUser);

// Shop Page.
user_route.get("/shop", userController.loadShop);
user_route.get("/products/byCategory", userController.byCategory);
user_route.get("/products/sort_by", userController.sortingProducts);
user_route.get("/products/search", userController.searchProducts);
user_route.get("/get_products", userController.getProducts);

// Cart functionalities.
user_route.get("/cart", userAuth.isLogin, cartController.loadCart);
user_route.post("/add_to_cart", cartController.addToCart);
user_route.post("/check_product_in_cart", cartController.checkProductInCart);
user_route.post("/updateQuantity", cartController.updateQuantity);
user_route.post("/deleteItem", cartController.deleteItem);
user_route.get("/checkStock", productController.checkStock);
user_route.get("/checkout", userAuth.isLogin, checkoutController.loadCheckout);
user_route.post("/get_address", checkoutController.getAddress);
user_route.post("/update_address", checkoutController.updateAddress);
user_route.delete("/delete_address", userController.deleteAddress);
user_route.post("/createOrder", orderController.addOrder);

// Profile page.
user_route.get("/my_profile", userAuth.isLogin, userController.loadMyProfile);
user_route.post("/update_profile", userController.updateProfile);
user_route.post("/reset_password", userController.resetPassword);
user_route.get("/my_address", userAuth.isLogin, userController.loadMyAddress);
user_route.post("/add_address", userController.addAddress);
user_route.delete("/delete_address", userController.deleteAddress);
user_route.post("/update_address", userController.updateAddress);

// My Orders page.
user_route.get("/my_orders", userAuth.isLogin, userController.loadMyOrders);
user_route.get("/order", userAuth.isLogin, orderController.loadSingleOrder);
user_route.put(
  "/cancelOrder/:orderId/:productId",
  orderController.cancelProduct
);
user_route.put("/cancelOrder", orderController.cancelOrder);
user_route.put("/returnProduct", orderController.returnProduct);
user_route.get(
  "/return_order",
  userAuth.isLogin,
  orderController.loadReturnSingleOrder
);
user_route.put("/returnOrder", orderController.returnOrder);

// My Wallet Page.
user_route.get("/my_wallet", userAuth.isLogin, userController.loadMyWallet);

// Single Product Page.
user_route.get("/load_product", userController.loadProduct);

module.exports = user_route;
