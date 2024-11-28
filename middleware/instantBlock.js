const User = require("../models/userModel");
const Category = require("../models/categoryModel");
// const { google } = require("../config/keys");

const blockUser = async (req, res, next) => {
  try {
    if (req.session.userData) {
      const userId = req.session.userData;
      const user = await User.findById(userId);
      const categories = await Category.find({
        isUnlisted: false,
        isDeleted: false,
      });
      if (user.isBlocked) {
        req.session.userData = null;
        return res.render("login", {
          message: "You are blocked by Admin.",
          categories,
          user: user.id,
          google: "",
        });
      } else {
        next();
      }
    } else {
      next();
    }
  } catch (error) {
    console.log(`error instant blocking user : ${error}`);
  }
};

module.exports = {
  blockUser,
};
