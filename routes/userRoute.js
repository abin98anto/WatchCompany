const express = require("express");
const user_route = express.Router();
const userController = require("../controllers/userController");
const authRoutes = require("./authRoutes");
const authCheck = require("../middleware/authcheck");

user_route.use("/auth", authRoutes);

user_route.get("/", userController.loadLandingPage);

user_route.get("/signup",authCheck.signedinCheck, userController.loadSignUp);
user_route.post("/signup", userController.sendOTP);
user_route.post("/otp", userController.verifyOTP);

user_route.post("/check-email", userController.checkEmail);
user_route.post("/resend-otp", userController.resendOTP);

user_route.get("/login", userController.loadLogin);
user_route.post("/login", userController.loadHome);

user_route.get("/forgot_password", userController.loadForgotPassword);

user_route.get("/home", authCheck.authCheck, userController.loadHome);

user_route.get("/profile", authCheck.authCheck, userController.loadProfile);

user_route.get("/logout", (req, res) => {
  res.clearCookie("connect.sid", { path: "/" });
  res.redirect("/");
});

module.exports = user_route;
