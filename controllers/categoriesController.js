const Category = require("../models/categoryModel");
const Product = require("../models/productModel");

// Load category management.
const loadCategoryManagement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalCategories = await Category.countDocuments({ isDeleted: false });
    const totalPages = Math.ceil(totalCategories / limit);

    const categories = await Category.find({ isDeleted: false })
      .sort({ createdOn: -1 })
      .skip(skip)
      .limit(limit);

    res.render("category_management", {
      categories,
      currentPage: page,
      totalPages,
      totalItems: totalCategories,
      message: "",
      limit,
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

    res.json({ exists: catFound !== null });
  } catch (error) {
    console.error("Error checking category existence:", error);
    res.status(500).json({ error: "Failed to check category existence." });
  }
};

// Add Category to Database.
const addCategory = async (req, res) => {
  try {
    const { category_name, categoryDiscount } = req.body;
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
        categoryDiscount,
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
  const { id } = req.query;
  const { new_name, new_discount } = req.body;

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).send("Category not found");
    }

    category.name = new_name;
    category.categoryDiscount = new_discount;

    await category.save();

    const products = await Product.find({ category: category.name });

    for (const product of products) {
      const newCategoryDiscountPrice = product.price - (product.price * new_discount) / 100;
      product.categoryDiscountPrice = newCategoryDiscountPrice;
      await product.save();
    }

    res.status(200).send("Category updated successfully");
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).send("Failed to update category");
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
