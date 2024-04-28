const express = require("express");
const admin_route = express.Router();
const multer = require("multer");

// Loading Controllers.
const adminController = require("../controllers/adminController");
const productController = require("../controllers/productsController");
const usersController = require("../controllers/usersController");
const categoriesController = require("../controllers/categoriesController");

const adminAuth = require("../middleware/adminAuth");

const upload = multer({ dest: "uploads/" });

// Render Admin Login Page, Verification, load Admin Dashboard.
admin_route.get("/", adminAuth.adminLogout, adminController.loadAdminLogin);
admin_route.post("/", adminController.verifyAdmin);
admin_route.get(
  "/dashboard",
  adminAuth.adminLogin,
  adminController.loadDashboard
);

// User Management.
admin_route.get(
  "/user_management",
  adminAuth.adminLogin,
  usersController.loadUserManagement
);
admin_route.post("/toggle_user_status", usersController.toggleUserStatus);
admin_route.get("/get_users", adminAuth.adminLogin, usersController.getUsers);

// Catergory Management.
admin_route.get(
  "/category_management",
  adminAuth.adminLogin,
  categoriesController.loadCategoryManagement
);
admin_route.post("/addCategory", categoriesController.addCategory);
admin_route.post("/unlist", categoriesController.toggleCategoryStatus);
admin_route.post("/list", categoriesController.toggleCategoryStatus);
admin_route.post("/edit_category", categoriesController.editCategory);
admin_route.post("/delete_category", categoriesController.deleteCategory);
admin_route.get(
  "/get_categories",
  adminAuth.adminLogin,
  categoriesController.getCategories
);

// Product Management.
admin_route.get(
  "/product_management",
  adminAuth.adminLogin,
  productController.loadProductManagement
);
admin_route.get(
  "/add_new_product",
  adminAuth.adminLogin,
  productController.loadAddProduct
);
admin_route.post("/add_new_product", productController.addProduct);
admin_route.get(
  "/unlist_product",
  adminAuth.adminLogin,
  productController.toggleProductStatus
);
admin_route.get(
  "/list_product",
  adminAuth.adminLogin,
  productController.toggleProductStatus
);
admin_route.get(
  "/edit_product",
  adminAuth.adminLogin,
  productController.loadEditProduct
);
admin_route.post("/edit_product", productController.editProduct);
admin_route.post("/delete_image", productController.deleteImage);
admin_route.get(
  "/load_products",
  adminAuth.adminLogin,
  productController.getProducts
);

// Admin logout.
admin_route.get("/logout", adminAuth.adminLogin, adminController.logout);

module.exports = admin_route;
