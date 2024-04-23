const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
require("dotenv").config();

// load controllers.
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const { google } = require("../config/keys");

// hash password function.
const hashPassword = async (password) => {
  try {
    const salt = 10;
    const sPassword = await bcrypt.hash(password, salt);
    return sPassword;
  } catch (error) {
    console.log("Error Hashing Password.");
  }
};
// check if user exists function.
const checkEmail = async (req, res) => {
  try {
    // console.log(`Checking If Email Exists in DB.`);
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
  // console.log(`Generating OTP.`);
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
    const user = await User.findById(req.session.userData);
    const categories = await Category.find({
      isUnlisted: false,
      isDeleted: false,
    });
    console.log(`rendering signup page`);
    res.render("signup", {
      categories: categories,
      user: user,
    });
  } catch (error) {
    res.sending(`Error Loading Signup Page.`);
  }
};

// to send OTP.
const sendOTP = async (req, res) => {
  try {
    // console.log(`Sending OTP To User Email.`);
    let { username, email, password, confirm_password } = req.body;
    // console.log(`sending the otp to ${email}`);
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
        // console.log("Message ID:", info.messageId);
        req.session.newOTP = newOTP;
        req.session.email = email;
        res.render("otp");
      }
    });
  } catch (error) {
    res.send(`Error Sending OTP To User Email.`);
  }
};

// to verify OTP.
const verifyOTP = async (req, res) => {
  // console.log(`Verifying OTP.`);
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
        createdOn: Date.now(),
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
    const { email } = req.session.email;
    console.log(`Resending OTP To ${email}`);
    const newOTP = generateOTP(6);
    console.log(`resended otp : ${newOTP}`);
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
      to: req.session.email,
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
    const user = await User.findById(req.session.userData);
    const categories = await Category.find({ isUnlisted: false });
    // if (!req.session.userData) {
    // console.log(`Rendering Login Page.`);
    const message = "";
    res.render("login", {
      message: message,
      categories: categories,
      user: user,
    });
    // } else {
    // console.log(`Couldn't Render Login Page.`);
    // res.redirect("/home");
    // }
  } catch (error) {
    res.send(`Error Rendering Login Page.`);
  }
};

// load Forgot Password.
const loadForgotPassword = async (req, res) => {
  try {
    const user = await User.findById(req.session.userData);
    const products = await Product.find({ isUnlisted: false });
    const categories = await Category.find({
      isUnlisted: false,
      isDeleted: false,
    });
    res.render("forgot_password", {
      categories: categories,
      products: products,
      message: "",
      user: user,
    });
  } catch (error) {
    console.log(`error rendering forgot password`);
  }
};

// to load landing page.
const loadLandingPage = async (req, res) => {
  try {
    console.log(`Rendering Landing Page.`);
    // const id = req.session.userData || req.user.id;
    // console.log(id);
    if (req.user) {
      const user = await User.findById(req.user.id);
      const cart = await Cart.findById(req.user.id);
      // console.log("landing req.user", user);
      const products = await Product.find({ isUnlisted: false });
      const categories = await Category.find({
        isUnlisted: false,
        isDeleted: false,
      });
      req.session.userData = user.id;
      // console.log(categories);
      res.render("landing_page", {
        categories: categories,
        products: products,
        user: user,
        cart: cart,
        google: true,
      });
    } else {
      const user = await User.findById(req.session.userData);
      const cart = await Cart.findById(req.session.userData);
      // console.log('landing',users);
      const products = await Product.find({ isUnlisted: false });
      const categories = await Category.find({
        isUnlisted: false,
        isDeleted: false,
      });
      // console.log(categories);
      res.render("landing_page", {
        categories: categories,
        products: products,
        user: user,
        cart: cart,
        google: false,
      });
    }
  } catch (error) {
    res.send(`Error Rendering Landing Page.: ${error}`);
  }
};

// to check login credentials.
const verifyLogin = async (req, res) => {
  try {
    // console.log(`Verifying User Login Credentials.`);
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    const categories = await Category.find({
      isUnlisted: false,
      isDeleted: false,
    });
    const message = "Username or password is incorrect.";

    if (!user) {
      console.log(`No User Found!`);
      res.render("login", {
        message: message,
        categories: categories,
        user: req.user.userData,
      });
    } else {
      console.log(`User Found.`);
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch && user.isAdmin == 0) {
        console.log(`User Password Matched.`);
        req.session.userData = user._id;
        res.redirect("/");
      } else {
        console.log(`Wrong Password.`);
        req.session.message = message;
        res.render("login", {
          message: message,
          categories: categories,
          user: req.user.userData,
        });
      }
    }
  } catch (error) {
    console.log(`Error Verifying User Login.`);
    req.session.error = "An error occurred. Please try again later.";
    res.redirect("/login");
  }
};

// to logout user.
const logoutUser = async (req, res) => {
  try {
    if (req.user) {
      console.log(`req.user : ${req.user}`);
      req.session.userData = null;
      // req.user = null;
      req.logout();
      res.redirect("/");
    } else {
      console.log(`Logging Out ${req.session.userData}`);
      req.session.userData = null;
      res.redirect("/");
    }
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
    // console.log(`id: ${id}`);
    const user = await User.findById(req.session.userData);

    const product = await Product.findOne({ isUnlisted: false, _id: id });
    // console.log(`product ${product.name}`);
    const categories = await Category.find({
      isUnlisted: false,
      isDeleted: false,
    });
    res.render("product_page", {
      product: product,
      categories: categories,
      user: user,
      google: "",
    });
  } catch (error) {
    console.log(`errr loading single product page.`);
    res.send(`error loading single product page.`);
  }
};

// load shop.
const loadShop = async (req, res) => {
  try {
    const user = await User.findById(req.session.userData);
    let products;
    const categories = await Category.find({
      isUnlisted: false,
      isDeleted: false,
    });

    if (req.query.category) {
      products = await Product.find({
        category: req.query.category,
        isUnlisted: false,
      });
    } else {
      products = await Product.find({ isUnlisted: false });
    }
    res.render("shopping_page", {
      products: products,
      categories: categories,
      user: user,
      google: "",
    });
  } catch (error) {
    console.log(`error rendering shop page.`);
  }
};

// filter category.
const filterCategory = async (req, res) => {
  console.log(`filtering category.`);
  const category = req.params.category;
  try {
    const user = await User.findById(req.session.userData);
    const products = await Product.find({ category: category }).lean();
    const categories = await Category.find().lean();
    console.log(products);
    console.log(categories);
    res.render("shopping_page", {
      products: products,
      categories: categories,
      user: user,
    });
  } catch (err) {
    console.error(`Error filtering category: ${err}`);
    res.status(500).send("Error filtering category");
  }
};

// cart page.
const loadCart = async (req, res) => {
  try {
    console.log(`req.body: ${req.body}`);
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

// add to cart
const addToCart = async (req, res) => {
  console.log(`addd to cart in server side.`);
  const { productId, quantity } = req.body;
  console.log("reqest body : ", req.body);
  try {
    // Check if the user has an existing cart
    let cart = await Cart.findOne({ userID: req.session.userData });
    console.log(`cart found ? ${cart}`);
    if (!cart) {
      console.log(`no cart found so creating a new one for the user `);
      cart = new Cart({
        userID: req.session.userData,
        products: [{ productID: productId, quantity: quantity }],
      });
    } else {
      // If the user has a cart, check if the product already exists in the cart
      const existingProduct = cart.products.find(
        (product) => product.productID.toString() === productId
      );

      if (existingProduct) {
        // If the product exists, update its quantity
        existingProduct.quantity += quantity;
      } else {
        // If the product doesn't exist, add it to the cart
        cart.products.push({ productID: productId, quantity: quantity });
      }
    }

    // Save the updated cart
    await cart.save();

    res.status(200).json({ message: "Product added to cart successfully" });
  } catch (error) {
    console.error("Error adding product to cart:", error);
    res.status(500).json({ error: "Failed to add product to cart" });
  }
};

// Render profile Page.
const loadMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.userData);
    // console.log(user.name);
    // console.log(`loading my_profile.`);
    const products = await Product.find({ isUnlisted: false });
    const categories = await Category.find({
      isUnlisted: false,
      isDeleted: false,
    });
    let google, logout;
    req.user
      ? ((google = true), (logout = "/auth/logout"))
      : ((google = false), (logout = "/logout"));
    res.render("my_profile", {
      categories: categories,
      products: products,
      user: user,
      google: google,
      logout,
    });
  } catch (error) {
    console.log(`Error loading setting.`);
  }
};

// change the Profile details.
const updateProfile = async (req, res) => {
  try {
    const { name, email, id } = req.body;
    const user = await User.findByIdAndUpdate(id, { name: name, email: email });
    if (user) {
      req.session.userData = user._id;
      res.sendStatus(200);
    } else {
      res.status(404).json({ success: false, error: "User not found" });
    }
  } catch (error) {
    console.error(`Error updating Profile: ${error.message}`);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Render my_address.
const loadMyAddress = async (req, res) => {
  try {
    // console.log(`loading setting.`);
    const user = await User.findById(req.session.userData);
    const products = await Product.find({ isUnlisted: false });
    const categories = await Category.find({
      isUnlisted: false,
      isDeleted: false,
    });
    let google;
    req.user
      ? ((google = true), (logout = "/auth/logout"))
      : ((google = false), (logout = "/logout"));
    res.render("my_address", {
      categories: categories,
      products: products,
      user: user,
      google: google,
      logout,
    });
  } catch (error) {
    console.log(`Error Loading my_orders`);
  }
};

// Add address
const addAddress = async (req, res) => {
  try {
    console.log(`adding new address.`);

    const {
      houseName,
      street,
      city,
      state,
      country,
      pincode,
      phoneNumber,
      addressType,
    } = req.body;
    try {
      const user = await User.findById(req.session.userData);
      user.address.push({
        houseName,
        street,
        city,
        state,
        country,
        pincode,
        phoneNumber,
        addressType,
      });
      await user.save();

      res.status(200).json({ message: "Address added successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  } catch (error) {
    console.log(`error adding new address.`);
  }
};

// Update address.
const updateAddress = async (req, res) => {
  try {
    console.log(`updating address`);
    console.log(`userid: ${req.session.userData}`);

    const {
      addressId,
      houseName,
      street,
      city,
      state,
      country,
      pincode,
      phoneNumber,
      addressType,
    } = req.body;

    // Find the user and update the address by ID
    const user = await User.findById(req.session.userData);
    const addressIndex = user.address.findIndex(
      (address) => address._id === addressId
    );
    // console.log("address index:", addressIndex);
    // console.log(`old address: ${user.address[addressIndex]}`);
    let google;
    req.user ? (google = true) : (google = false);
    if (addressIndex !== -1) {
      // Update the address details
      user.address[addressIndex] = {
        _id: addressId,
        houseName,
        street,
        city,
        state,
        country,
        pincode,
        phoneNumber,
        addressType,
        google: google,
      };

      await user.save();
      console.log(`new address: ${user.address[addressIndex]}`);
      // Respond with success message
      return res.status(200).json({ message: "Address updated successfully" });
    } else {
      return res.status(404).json({ error: "Address not found" });
    }
  } catch (error) {
    // Handle errors
    console.error("Error updating address:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Delete Address
const deleteAddress = async (req, res) => {
  try {
    const i = req.query.i;
    console.log("Value of i:", i);

    // Delete the address from the user model (replace this with your actual logic)
    User.findById(req.user.id, (err, user) => {
      if (err) {
        res.status(500).json({ error: "Internal server error" });
      } else {
        if (!user) {
          res.status(404).json({ error: "User not found" });
        } else {
          // Remove the address at index i
          user.address.splice(i, 1);
          // Save the updated user object
          user.save((err, savedUser) => {
            if (err) {
              res.status(500).json({ error: "Internal server error" });
            } else {
              res.json({ message: "Address deleted successfully" });
            }
          });
        }
      }
    });
  } catch (error) {
    console.log(`error deleting address.`);
  }
};

// Render my_ordersawait bcrypt.genSalt(10)
const loadMyOrders = async (req, res) => {
  try {
    console.log(`loading my_orders.`);
    const user = await User.findById(req.session.userData);
    const products = await Product.find({ isUnlisted: false });
    const categories = await Category.find({
      isUnlisted: false,
      isDeleted: false,
    });
    let google;
    req.user
      ? ((google = true), (logout = "/auth/logout"))
      : ((google = false), (logout = "/logout"));
    res.render("my_orders", {
      categories: categories,
      products: products,
      user: user,
      google: google,
      logout,
    });
  } catch (error) {
    console.log(`Error loading my_orders`);
  }
};

// Render my_wallet
const loadMyWallet = async (req, res) => {
  try {
    console.log(`loading my_wallet.`);
    const user = await User.findById(req.session.userData);
    const products = await Product.find({ isUnlisted: false });
    const categories = await Category.find({
      isUnlisted: false,
      isDeleted: false,
    });
    let google;
    req.user
      ? ((google = true), (logout = "/auth/logout"))
      : ((google = false), (logout = "/logout"));
    res.render("my_wallet", {
      categories: categories,
      products: products,
      user: user,
      google: google,
      logout,
    });
  } catch (error) {
    console.log(`Error loading my_wallet.`);
  }
};

// send otp to change password
const passwordOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Generate OTP
    const newOTP = generateOTP(6);
    console.log(`The OTP is ${newOTP} to change the password.`);

    // Store OTP and email in session
    req.session.newOTP = newOTP;
    req.session.email = email;

    // Send OTP to the user's email
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
      to: email,
      subject: "Reset Password OTP",
      text: `Your OTP for resetting the password is: ${newOTP}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        return res.status(500).send("Error sending OTP email.");
      } else {
        console.log("OTP Email sent successfully!");
        // Render OTP input form
        // res.render("otp", { email });
        res.status(200).send("OTP Email sent successfully!");
      }
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).send("Error sending OTP.");
  }
};

// verify otp to change password
const passwordVerifyOTP = async (req, res) => {
  // console.log(`Verifying OTP.`);
  try {
    const enteredOTP = req.body.otp;
    const generatedOTP = req.session.newOTP;

    if (enteredOTP === generatedOTP) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    res.send(`Error Verifying OTP.`);
  }
};

// change password.
const changePassword = async (req, res) => {
  try {
    const { email } = req.session;
    const { newPassword } = req.body;

    const hashedPassword = await hashPassword(newPassword);

    const updatedUser = await User.findOneAndUpdate(
      { email: email },
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "Password updated successfully", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { id, oldPassword, newPassword } = req.body;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(400).json({ message: "Incorrect old password" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
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
  logoutUser,
  loadProduct,
  loadShop,
  filterCategory,
  loadCart,
  loadMyProfile,
  loadMyAddress,
  loadMyWallet,
  loadMyOrders,
  updateProfile,
  addAddress,
  updateAddress,
  loadForgotPassword,
  passwordOTP,
  passwordVerifyOTP,
  changePassword,
  resetPassword,
  deleteAddress,
  addToCart,
};
