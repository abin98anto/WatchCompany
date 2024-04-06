const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
require("dotenv").config();

// load controllers.
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");

// hash password function.
const hashPassword = async (password) => {
  try {
    console.log(`Hashing Password.`);
    const salt = await bcrypt.genSalt(10);
    const sPassword = await bcrypt.hash(password, salt);
    return sPassword;
  } catch (error) {
    console.log("Error Hashing Password.");
  }
};
// check if user exists function.
const checkEmail = async (req, res) => {
  try {
    console.log(`Checking If Email Exists in DB.`);
    const { email } = req.body;
    const userFound = await User.findOne({ email });
    res.json({ exists: !!userFound });
  } catch (error) {
    console.error("Error Checking If Email Exists in DB.");
    res.status(500).json({ error: "Internal server error" });
  }
};
// generate OTP function.
const generateOTP = (length) => {
  console.log(`Generating OTP.`);
  const digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

// to load sign up page.
const loadSignUp = async (req, res) => {
  try {
    console.log(`Loading Signup Page.`);
    if (!req.session.adminData) {
      const categories = await Category.find({ isUnlisted: false });
      console.log(`rendering signup page`);
      res.render("signup", { categories: categories });
    } else {
      console.log(`User Already Logged in. Redirecting To Home.`);
      res.redirect("/home");
    }
  } catch (error) {
    res.sending(`Error Loading Signup Page.`);
  }
};

// to send OTP.
const sendOTP = async (req, res) => {
  try {
    console.log(`Sending OTP To User Email.`);
    let { username, email, password, confirm_password } = req.body;
    console.log(`sending the otp to ${email}`);
    req.session.formData = { username, email, password, confirm_password };

    let newOTP = generateOTP(6);
    console.log(`the OTP is ${newOTP}`);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
      },
    });

    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: req.body.email,
      subject: "Welcome to Watch Company! Verify your Account",
      preheader: "Complete your registration and unlock exclusive benefits.",
      text: `This is a verification email sent from Watch Company.`,
      html: `
    <div style="background-color: #f5f5f5; padding: 20px;">
      <header style="background-color: #333; color: #fff; padding: 10px;">
        <h1>Watch Company</h1>
      </header>
      <p>Hi ${req.body.username},</p>
      <p>Thank you for creating an account with Watch Company!</p>
      <p>To complete your registration and unlock all the benefits of being a Watch Company member, please verify your email address using the OTP below:</p>
      <p><b>Your OTP is: ${newOTP}</b></p>
      <p>This OTP expires in 2 minutes.</p>
      <p>Thanks,</p>
      <p>The Watch Company Team</p>
    </div>
  `,
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
    res.send(`Error Sending OTP To User Email.`);
  }
};

// to verify OTP.
const verifyOTP = async (req, res) => {
  console.log(`Verifying OTP.`);
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
    res.send(`Error Verifying OTP.`);
  }
};

// to resend OTP.
const resendOTP = async (req, res) => {
  try {
    const { email } = req.session.formData;
    console.log(`Resending OTP To ${email}`);
    const newOTP = generateOTP(6);
    req.session.newOTP = newOTP;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
      },
    });

    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: req.body.email,
      subject: "Welcome to Watch Company! Verify your Account",
      preheader: "Complete your registration and unlock exclusive benefits.",
      text: `This is a verification email sent from Watch Company.`,
      html: `
    <div style="background-color: #f5f5f5; padding: 20px;">
      <header style="background-color: #333; color: #fff; padding: 10px;">
        <h1>Watch Company</h1>
      </header>
      <p>Hi ${req.body.username},</p>
      <p>Thank you for creating an account with Watch Company!</p>
      <p>To complete your registration and unlock all the benefits of being a Watch Company member, please verify your email address using the OTP below:</p>
      <p><b>Your OTP is: ${newOTP}</b></p>
      <p>This OTP expires in 2 minutes.</p>
      <p>Thanks,</p>
      <p>The Watch Company Team</p>
    </div>
  `,
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
    console.error("Error Resending OTP:", error);
    res.status(500).json({ success: false });
  }
};

// to load login page.
const loadLogin = async (req, res) => {
  try {
    const categories = await Category.find({ isUnlisted: false });
    if (!req.session.userData) {
      console.log(`Rendering Login Page.`);
      res.render("login", {
        message: "",
        categories: categories,
      });
    } else {
      console.log(`Couldn't Render Login Page.`);
      res.redirect("/home");
    }
  } catch (error) {
    res.send(`Error Rendering Login Page.`);
  }
};

// to load landing page.
const loadLandingPage = async (req, res) => {
  try {
    console.log(`Rendering Landing Page.`);
    const products = await Product.find({ isUnlisted: false });
    const categories = await Category.find({ isUnlisted: false });
    res.render("landing_page", { categories: categories, products: products });
  } catch (error) {
    res.send(`Error Rendering Landing Page.`);
  }
};

// to check login credentials.
const verifyLogin = async (req, res) => {
  try {
    console.log(`Verifying User Login Credentials.`);
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    const categories = await Category.find({ isUnlisted: false });
    const message = "Username or password is incorrect.";

    if (!user) {
      console.log(`No User Found!`);
      res.render("login", { message: message });
    } else {
      console.log(`User Found.`);
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch && user.isAdmin == 0) {
        console.log(`User Password Matched.`);
        req.session.userData = user;
        res.redirect("/home");
      } else {
        console.log(`Wrong Password.`);
        req.session.message = message;
        res.render("login", { message: message, categories: categories });
      }
    }
  } catch (error) {
    console.log(`Error Verifying User Login.`);
    req.session.error = "An error occurred. Please try again later.";
    res.redirect("/login");
  }
};

// to load home page.
const loadHome = async (req, res) => {
  const categories = await Category.find({ isUnlisted: false });
  const products = await Product.find({ isUnlisted: false });
  try {
    if (req.session.userData) {
      const userID = req.session.userData._id;
      const status = await User.findById({ _id: userID });
      console.log(`status: ${status.isBlocked}`);
      if (status.isBlocked) {
        console.log(`User is Blocked.`);
        req.session.userData = null;
        res.redirect("/");
      } else {
        console.log(`Rendering Home Page for ${req.session.userData.name}`);
        res.render("home", {
          user: req.session.userData,
          categories: categories,
          products: products,
        });
      }
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(`Error Rendering Home Page.`);
  }
};

// to logout user.
const logoutUser = async (req, res) => {
  try {
    console.log(`Logging Out ${req.session.userData.name}`);
    req.session.userData = null;
    res.redirect("/");
  } catch (error) {
    console.error("Error Logging Out User.");
    res.status(500).send("Internal Server Error");
  }
};

// load single product.
const loadProduct = async (req, res) => {
  try {
    console.log(`loading single product page.`);
    const id = req.query.id;
    console.log(`id: ${id}`);
    const product = await Product.findOne({ isUnlisted: false, _id: id });
    console.log(`product ${product.name}`);
    const categories = await Category.find({ isUnlisted: false });
    res.render("product_page", { product: product, categories: categories });
  } catch (error) {
    console.log(`errr loading single product page.`);
    res.send(`error loading single product page.`);
  }
};

module.exports = {
  loadSignUp,
  loadLogin,
  loadLandingPage,
  verifyLogin,
  sendOTP,
  verifyOTP,
  checkEmail,
  resendOTP,
  loadHome,
  logoutUser,
  loadProduct,
};
