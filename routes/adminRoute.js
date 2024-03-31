const express = require("express");
const admin_route = express.Router();

// Loading Controllers.
const adminController = require("../controllers/adminController");
const productController = require("../controllers/productsController");
const usersController = require("../controllers/usersController");
const categoriesController = require("../controllers/categoriesController");

// Render Admin Login Page, Verification, load Admin Dashboard.
admin_route.get("/", adminController.loadAdminLogin);
admin_route.post("/", adminController.verifyAdmin);
admin_route.get("/dashboard", adminController.loadDashboard);

// User Management.
admin_route.get("/user_management", usersController.loadUserManagement);
admin_route.get("/block", usersController.toggleUserStatus);
admin_route.get("/unblock", usersController.toggleUserStatus);

// Catergory Management.
admin_route.get(
  "/category_management",
  categoriesController.loadCategoryManagement
);
admin_route.post("/addCategory", categoriesController.addCatergory);
admin_route.get("/unlist", categoriesController.toggleCategoryStatus);
admin_route.get("/list", categoriesController.toggleCategoryStatus);
admin_route.get("/load_edit_category", categoriesController.loadEditCategories);
admin_route.post("/edit_category", categoriesController.editCategory);

// Product Management.
admin_route.get("/product_management", productController.loadProductManagement);
admin_route.get("/add_new_product", productController.loadAddProduct);
admin_route.post("/add_new_product", productController.addProduct);

// Admin logout.
admin_route.get("/logout", adminController.logout);

module.exports = admin_route;
