const User = require("../models/userModel");
const bcrypt = require("bcrypt");

const loadAdminLogin = async (req, res) => {
  try {
    res.render("admin_login", { message: "" });
  } catch (error) {
    res.send(`error loading the admin login page.`);
  }
};

const verifyAdmin = async (req, res) => {
  try {
    // console.log(req.body);
    const { email, password } = req.body;
    const message = "Username or password is incorrect.";

    // Secure password comparison using bcrypt
    const adminFound = await User.findOne({ email, isAdmin: 1 });
    // console.log(adminFound);
    if (!adminFound) {
      // console.log(`no user found.`);
      res.render("admin_login", { message: message });
    } else {
      // console.log(`found admin.`);
      const passwordMatch = await bcrypt.compare(password, adminFound.password);
      // console.log("password match:", passwordMatch);
      if (passwordMatch) {
        // console.log(`password matched`);
        req.session.userData = adminFound;
        res.redirect("/admin/dashboard");
      } else {
        // console.log(`wrong password.`);
        res.render("admin_login", { message: message });
      }
    }
  } catch (error) {
    res.send(`error loggin in admin`);
  }
};

const loadDashboard = async (req, res) => {
  try {
    if (req.session.userData) {
      res.render("dashboard");
    } else {
      res.redirect("/admin/");
    }
  } catch (error) {
    console.log(`error loading the admin dashboard.`);
  }
};

const logout = async (req, res) => {
  try {
    if (req.session.userData) {
      res.session.userData == null;
      res.redirect("/admin/");
    } else {
      res.redirect("/admin/");
    }
  } catch (error) {
    res.send("error loading logout.");
  }
};

module.exports = {
  loadAdminLogin,
  verifyAdmin,
  loadDashboard,
  logout,
};
