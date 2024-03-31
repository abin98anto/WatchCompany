const Category = require("../models/categoryModel");

// Render product management page.
const loadProductManagement = async (req, res) => {
  try {
    if (req.session.adminData) {
      console.log(`Rendering Product Management.`);
      res.render("product_management");
    } else {
      console.log(`Couldn't Render Product Management.`);
      res.redirect("/admin/");
    }
  } catch (error) {
    res.send(`Error Rendering Product Management.`);
  }
};

// Render add new product page.
const loadAddProduct = async (req, res) => {
  try {
    console.log(`Rendering Add New Product Page.`);
    const categories = await Category.find({ isUnlisted: false });
    res.render("add_new_product", { categories: categories });
  } catch (error) {
    console.log(`Error Rendering Add New Product Page.`);
  }
};

// Adding the product to database.
const addProduct = async (req, res) => {
  try {
    console.log(`Adding New Product to DB.`);
  } catch (error) {
    console.log(`Error Adding New Product to DB.`);
  }
};

module.exports = {
  loadProductManagement,
  loadAddProduct,
  addProduct,
};
