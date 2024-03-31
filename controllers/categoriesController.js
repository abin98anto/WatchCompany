const Category = require("../models/categoryModel");

// Render Category Management Page.
const loadCategoryManagement = async (req, res) => {
  try {
    if (req.session.adminData) {
      console.log(`Loading Category Management.`);
      const categories = await Category.find({});
      res.render("category_management", { categories: categories });
    } else {
      console.log(`Couldn't Load Category Mangement.`);
      res.redirect("/admin/");
    }
  } catch (error) {
    res.send(`Error Loading Category Mangement.`);
  }
};

// Add Category to Database.
const addCatergory = async (req, res) => {
  try {
    console.log(`Adding A New Category to DB.`);
    const { category_name } = req.body;
    const newCategory = new Category({
      name: category_name,
    });
    await newCategory.save();
    res.redirect("/admin/category_management");
  } catch (error) {
    res.send("Error Adding Catergory.");
  }
};

// Unlist/List Category.
const toggleCategoryStatus = async (req, res) => {
  try {
    console.log(`Toggling Category Status.`);
    let id = req.query.id;
    const category = await Category.findById(id);
    if (!category) {
      res.status(404).send("Category not found");
      return;
    }
    category.isUnlisted = !category.isUnlisted;
    await category.save();
    res.redirect("/admin/category_management");
  } catch (error) {
    console.log(`Error Toggling Category Status.`);
  }
};

// Render Edit Category page.
const loadEditCategories = async (req, res) => {
  try {
    console.log(`Rendering Edit Category.`);
    const id = req.query.id;
    const toEdit = await Category.findOne({ _id: id });
    const categories = await Category.find({});
    res.render("edit_category", { toEdit: toEdit, categories: categories });
  } catch (error) {
    console.log(`Error Rendering Edit Category.`);
  }
};

// Edit Categories.
const editCategory = async (req, res) => {
  try {
    console.log(`Making Changes To A Category.`);
    let id = req.query.id;
    let { new_name } = req.body;
    await Category.updateOne({ _id: id }, { $set: { name: new_name } });
    res.redirect("/admin/category_management");
  } catch (error) {
    console.log(`Error Making Changes To A Category.`);
  }
};

module.exports = {
  loadCategoryManagement,
  addCatergory,
  toggleCategoryStatus,
  loadEditCategories,
  editCategory,
};
