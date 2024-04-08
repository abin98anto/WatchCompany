const express = require("express");
const user_route = express.Router();
const userAuth = require("../middleware/userAuth");

// Loading Controllers.
const userController = require("../controllers/userController");

// Loads Landing Page.
user_route.get("/", userController.loadLandingPage);

// Signup Process.
user_route.get("/signup", userAuth.userDataPresent, userController.loadSignUp);
user_route.post("/signup", userController.sendOTP);
user_route.post("/otp", userController.verifyOTP);
user_route.post("/check-email", userController.checkEmail);
user_route.post("/resend-otp", userController.resendOTP);

// Login Process.
user_route.get("/login", userController.loadLogin);
user_route.post("/login", userController.verifyLogin);

// Render Home page.
// user_route.get("/home", userController.loadLandingPage);

// User Logout Function.
user_route.get("/logout", userController.logoutUser);

// Single Product Page.
user_route.get("/load_product", userController.loadProduct);

module.exports = user_route;
