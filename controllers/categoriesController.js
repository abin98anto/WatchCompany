const Category = require("../models/categoryModel");
const Product = require("../models/productModel");

// Render Category Management Page.
const loadCategoryManagement = async (req, res) => {
  try {
    // if (req.session.adminData) {
    // console.log(`Loading Category Management.`);
    const categories = await Category.find({ isDeleted: false }).sort({
      createdOn: -1,
    });
    res.render("category_management", {
      categories: categories,
      message: "",
    });
    // } else {
    // console.log(`Couldn't Load Category Mangement.`);
    // res.redirect("/admin/");
    // }
  } catch (error) {
    res.send(`Error Loading Category Mangement.`);
  }
};

// Get Categories
const getCategories = async (req, res) => {
  try {
    // console.log(`getting categories.`);
    const categories = await Category.find({ isDeleted: false }).sort({
      createdOn: -1,
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Error searching categories" });
  }
};

// Add Category to Database.
const addCategory = async (req, res) => {
  try {
    // console.log(`Adding A New Category to DB.`);
    const { category_name } = req.body;
    const cat_name =
      category_name.charAt(0).toUpperCase() +
      category_name.slice(1).toLowerCase();
    const catFound = await Category.findOne({
      name: cat_name,
      isDeleted: false,
    });
    if (!catFound) {
      const newCategory = new Category({
        name: cat_name,
        createdOn: Date.now(),
      });
      await newCategory.save();
      res.redirect("/admin/category_management");
    } else {
      const categories = await Category.find({ isDeleted: false }).sort({
        createdOn: -1,
      });
      res.render("category_management", {
        categories: categories,
        message: "Category already exists.",
      });
    }
  } catch (error) {
    console.error("Error Adding Category:", error);
    res.status(500).send("Error Adding Category.");
  }
};

// Unlist/List Category.
const toggleCategoryStatus = async (req, res) => {
  try {
    // console.log(`Toggling Category Status.`);
    let id = req.query.id;
    const category = await Category.findById(id);
    // const products = await Product.find({});
    if (!category) {
      res.status(404).send("Category not found");
      return;
    }
    const products = await Product.find({});
    // console.log(products);
    products.forEach((product) => {
      if (product.category == category.name.toLowerCase()) {
        // console.log(product.name);
        product.isUnlisted = !product.isUnlisted;
        product.save();
      }
    });
    category.isUnlisted = !category.isUnlisted;
    await category.save();
    await Product.updateMany(
      { category: category._id },
      { $set: { isUnlisted: category.isUnlisted } }
    );
    res.status(200).send("Category Status Togglling successfully");
  } catch (error) {
    console.log(`Error Toggling Category Status.`);
    res.status(500).send("Internal server error");
  }
};

// Edit Categories.
const editCategory = async (req, res) => {
  try {
    // console.log(`Making Changes To A Category.`);
    let id = req.query.id;
    let { new_name } = req.body;
    await Category.updateOne({ _id: id }, { $set: { name: new_name } });
    res.status(200).send("Category deleted successfully");
  } catch (error) {
    console.log(`Error Making Changes To A Category.`);
    res.status(500).send("Internal server error");
  }
};

// Delete Categories.
const deleteCategory = async (req, res) => {
  const categoryId = req.query.id;
  // console.log(`deleting a category`);
  try {
    await Category.findByIdAndUpdate(categoryId, { isDeleted: true });
    await Category.findByIdAndUpdate(categoryId, { isUnlisted: true });
    res.status(200).send("Category deleted successfully");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal server error");
  }
};

module.exports = {
  loadCategoryManagement,
  addCategory,
  toggleCategoryStatus,
  editCategory,
  deleteCategory,
  getCategories,
};
