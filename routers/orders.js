const express = require("express");
const router = express.Router();
const { Order } = require("../models/order.js");
const { OrderItem } = require("../models/order-item.js");

router.get("/", async (req, res) => {
  const orderList = await Order.find()
    .populate("user", "name") // populate means more information
    .sort({ dateOrdered: -1 }); // sorting from decending(newest to oldest)

  if (!orderList) {
    return res.status(500).json({ success: false });
  }

  res.send(orderList);
});

router.get("/:id", async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name") // populate means more information
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    });
  if (!order) {
    return res.status(500).json({ success: false });
  }

  res.send(order);
});

router.post("/", async (req, res) => {
  const orderItemsIds = await Promise.all(
    req.body.orderItems.map(async (orderItem) => {
      let newOrderItem = new OrderItem({
        quantity: orderItem.quantity,
        product: orderItem.product,
      });

      newOrderItem = await newOrderItem.save();
      return newOrderItem._id;
    }),
  );

  const totalPrices = await Promise.all(
    orderItemsIds.map(async (orderItemId) => {
      const orderItem = await OrderItem.findById(orderItemId).populate(
        "product",
        "price",
      );

      return orderItem.product.price * orderItem.quantity;
    }),
  );

  const totalPrice = totalPrices.reduce((a, b) => a + b, 0);
  console.log(totalPrice);

  let order = new Order({
    orderItems: orderItemsIds,
    shippingAddress1: req.body.shippingAddress1,
    shippingAddress2: req.body.shippingAddress2,
    city: req.body.city,
    zip: req.body.zip,
    country: req.body.country,
    phone: req.body.phone,
    status: req.body.status,
    totalPrice: totalPrice,
    user: req.body.user,
  });

  order = await order.save();

  if (!order) {
    return res.status(500).send("Cannot create an order!!!");
  }

  res.send(order);
});

router.put("/:id", async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
    },
    { new: true },
  );

  if (!order) {
    return res
      .status(404)
      .json({ success: false, message: "Couldnt update the order" });
  } else return res.send(order);
});

router.delete("/:id", (req, res) => {
  Order.findByIdAndDelete(req.params.id)
    .then(async (order) => {
      if (order) {
        await order.orderItems.map(async (orderItem) => {
          await OrderItem.findByIdAndDelete(orderitem);
        });
        return res
          .status(200)
          .json({ success: true, message: "the order was deleted" });
      } else
        return res
          .status(404)
          .json({ success: false, message: "order not found" });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

router.get("/get/totalsales", async (req, res) => {
  const totalSales = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalsales: { $sum: "$totalPrice" },
      },
    },
  ]);

  if (!totalSales) {
    return res.status(400).send("The order sales cannot be generated");
  }

  res.send({ totalsales: totalSales[0].totalsales });
});

router.get("/get/count", async (req, res) => {
  const orderCount = await Order.countDocuments();

  if (!orderCount) {
    return res.status(500).json({ success: false });
  } else return res.send({ orderCount: orderCount });
});

router.get("/get/userorder/:userid", async (req, res) => {
  const userOrderList = await Order.find({ user: req.params.userid })
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        populate: "category",
      },
    })
    .sort({ dateOrdered: -1 });

  if (!userOrderList) {
    return res.status(500).json({ success: false });
  }

  res.send(userOrderList);
});

module.exports = router;
