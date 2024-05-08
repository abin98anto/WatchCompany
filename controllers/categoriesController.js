const Category = require("../models/categoryModel");
const Product = require("../models/productModel");

// Render Category Management Page.
const loadCategoryManagement = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false }).sort({
      createdOn: -1,
    });
    res.render("category_management", {
      categories: categories,
      message: "",
    });
  } catch (error) {
    res.send(`Error Loading Category Mangement.`);
  }
};

// Get Categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false }).sort({
      createdOn: -1,
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Error searching categories" });
  }
};

// Duplicate Category Check
const categoryCheck = async (req, res) => {
  const { categoryName } = req.body;

  try {
    const cat_name =
      categoryName.charAt(0).toUpperCase() +
      categoryName.slice(1).toLowerCase();
    const catFound = await Category.findOne({
      name: cat_name,
      isDeleted: false,
    });

    // const catFound = await Category.findOne({
    //   name: categoryName,
    //   isDeleted: false,
    // });

    res.json({ exists: catFound !== null });
  } catch (error) {
    console.error("Error checking category existence:", error);
    res.status(500).json({ error: "Failed to check category existence." });
  }
};

// Add Category to Database.
const addCategory = async (req, res) => {
  try {
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
    let id = req.query.id;
    const category = await Category.findById(id);
    if (!category) {
      res.status(404).send("Category not found");
      return;
    }
    const products = await Product.find({});
    products.forEach((product) => {
      if (product.category == category.name.toLowerCase()) {
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
    const { id } = req.query;
    const { new_name } = req.body;
    console.log("new name :", new_name);
    await Category.updateOne({ _id: id }, { $set: { name: new_name } });

    res.status(200).send("Category updated successfully");
  } catch (error) {
    console.log(`Error Making Changes To A Category: ${error}`);
    res.status(500).send("Internal server error");
  }
};

// Delete Categories.
const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.query.id;
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
  categoryCheck,
};
