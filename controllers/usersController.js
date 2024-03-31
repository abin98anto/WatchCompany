const User = require("../models/userModel");

// Render User Management page.
const loadUserManagement = async (req, res) => {
  try {
    if (req.session.adminData) {
      console.log(`Rendering User Management.`);
      const users = await User.find({ isAdmin: 0 });
      res.render("user_management", { users: users });
    } else {
      console.log(`Couldn't Render User Management.`);
      res.redirect("/admin/");
    }
  } catch (error) {
    res.send(`Error Rendering User Management.`);
  }
};

// Block/ Unblock users.
const toggleUserStatus = async (req, res) => {
  try {
    console.log(`Toggling User Status.`);
    let id = req.query.id;
    const user = await User.findById(id);
    if (!user) {
      res.status(404).send("User not found");
      return;
    }
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.redirect("/admin/user_management");
  } catch (error) {
    console.log(`Error Toggling User Status.`);
  }
};

module.exports = {
  loadUserManagement,
  toggleUserStatus,
};
