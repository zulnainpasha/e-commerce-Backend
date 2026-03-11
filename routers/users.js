const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { User } = require("../models/user.js");
const jwt = require("jsonwebtoken");
const authorize = require("../helpers/authorize");

// ✅ MOVED ABOVE /:id
router.get("/get/count", authorize("admin"), async (req, res, next) => {
  try {
    const userCount = await User.countDocuments();
    if (!userCount) return res.status(500).json({ success: false });
    res.status(200).json({ userCount: userCount });
  } catch (err) {
    next(err);
  }
});

router.get("/", authorize("admin"), async (req, res, next) => {
  try {
    const userList = await User.find().select("-passwordHash");
    if (!userList) return res.status(500).json({ success: false });
    res.send(userList);
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const secret = process.env.SECRET;
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send("User not found");

    if (bcrypt.compareSync(req.body.password, user.passwordHash)) {
      const token = jwt.sign(
        { userId: user.id, role: user.role }, // ✅ role instead of isAdmin
        secret,
        { expiresIn: "1d" },
      );
      return res.status(200).send({ user: user.email, token });
    } else {
      return res.status(400).send("Invalid password");
    }
  } catch (err) {
    next(err);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    let user = new User({
      name: req.body.name,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      phone: req.body.phone,
      role: "user", // ✅ hardcoded, client cannot override
      street: req.body.street,
      apartment: req.body.apartment,
      city: req.body.city,
      country: req.body.country,
      zip: req.body.zip,
    });
    user = await user.save();
    if (!user) return res.status(500).send("User cannot be created...");
    res.status(201).send(user);
  } catch (err) {
    next(err);
  }
});

// Admin-only: create user with any role
router.post("/", authorize("admin"), async (req, res, next) => {
  try {
    let user = new User({
      name: req.body.name,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      phone: req.body.phone,
      role: req.body.role || "user",
      street: req.body.street,
      apartment: req.body.apartment,
      city: req.body.city,
      country: req.body.country,
      zip: req.body.zip,
    });
    user = await user.save();
    if (!user) return res.status(500).send("User cannot be created...");
    res.status(201).send(user);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authorize("admin"), async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Successfully deleted user" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
