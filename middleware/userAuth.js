// If user userData exists in the session.

const userDataPresent = async (req, res, next) => {
  console.log(`reached userDataPresent middleware.`);
  if (!req.session.userData) {
    console.log(`no userData`);
    next();
  } else {
    console.log(`userData present.`);
    res.redirect("/home");
  }
};

module.exports = {
  userDataPresent,
};
