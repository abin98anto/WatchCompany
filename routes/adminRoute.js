const express = require("express");
const admin_route = express.Router();
const adminController = require("../controllers/adminController");
const productController = require("../controllers/productsController");
const usersController = require("../controllers/usersController");
const categoriesController = require("../controllers/categoriesController");

admin_route.get("/", adminController.loadAdminLogin);
admin_route.post("/", adminController.verifyAdmin);

admin_route.get("/dashboard", adminController.loadDashboard);

admin_route.get("/product_management", productController.loadProductManagement);

admin_route.get(
  "/category_management",
  categoriesController.loadCategoryManagement
);

// user management.
admin_route.get("/user_management", usersController.loadUserManagement);
admin_route.get("/block", usersController.blockUser);
admin_route.get("/unblock", usersController.unblockUser);

admin_route.get("/logout", adminController.logout);

module.exports = admin_route;
