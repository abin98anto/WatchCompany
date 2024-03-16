const express = require("express");
const User = require("../models/userModel");

const loadUserLogin = async (req, res) => {
  res.render("signup");
};

module.exports = {
  loadUserLogin,
};
