const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
require("dotenv").config();

// load controllers.
const Orders = require("../models/orderModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const { google } = require("../config/keys");
const Wishlist = require("../models/wishlistModel");
const Wallet = require("../models/walletModel");
const Referral = require("../models/referralModel");

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
  const digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};
// Generate referral code.
function generateReferralCode(length = 8) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let referralCode = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    referralCode += characters[randomIndex];
  }

  return referralCode;
}

// to load sign up page.
const loadSignUp = async (req, res) => {
  try {
    const user = await User.findById(req.session.userData);
    const categories = await Category.find({
      isUnlisted: false,
    });
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
    let { username, email, password, confirm_password, referralCode } =
      req.body;
    req.session.formData = {
      username,
      email,
      password,
      confirm_password,
      referralCode,
    };

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
  try {
    const referral = await Referral.findOne();
    console.log(`referral : ${referral}`)
    const { offerAmount } = referral;
    console.log(`offer amount : ${offerAmount}`);
    const enteredOTP = req.body.otp;
    const generatedOTP = req.session.newOTP;
    let { referralCode } = req.session.formData;
    if (referralCode) {
      const user = await User.findOne({ referralCode });
      if (user) {
        let referredUserWallet = await Wallet.findOne({ userId: user.id });
        if (!referredUserWallet) {
          referredUserWallet = new Wallet({
            userId: user.id,
            walletBalance: 0,
            transactions: [],
          });
        }
        referredUserWallet.walletBalance += offerAmount;
        await referredUserWallet.save();
        referralCode = true;
      }
    }

    if (enteredOTP === generatedOTP) {
      const { username, email, password } = req.session.formData;
      const sPassword = await hashPassword(password);
      const newUser = new User({
        name: username,
        email: email,
        password: sPassword,
        createdOn: Date.now(),
        referralCode: generateReferralCode(),
      });
      await newUser.save();
      if (referralCode === true) {
        const user = await User.find({ email });
        const wallet = new Wallet({
          userId: user.id,
          walletBalance: offerAmount,
          transactions: [],
        });
        await wallet.save();
      }
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    res.send(`Error Verifying OTP. ${error}`);
  }
};

// to resend OTP.
const resendOTP = async (req, res) => {
  try {
    const { email } = req.session.email;
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
    const message = "";
    res.render("login", {
      message: message,
      categories: categories,
      user: user,
    });
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
    if (req.user) {
      const user = await User.findById(req.user.id);
      const cart = await Cart.findById(req.user.id);
      const products = await Product.find({ isUnlisted: false });
      const categories = await Category.find({
        isUnlisted: false,
      });
      req.session.userData = user.id;
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
      const products = await Product.find({ isUnlisted: false });
      const categories = await Category.find({
        isUnlisted: false,
        isDeleted: false,
      });
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
  const categories = await Category.find({
    isUnlisted: false,
    isDeleted: false,
  });
  const message = "Username or password is incorrect.";
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });

    if (!user) {
      res.render("login", {
        message,
        categories,
        user: req.user.userData,
      });
    } else {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch && user.isAdmin == 0) {
        req.session.userData = user._id;
        res.redirect("/");
      } else {
        // req.session.message = message;
        res.render("login", {
          message,
          categories,
          user: req.user.userData,
        });
      }
    }
  } catch (error) {
    console.log(`Error Verifying User Login.`);
    // req.session.error = "An error occurred. Please try again later.";
    res.render("login", {
      message,
      categories,
      user: "",
    });
  }
};

// to logout user.
const logoutUser = async (req, res) => {
  try {
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
    const id = req.query.id;
    console.log(`id : ${id}`);
    const user = await User.findById(req.session.userData);
    const product = await Product.findOne({ isUnlisted: false, _id: id });
    const categories = await Category.find({ isUnlisted: false });
    // const relatedCat = product.category;
    const relatedProd = await Product.find({ category: product.category });
    // console.log(relatedProd);
    let google;
    req.user ? (google = true) : (google = false);
    res.render("product_page", {
      product: product,
      categories: categories,
      user: user,
      google,
      relatedProd,
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
    const categories = await Category.find({ isUnlisted: false });
    let google;
    req.user ? (google = true) : (google = false);

    const query = { isUnlisted: false, stock: { $gt: 0 } };
    if (req.query.category) {
      products = await Product.find({ ...query, category: req.query.category });
    } else {
      products = await Product.find(query);
    }

    res.render("shopping_page", {
      products: products,
      categories: categories,
      user: user,
      google,
    });
  } catch (error) {
    console.log(`error rendering shop page.`);
  }
};

// Get Products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ isUnlisted: false });
    res.json(products);
  } catch (error) {
    console.log(`error getting the products : ${error}`);
  }
};

// Sort By Category
const byCategory = async (req, res) => {
  try {
    const { category } = req.query;
    let products;
    category != "Show all"
      ? (products = await Product.find({ category }))
      : (products = await Product.find());
    res.json(products);
  } catch (error) {
    console.error("Error fetching products by category:", error.message);
    res.status(500).json({ error: "Failed to fetch products by category" });
  }
};

// Sort By Everything
const sortingProducts = async (req, res) => {
  try {
    const { sortBy } = req.query;
    let sortOption = {};
    if (sortBy == "lowToHigh") {
      sortOption = { price: 1 };
    } else if (sortBy == "highToLow") {
      sortOption = { price: -1 };
    } else if (sortBy == "atoz") {
      sortOption = { name: 1 };
    } else if (sortBy == "ztoa") {
      sortOption = { name: -1 };
    }
    const sortedProducts = await Product.find({
      isUnlisted: { $ne: true },
    }).sort(sortOption);
    res.json(sortedProducts);
  } catch (error) {
    console.log(`error sorting products : ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Search Products
const searchProducts = async (req, res) => {
  const { query } = req.query;

  try {
    const searchResults = await Product.find({
      $or: [
        { name: { $regex: new RegExp(query, "i") } },
        { category: { $regex: new RegExp(query, "i") } },
      ],
    });

    res.json(searchResults);
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ error: "Failed to fetch search results" });
  }
};

// Render profile Page.
const loadMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.userData);
    const products = await Product.find({ isUnlisted: false });
    const categories = await Category.find({ isUnlisted: false });
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
    const user = await User.findById(req.session.userData);
    const products = await Product.find({ isUnlisted: false });
    const categories = await Category.find({ isUnlisted: false });
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

    const user = await User.findById(req.session.userData);
    const addressIndex = user.address.findIndex(
      (address) => address._id === addressId
    );
    let google;
    req.user ? (google = true) : (google = false);
    if (addressIndex !== -1) {
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
        google,
      };

      await user.save();
      return res.status(200).json({ message: "Address updated successfully" });
    } else {
      return res.status(404).json({ error: "Address not found" });
    }
  } catch (error) {
    console.error("Error updating address:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Delete Address
const deleteAddress = async (req, res) => {
  try {
    const { index } = req.query;
    const id = req.session.userData || req.user.id;
    const user = await User.findById(id);
    user.address.splice(index, 1);
    await user.save();
    res.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ error: "Failed to delete address" });
  }
};

// Render my_orders
const loadMyOrders = async (req, res) => {
  try {
    const user = await User.findById(req.session.userData);
    const products = await Product.find({ isUnlisted: false });
    const categories = await Category.find({ isUnlisted: false });
    const orders = await Orders.find({
      user: req.session.userData || req.user.id,
    }).sort({ createdOn: -1 });

    let google;
    req.user
      ? ((google = true), (logout = "/auth/logout"))
      : ((google = false), (logout = "/logout"));

    res.render("my_orders", {
      categories: categories,
      products: products,
      user: user,
      google,
      logout,
      orders,
    });
  } catch (error) {
    console.log(`Error loading my_orders: ${error}`);
    res.status(500).send("Internal Server Error");
  }
};

// send otp to change password
const passwordOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const newOTP = generateOTP(6);
    console.log(`The OTP is ${newOTP} to change the password.`);
    req.session.newOTP = newOTP;
    req.session.email = email;

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
        console.log("error sending mail to resent password.", error);
        return res.status(500).send("Error sending OTP email.");
      } else {
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

// Reset password.
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

// Render Wishlist.
const loadWishlist = async (req, res) => {
  try {
    const userId = req.session.userData || req.user?._id;
    let google;
    req.user ? (google = true) : (google = false);
    const user = await User.findById(userId);
    const categories = await Category.find({ isUnlisted: false });

    const wishlist = await Wishlist.findOne({ userId: userId });

    const wishProducts = await Promise.all(
      wishlist.products.map(async (product) => {
        const prod = await Product.findById(product.productId);
        return prod;
      })
    );

    res.render("wishlist", {
      categories,
      user,
      google,
      products: wishProducts,
    });
  } catch (error) {
    console.log(`error rendering the wishlist : ${error}`);
  }
};

// Add to Wishlist.
const addToWishlist = async (req, res) => {
  try {
    console.log(`adding to wishlist...`);
    const { productId } = req.body;
    const userId = req.session.userData || req.user.id;

    let wishlist = await Wishlist.findOne({ userId: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId: userId, products: [] });
    }

    const existingProduct = wishlist.products.find((p) =>
      p.productId.equals(productId)
    );
    if (!existingProduct) {
      wishlist.products.push({ productId: productId });
    }

    await wishlist.save();
    res.status(200).json({ message: "Product added to wishlist." });
  } catch (error) {
    console.error(`Error adding to wishlist: ${error}`);
    res.status(500).json({ error: "Failed to add product to wishlist" });
  }
};

// Check if a product is already in the Wishlist.
const checkProductInWishlist = async (req, res) => {
  try {
    console.log(`checking if the product is already in the wishlist...`);
    const { productId } = req.query;
    const userId = req.session.userData || req.user.id;
    const wishlist = await Wishlist.findOne({ userId: userId });
    if (!wishlist) {
      res.status(200).json({ exists: false });
      return;
    }

    const productExists = wishlist.products.some((p) =>
      p.productId.equals(productId)
    );
    res.status(200).json({ exists: productExists });
  } catch (error) {
    console.error(`Error checking product in wishlist: ${error}`);
    res
      .status(500)
      .json({ error: "Failed to check if product is in wishlist." });
  }
};

// Remove from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.query;
    const userId = req.session.userData || req.user?.id;
    const wishlist = await Wishlist.findOne({ userId: userId });
    const productIndex = wishlist.products.findIndex((item) =>
      item.productId.equals(productId)
    );
    if (productIndex === -1) {
      return res.status(404).json({ error: "Product not found in wishlist" });
    }
    wishlist.products.splice(productIndex, 1);
    await wishlist.save();
    res
      .status(200)
      .json({ message: "Product removes from wishlist", wishlist });
  } catch (error) {
    console.log(`error removing product from wishlist : ${error}`);
    res.status(500).json({ error: "Internal server error" });
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
  loadMyProfile,
  loadMyAddress,
  // loadMyWallet,
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
  byCategory,
  sortingProducts,
  searchProducts,
  getProducts,
  loadWishlist,
  addToWishlist,
  checkProductInWishlist,
  removeFromWishlist,
};
