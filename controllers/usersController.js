const User = require("../models/userModel");

// Render User Management page.
const loadUserManagement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 7;

    const users = await User.find({ isAdmin: 0 })
      .sort({ createdOn: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const totalUsers = await User.countDocuments({ isAdmin: 0 });
    const totalPages = Math.ceil(totalUsers / pageSize);

    res.render("user_management", {
      users: users,
      currentPage: page,
      totalPages,
      hasPreviousPage: page>1, 
      hasNextPage: page< totalPages,
      usersPerPage: pageSize,
    });
  } catch (error) {
    res.send(`Error Rendering User Management.`);
  }
};


// Block/ Unblock users.
const toggleUserStatus = async (req, res) => {
  try {
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
    res.status(500).send("Internal server error");
  }
};

// Get users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ isAdmin: 0 }).sort({
      createdOn: -1,
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Error searching users" });
  }
};

module.exports = {
  loadUserManagement,
  toggleUserStatus,
  getUsers,
};
