const express = require("express");
const session = require("express-session");
const path = require("path");
require("dotenv").config(); // to access .env file.
const mongoose = require("mongoose");
const user_route = require("./routes/userRoute");
mongoose.connect(process.env.MONGO_URL); // connecting to DB.

const port = process.env.PORT || 3000; // setting the port number.
const app = express();

app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views/users"),
  path.join(__dirname, "views/admin"),
]);

app.use(express.static(path.join(__dirname, "public")));

app.listen(port, () => console.log(`http://localhost:${port}`));
app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views/users"),
  path.join(__dirname, "views/admin"),
]);
app.use(express.static(path.join(__dirname, "public")));

app.use("/", user_route);
