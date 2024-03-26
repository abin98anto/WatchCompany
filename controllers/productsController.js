const loadProductManagement = async (req, res) => {
  try {
    if (req.session.userData) {
      res.render("product_management");
    } else {
      res.redirect("/admin/");
    }
  } catch (error) {
    res.send(`error loading product management.`);
  }
};

module.exports = {
  loadProductManagement,
};
