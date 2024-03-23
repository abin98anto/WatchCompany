const express = require("express");
const session = require("express-session");
const path = require("path");
require("dotenv").config(); // to access .env file.
const mongoose = require("mongoose");
const user_route = require("./routes/userRoute");
mongoose.connect(process.env.MONGO_URL); // connecting to DB.
const authRoutes = require("./routes/authRoutes"); // to place /auth between the requests
const passportSetup = require("./config/passport-setup");
const keys = require("./config/keys");
const passport = require("passport"); // imports passport.

const port = process.env.PORT || 3000; // setting the port number.
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds to store cookies.
    },
  })
);

app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views/users"),
  path.join(__dirname, "views/admin"),
]);

app.use(passport.initialize()); // initilalizing the passport.
app.use(passport.session()); // initilalizing the passport session.

app.use("/auth", authRoutes); // puts /auth infront of the routes.

app.use(express.static(path.join(__dirname, "public")));

app.use("/", user_route);

app.listen(port, () => console.log(`http://localhost:${port}`));
