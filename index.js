const express = require("express");
const session = require("express-session");
const path = require("path");
require("dotenv").config();
const mongoose = require("mongoose");
const user_route = require("./routes/userRoute");
const admin_route = require("./routes/adminRoute");
mongoose.connect(process.env.MONGO_URL);
const secretKey = process.env.SECRET_KEY;
const nocache = require("nocache");

const port = process.env.PORT || 3000;
const app = express();

app.use(nocache());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
  })
);

app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views/users"),
  path.join(__dirname, "views/admin"),
  path.join(__dirname, "views/partials"),
]);
// app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.use("/", user_route);

app.use("/admin", admin_route);

// Middleware to handle undefined routes
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.log(req.url.split("/")[1]);
  let url = "";
  let folder = "";
  req.url.split("/")[1] == "admin" ? (folder = "admin") : (folder = "user");
  req.url.split("/")[1] == "admin" ? (url = "/admin") : (url = "/");
  res.status(err.status || 500);
  res.render("404", { error: err, url: url, folder: folder });
});

app.listen(port, () => console.log(`http://localhost:${port}`));
