const User = require("../models/userModel");

const loadUserManagement = async (req, res) => {
  try {
    if (req.session.userData) {
      const users = await User.find({ isAdmin: 0 });
      //   console.log(users);
      res.render("user_management", { users: users });
    } else {
      res.redirect("/admin/");
    }
  } catch (error) {
    res.send(`error loading user management.`);
  }
};

const blockUser = async (req, res) => {
  try {
    let id = req.query.id; // Access id from req.body since it's sent via POST
    // console.log(id);
    await User.updateOne({ _id: id }, { $set: { isBlocked: true } });
    res.redirect("/admin/user_management");
  } catch (error) {
    res.send("error blocking the user.");
  }
};

const unblockUser = async (req, res) => {
  try {
    let id = req.query.id; // Access id from req.body since it's sent via POST
    // console.log(id);
    await User.updateOne({ _id: id }, { $set: { isBlocked: false } });
    res.redirect("/admin/user_management");
  } catch (error) {
    res.send("error unblocking the user.");
  }
};

module.exports = {
  loadUserManagement,
  blockUser,
  unblockUser,
};
