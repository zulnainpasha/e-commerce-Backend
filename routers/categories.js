const express = require("express");
const { Category } = require("../models/category.js");
const router = express.Router();
const authorize = require("../helpers/authorize");

router.get("/", async (req, res, next) => {
  try {
    const categoryList = await Category.find();
    if (!categoryList) return res.status(500).json({ success: false });
    res.send(categoryList);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found!" });
    }
    res.status(200).send(category); // ✅ fixed: 201 → 200
  } catch (err) {
    next(err);
  }
});

router.post("/", authorize("admin", "manager"), async (req, res, next) => {
  try {
    let category = new Category({
      name: req.body.name,
      icon: req.body.icon,
      color: req.body.color,
    });
    category = await category.save();
    if (!category) return res.status(500).send("Cannot create a category!");
    res.status(201).send(category);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", authorize("admin", "manager"), async (req, res, next) => {
  try {
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
        .json({ success: false, message: "Couldn't update the category" });
    }
    res.status(200).send(category);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authorize("admin"), async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    res.status(200).json({ success: true, message: "Successfully Deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
