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
    if (!req.session.userData) {
      console.log(`rendering signup page`);
      res.render("signup");
    } else {
      res.redirect("/home");
    }
  } catch (error) {
    res.sending(`error loading the signup page.`);
  }
};

const sendOTP = async (req, res) => {
  try {
    let { username, email, password, confirm_password } = req.body;
    console.log(`sending the otp to ${email}`);
    req.session.formData = { username, email, password, confirm_password };

    let newOTP = generateOTP(6);
    console.log(`the OTP is ${newOTP}`);

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
      to: req.body.email,
      subject: "Verify your Account",
      text: "This is a verification email sent from Watch Company.",
      html: `<p>The OTP is <b>${newOTP}</b>. OTP expires in <b>2 minutes</b>.</p>`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        res.status(500).send("Error sending email.The errror is");
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
    const enteredOTP = req.body.otp;
    const generatedOTP = req.session.newOTP;

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
    res.render("otp");
  } catch (error) {
    res.send(`error loading the otp page.`);
  }
};

const loadLogin = async (req, res) => {
  try {
    if (!req.session.userData) {
      res.render("login", { message: "" });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    res.send(`error loading the login page.`);
  }
};

const loadLandingPage = async (req, res) => {
  try {
    if (!req.session.userData) {
      res.render("landing_page");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    res.send(`error loading the landing page.`);
  }
};

const verifyLogin = async (req, res) => {
  try {
    console.log(`reached load home.`);
    // console.log(req.body);
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    // console.log(user);
    const message = "Username or password is incorrect.";

    if (!user) {
      // User does not exist
      // console.log(`user not exist`);
      req.session.message = message;
      // res.redirect("/login"); // Redirect to login page to display error message
      // console.log(message);
      res.render("login", { message: message });
    } else {
      // User exists, compare passwords
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch && user.isAdmin == 0) {
        // Passwords match, redirect to home page
        req.session.userData = user; // Store user information in session
        res.redirect("/home");
      } else {
        // console.log(`password dosn't match`);
        // Passwords don't match, redirect back to login page
        req.session.message = message; // Store error message in session
        // res.redirect("/login");
        res.render("login", { message: message });
      }
    }
  } catch (error) {
    req.session.error = "An error occurred. Please try again later.";
    res.redirect("/login");
  }
};

// to check if the email exists in the DB.
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

// to resend OTP.
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
      subject: "Resending the OTP",
      text: "This is a new OTP email sent from Watch Company.",
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

const loadHome = async (req, res) => {
  console.log(`loading home page...`);
  try {
    // console.log(req.session.userData);
    if (req.session.userData) {
      res.render("home", { user: req.session.userData });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(`error loading home page.`);
  }
};

const logoutUser = async (req, res) => {
  try {
    // Set the userData property of the session to null
    req.session.userData = null;

    // Redirect the user to a different page after logout
    res.redirect("/");
  } catch (error) {
    console.error("Error logging out the user:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  loadSignUp,
  loadOTP,
  loadLogin,
  loadLandingPage,
  verifyLogin,
  sendOTP,
  verifyOTP,
  checkEmail,
  resendOTP,
  loadHome,
  logoutUser,
};
