const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { User } = require("../models/user.js");
const jwt = require("jsonwebtoken");

router.get("/", async (req, res) => {
  const userList = await User.find().select("-passwordHash");

  if (!userList) {
    res.status(500).json({ success: false });
  }
  res.send(userList);
});

router.post("/", async (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    street: req.body.street,
    apartment: req.body.apartment,
    city: req.body.city,
    country: req.body.country,
    zip: req.body.zip,
  });
  user = await user.save();

  if (!user) {
    return res.status(500).send("User cannot be created...");
  }
  res.send(user);
});

router.post("/login", async (req, res) => {
  const secret = process.env.SECRET;
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(400).send("User not found");
  }

  if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
    const token = jwt.sign(
      {
        userId: user.id,
        isAdmin: user.isAdmin,
      },
      secret,
      { expiresIn: "1d" },
    );

    res.status(200).send({ user: user.email, token: token });
  } else res.status(400).send("Invalid password");
});

router.post("/register", async (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    street: req.body.street,
    apartment: req.body.apartment,
    city: req.body.city,
    country: req.body.country,
    zip: req.body.zip,
  });
  user = await user.save();

  if (!user) {
    return res.status(500).send("User cannot be created...");
  }
  res.send(user);
});

router.delete("/:id", (req, res) => {
  User.findByIdAndDelete(req.params.id)
    .then((user) => {
      if (user) {
        return res
          .status(200)
          .json({ success: true, message: "Succesfully Deleted user" });
      } else
        return res
          .status(404)
          .json({ success: false, message: "user not found" });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

router.get("/get/count", async (req, res) => {
  const UserCount = await User.countDocuments();

  if (!UserCount) {
    return res.status(500).json({ success: false });
  } else
    return res.status(200).json({
      UserCount: UserCount,
    });
});

module.exports = router;
