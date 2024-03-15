const express = require("express");
const session = require("express-session");
const path = require("path");
require("dotenv").config(); // to access .env file.
const mongoose = require("mongoose"); 
mongoose.connect(process.env.MONGO_URL); // connecting to DB.

const port = process.env.PORT || 3000; // setting the port number.
const app = express();

app.use("/", (req, res) => {
  res.send(`hello world`);
});

app.listen(port, () => console.log(`http://localhost:${port}`));
