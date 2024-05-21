const User = require("../models/userModel");
const Referral = require("../models/referralModel");

// Render User Management page.
const loadUserManagement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments({ isAdmin: 0 });
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find({ isAdmin: 0 })
      .sort({ createdOn: -1 })
      .skip(skip)
      .limit(limit);

    res.render("user_management", {
      users,
      currentPage: page,
      totalPages,
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
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments({ isAdmin: 0 });
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find({ isAdmin: 0 })
      .sort({ createdOn: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ users, totalPages, currentPage: page });
  } catch (error) {
    res.status(500).json({ error: "Error searching users" });
  }
};

// Edit referral bonus
const editReferralBonus = async (req, res) => {
  const { offerAmount } = req.body;

  try {
    let referral = await Referral.findOne();
    if (!referral) {
      referral = new Referral();
    }
    referral.offerAmount = offerAmount;
    await referral.save();

    res.status(200).send({ message: "Referral bonus updated successfully" });
  } catch (error) {
    console.error("Error updating referral bonus:", error);
    res.status(500).send({ message: "Failed to update referral bonus" });
  }
};

module.exports = {
  loadUserManagement,
  toggleUserStatus,
  getUsers,
  editReferralBonus,
};
