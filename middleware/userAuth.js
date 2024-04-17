// If user userData exists in the session go to the requested route or else take the user to user login. wishlist,cart,userprofile,
const isLogin = async (req, res, next) => {
  try {
    if (req.session.userData) {
      next();
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(`error checking isLogin.`);
  }
};

// If there is userData the don't take the user to the requested route or else take the user to the requested route. signin, login.
const isLogout = async (req, res, next) => {
  try {
    if (req.session.userData) {
      res.redirect("/");
    } else {
      next();
    }
  } catch (error) {
    console.log(`error checking isLogout.`);
  }
};

module.exports = {
  isLogin,
  isLogout,
};
