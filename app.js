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
app.use(bodyParser.json());
app.use(morgan("tiny"));

// ✅ Static files BEFORE authJwt
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));

app.use(authJwt());

const productsRouter = require("./routers/products.js");
const categoriesRouter = require("./routers/categories.js");
const orderRouter = require("./routers/orders.js");
const userRouter = require("./routers/users.js");

app.use(`${api}/products`, productsRouter);
app.use(`${api}/categories`, categoriesRouter);
app.use(`${api}/orders`, orderRouter);
app.use(`${api}/users`, userRouter);

app.use(errorHandler);

mongoose
  .connect(process.env.CONNECTION_STRING, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("Database connection is ready");
  })
  .catch((err) => {
    console.log("Database connection error:", err); // ✅ log actual error
  });

// ✅ Use Railway's dynamic PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API URL: ${api}`);
  console.log(`Server is running on port ${PORT}`);
});
