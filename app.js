const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const authJwt = require("./helpers/jwt.js");
const errorHandler = require("./helpers/error-handler.js");

require("dotenv/config");
const api = process.env.API_URL;

app.use(cors());
// app.options("*/", cors());

app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(authJwt());
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));

const productsRouter = require(`${__dirname}/routers/products.js`);
const categoriesRouter = require(`${__dirname}/routers/categories.js`);
const orderRouter = require(`${__dirname}/routers/orders.js`);
const userRouter = require(`${__dirname}/routers/users.js`);

app.use(`${api}/products`, productsRouter);
app.use(`${api}/categories`, categoriesRouter);
app.use(`${api}/orders`, orderRouter);
app.use(`${api}/users`, userRouter);
app.use(errorHandler);

mongoose
  .connect(process.env.CONNECTION_STRING)
  .then(() => {
    console.log("Database connection is ready");
  })
  .catch((err) => {
    console.log("ERROR");
  });

let PORT = 3000;
app.listen(PORT, () => {
  console.log(api);
  console.log(`Server is running on port ${PORT}`);
});

