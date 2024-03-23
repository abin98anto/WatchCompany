// const express = require("express");
const User = require("../models/userModel");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
require("dotenv").config();

const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const sPassword = await bcrypt.hash(password, salt);
    return sPassword;
  } catch (error) {
    console.log("error hashing password :", error);
  }
};

const loadSignUp = async (req, res) => {
  try {
    if (!req.session.body) {
      console.log(`rendering signup page`);
      res.render("signup");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error);
  }
};

const sendOTP = async (req, res) => {
  try {
    let { username, email, password, confirm_password } = req.body;

    req.session.formData = { username, email, password, confirm_password };

    const userFound = await User.findOne({ email });
    // console.log('userfound: ',userFound);
    // if (userFound) console.log(`user already registered`);

    let newOTP = generateOTP(6);

    const transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
      },
    });

    console.log(req.body.email);

    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: req.body.email,
      subject: "Verify your Account",
      text: "This is a verification email sent from Watch Company.",
      html: `<p>The OTP is <b>${newOTP}</b>. OTP expires in <b>2 minutes</b>.</p>`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error("Error occurred:", error);
        res.status(500).send("Error sending email.");
      } else {
        console.log("Email sent successfully!");
        console.log("Message ID:", info.messageId);
        req.session.newOTP = newOTP;
        res.render("otp");
      }
    });
  } catch (error) {
    res.send(`error loading the OTP page`);
  }
};

const verifyOTP = async (req, res) => {
  console.log(`reached verify OTP`);
  try {
    const enteredOTP = req.body.otp; // Use 'otp' here
    const generatedOTP = req.session.newOTP;
    console.log(req.body.otp);
    console.log(req.session.newOTP);

    if (enteredOTP === generatedOTP) {
      const { username, email, password } = req.session.formData;
      const sPassword = await hashPassword(password);
      const newUser = new User({
        name: username,
        email: email,
        password: sPassword,
      });
      await newUser.save();
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }

    // res.render("login");
  } catch (error) {
    res.send("error while verifying the OTP. error:", error);
  }
};

const generateOTP = (length) => {
  const digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

const loadOTP = async (req, res) => {
  try {
    console.log(req.body);
    res.render("otp");
  } catch (error) {
    console.log(error);
  }
};

const loadLogin = async (req, res) => {
  res.render("login");
};

const loadForgotPassword = async (req, res) => {
  res.render("forgot_password");
};

const loadLandingPage = async (req, res) => {
  res.render("landing_page");
};

const loadHome = async (req, res) => {
  try {
    console.log(req.body);
    const { email, password } = req.body;
    const findUser = await User.findOne({ isAdmin: 0, email: email });
    if (findUser) {
      
    }
  } catch (error) {
    console.log(`error logging in the user`);
  }
};

const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const userFound = await User.findOne({ email });
    res.json({ exists: !!userFound });
  } catch (error) {
    console.error("Error checking email existence:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.session.formData;
    const newOTP = generateOTP(6); // Generate new OTP
    req.session.newOTP = newOTP; // Update session with new OTP

    const transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
      },
    });

    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: "Resend OTP",
      text: "This is a resend OTP email sent from Watch Company.",
      html: `<p>Your new OTP is <b>${newOTP}</b>. OTP expires in <b>2 minutes</b>.</p>`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error("Error occurred:", error);
        res.status(500).json({ success: false });
      } else {
        console.log("Resend OTP email sent successfully!");
        console.log("Message ID:", info.messageId);
        res.json({ success: true });
      }
    });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({ success: false });
  }
};

const loadProfile = async (req, res) => {
  // res.send(req.user.name);
  const id = req.user;
  const userFound = await User.findOne({ _id: id });
  // console.log(userFound);
  res.render("profile", { user: userFound });
};

module.exports = {
  loadSignUp,
  loadOTP,
  loadLogin,
  loadForgotPassword,
  loadLandingPage,
  loadHome,
  sendOTP,
  verifyOTP,
  checkEmail,
  resendOTP,
  loadProfile,
};
