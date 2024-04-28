// if admin is logged in the procced to route, else go to login page.
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

// if admin is logged in redirect to dashboard, else procced to route.
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
