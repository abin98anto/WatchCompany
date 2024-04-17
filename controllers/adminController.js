const bcrypt = require("bcrypt");

// Load Controllers.
const User = require("../models/userModel");

// Render Admin Login.
const loadAdminLogin = async (req, res) => {
  try {
    // console.log(`Load Admin Login Page.`);
    res.render("admin_login", { message: "" });
  } catch (error) {
    res.send(`Error Loading Admin Login Page.`);
  }
};

// Verifying Admin Credentials.
const verifyAdmin = async (req, res) => {
  try {
    // console.log(`Verifying Admin Login Credentials.`);
    const { email, password } = req.body;
    const message = "Username or password is incorrect.";
    const adminFound = await User.findOne({ email, isAdmin: 1 });
    if (!adminFound) {
      // console.log(`Wrong Admin Credentials.`);
      res.render("admin_login", { message: message });
    } else {
      // console.log(`Correct Admin Credentials. Checking Passwords.`);
      const passwordMatch = await bcrypt.compare(password, adminFound.password);
      if (passwordMatch) {
        // console.log(`Password Matched. Rendering Dashboard.`);
        req.session.adminData = adminFound;
        res.redirect("/admin/dashboard");
      } else {
        // console.log(`Wrong Password.`);
        res.render("admin_login", { message: message });
      }
    }
  } catch (error) {
    res.send(`Error Verifying Admin Login`);
  }
};

// Rendering Admin Dashboard.
const loadDashboard = async (req, res) => {
  try {
    // if (req.session.adminData) {
    // console.log(`Loading Admin Dashboard.`);
    res.render("dashboard");
    // } else {
    // console.log(`Couldn't Load Admin Dashboard.`);
    // res.redirect("/admin/");
    // }
  } catch (error) {
    console.log(`Error Loading Admin Dashboard.`);
  }
};

// Logging Out Admin.
const logout = async (req, res) => {
  try {
    console.log(`Logging Out ${req.session.adminData.name}`);
    req.session.adminData == null;
    res.redirect("/admin/");
  } catch (error) {
    res.send("Error Logging Out Admin.");
  }
};



module.exports = {
  loadAdminLogin,
  verifyAdmin,
  loadDashboard,
  logout,
};
