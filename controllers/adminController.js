const bcrypt = require("bcrypt");

// Load Controllers.
const User = require("../models/userModel");

// Render Admin Login.
const loadAdminLogin = async (req, res) => {
  try {
    res.render("admin_login", { message: "" });
  } catch (error) {
    res.send(`Error Loading Admin Login Page.`);
  }
};

// Verifying Admin Credentials.
const verifyAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const message = "Username or password is incorrect.";
    const adminFound = await User.findOne({ email, isAdmin: 1 });
    if (!adminFound) {
      res.render("admin_login", { message: message });
    } else {
      const passwordMatch = await bcrypt.compare(password, adminFound.password);
      if (passwordMatch) {
        req.session.adminData = adminFound;
        res.redirect("/admin/dashboard");
      } else {
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
    res.render("dashboard");
  } catch (error) {
    console.log(`Error Loading Admin Dashboard.`);
  }
};

// Logging Out Admin (not for google login).
const logout = async (req, res) => {
  try {
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
