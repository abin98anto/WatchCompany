const express = require("express");
const admin_route = express.Router();
const multer = require("multer");

// Loading Controllers.
const adminController = require("../controllers/adminController");
const productController = require("../controllers/productsController");
const usersController = require("../controllers/usersController");
const categoriesController = require("../controllers/categoriesController");

const upload = multer({ dest: "uploads/" });

// Render Admin Login Page, Verification, load Admin Dashboard.
admin_route.get("/", adminController.loadAdminLogin);
admin_route.post("/", adminController.verifyAdmin);
admin_route.get("/dashboard", adminController.loadDashboard);

// User Management.
admin_route.get("/user_management", usersController.loadUserManagement);
admin_route.post("/toggle_user_status", usersController.toggleUserStatus);
admin_route.get("/get_users", usersController.getUsers);

// Catergory Management.
admin_route.get(
  "/category_management",
  categoriesController.loadCategoryManagement
);
admin_route.post("/addCategory", categoriesController.addCategory);
admin_route.post("/unlist", categoriesController.toggleCategoryStatus);
admin_route.post("/list", categoriesController.toggleCategoryStatus);
admin_route.post("/edit_category", categoriesController.editCategory);
admin_route.post("/delete_category", categoriesController.deleteCategory);
admin_route.get("/get_categories", categoriesController.getCategories);

// Product Management.
admin_route.get("/product_management", productController.loadProductManagement);
admin_route.get("/add_new_product", productController.loadAddProduct);
admin_route.post("/add_new_product", productController.addProduct);
admin_route.get("/unlist_product", productController.toggleProductStatus);
admin_route.get("/list_product", productController.toggleProductStatus);
admin_route.get("/edit_product", productController.editProduct);
admin_route.post("/edit_product", productController.deleteImage);
admin_route.post("/delete_product_image", productController.deleteImage);
admin_route.get("/load_products", productController.getProducts);

// Admin logout.
admin_route.get("/logout", adminController.logout);

module.exports = admin_route;
