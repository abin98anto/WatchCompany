//
const adminLogin = async (req, res, next) => {
  try {
    if (req.session.adminData) {
      next();
    } else {
      res.redirect("/admin/");
    }
  } catch (error) {
    console.log(`error checking adminLogin`);
  }
};

//
const adminLogout = async (req, res, next) => {
  try {
    if (req.session.adminData) {
      res.redirect("/admin/dashboard");
    } else {
      next();
    }
  } catch (error) {
    console.log(`error checking adminLogout`);
  }
};

module.exports = {
  adminLogin,
  adminLogout,
};
