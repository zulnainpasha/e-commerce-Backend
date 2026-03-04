const express = require("express");
const { Category } = require("../models/category.js");
const router = express.Router();

router.get("/", async (req, res) => {
  const categoryList = await Category.find();

  if (!categoryList) {
    return res.status(500).json({ success: false });
  }
  res.send(categoryList);
});

router.get("/:id", async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res
      .status(404)
      .json({ success: false, message: "category not found!" });
  } else {
    res.status(201).send(category);
  }
});

router.post("/", async (req, res) => {
  let category = new Category({
    name: req.body.name,
    icon: req.body.icon,
    color: req.body.color,
  });
  category = await category.save();

  if (!category) {
    return res.status(500).send("Cannot create a category!!!");
  }
  res.send(category);
});

router.delete("/:id", (req, res) => {
  Category.findByIdAndDelete(req.params.id)
    .then((category) => {
      if (category) {
        return res
          .status(200)
          .json({ success: true, message: "Succesfully Deleted" });
      } else
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

router.put("/:id", async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      icon: req.body.icon,
      color: req.body.color,
    },
    { new: true },
  );

  if (!category) {
    return res
      .status(404)
      .json({ success: false, message: "Couldnt update the file" });
  } else return res.send(category);
});

module.exports = router;
