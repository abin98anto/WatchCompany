const express = require("express");
const user_route = express.Router();
const userController = require("../controllers/userController");

user_route.get("/", userController.loadLandingPage); // loads the landing page when we access "/".

user_route.get("/signup", userController.loadSignUp); // loads the signup page.
user_route.post("/signup", userController.sendOTP); // to do when we click "Sign up" button and load otp page.
user_route.post("/otp", userController.verifyOTP); // when we click enter the OTP, checks validity and move to login.

user_route.post("/check-email", userController.checkEmail); // to check email exists in the DB.
user_route.post("/resend-otp", userController.resendOTP); // to resend OTP.

user_route.get("/login", userController.loadLogin); // loads the login page.
user_route.post("/login", userController.verifyLogin); // checks the credentials and pass to home page.

user_route.get("/home", userController.loadHome); // loads home page after login.

user_route.get("/logout", userController.logoutUser); // logout functionallity.

module.exports = user_route;
