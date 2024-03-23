// done this as part of net ninja video of passport. This checks if the user exists when loading the home page and if there is no user redirects it to landing page.

const authCheck = (req, res, next) => {
  if (!req.user) {
    res.redirect("/");
  } else {
    next();
  }
};

const signedinCheck = (req, res, next) => {
  if (req.user) {
    res.redirect("/home");
  } else {
    next();
  }
};

module.exports = { authCheck, signedinCheck };
