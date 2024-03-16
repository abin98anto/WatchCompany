const express = require("express");
const user_route = express.Router();
const userController = require("../controllers/userController");

user_route.get("/", userController.loadUserLogin);

module.exports = user_route;
