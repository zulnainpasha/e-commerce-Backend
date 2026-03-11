const express = require("express");
const router = express.Router();
const { Order } = require("../models/order.js");
const { OrderItem } = require("../models/order-item.js");
const authorize = require("../helpers/authorize");

// ✅ MOVED ABOVE /:id
router.get("/get/totalsales", authorize("admin"), async (req, res, next) => {
  try {
    const totalSales = await Order.aggregate([
      { $group: { _id: null, totalsales: { $sum: "$totalPrice" } } },
    ]);
    if (!totalSales)
      return res.status(400).send("The order sales cannot be generated");
    res.send({ totalsales: totalSales[0].totalsales });
  } catch (err) {
    next(err);
  }
});

// ✅ MOVED ABOVE /:id
router.get(
  "/get/count",
  authorize("admin", "manager"),
  async (req, res, next) => {
    try {
      const orderCount = await Order.countDocuments();
      if (!orderCount) return res.status(500).json({ success: false });
      res.send({ orderCount: orderCount });
    } catch (err) {
      next(err);
    }
  },
);

// ✅ MOVED ABOVE /:id
router.get("/get/userorder/:userid", async (req, res, next) => {
  try {
    const userOrderList = await Order.find({ user: req.params.userid })
      .populate({
        path: "orderItems",
        populate: { path: "product", populate: "category" },
      })
      .sort({ dateOrdered: -1 });
    if (!userOrderList) return res.status(500).json({ success: false });
    res.send(userOrderList);
  } catch (err) {
    next(err);
  }
});

router.get("/", authorize("admin", "manager"), async (req, res, next) => {
  try {
    const orderList = await Order.find()
      .populate("user", "name")
      .sort({ dateOrdered: -1 });
    if (!orderList) return res.status(500).json({ success: false });
    res.send(orderList);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name")
      .populate({
        path: "orderItems",
        populate: { path: "product", populate: "category" },
      });
    if (!order) return res.status(404).json({ success: false });
    res.send(order);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
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
    if (!order) return res.status(500).send("Cannot create an order!");
    res.status(201).send(order);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", authorize("admin", "manager"), async (req, res, next) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true },
    );
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Couldn't update the order" });
    }
    res.status(200).send(order);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authorize("admin"), async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    // ✅ fixed typo: orderitem → orderItem
    await Promise.all(
      order.orderItems.map((orderItem) =>
        OrderItem.findByIdAndDelete(orderItem),
      ),
    );
    res
      .status(200)
      .json({ success: true, message: "Order deleted successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
