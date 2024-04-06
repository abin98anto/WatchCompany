const express = require("express");
const session = require("express-session");
const path = require("path");
require("dotenv").config();
const mongoose = require("mongoose");
const user_route = require("./routes/userRoute");
const admin_route = require("./routes/adminRoute");
mongoose.connect(process.env.MONGO_URL);
const secretKey = process.env.SECRET_KEY;

const port = process.env.PORT || 3000;
const app = express();

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
]);

app.use(express.static(path.join(__dirname, "public")));

app.use("/", user_route);

app.use("/admin", admin_route);

app.listen(port, () => console.log(`http://localhost:${port}`));
