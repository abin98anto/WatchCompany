const router = require("express").Router();
const passport = require("passport");
const authCheck = require("../middleware/authcheck");

// auth login
// router.get("/login", (req, res) => {
//   res.render("login");
// });

// auth logout. This is not working.
// router.get("/logout", (req, res) => {
//   req.logOut();
//   res.redirect("/");
// });

// auth with google. directs to concent screen when clicking signing with google.
router.get(
  "/google",
  authCheck.signedinCheck,
  passport.authenticate("google", {
    scope: ["profile", "https://www.googleapis.com/auth/userinfo.email"], // takes the profile and email from google.
  })
);

// redirect them to the home after the authenticating it.
router.get(
  "/google/redirect",
  authCheck.signedinCheck,
  passport.authenticate("google"),
  (req, res) => {
    res.redirect("/home");
  }
);

module.exports = router;
