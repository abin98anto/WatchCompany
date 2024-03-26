const loadCategoryManagement = async (req, res) => {
  try {
    if (req.session.userData) {
      res.render("category_management");
    } else {
      res.redirect("/admin/");
    }
  } catch (error) {
    res.send(`error loading catergory management.`);
  }
};

module.exports = {
  loadCategoryManagement,
};
