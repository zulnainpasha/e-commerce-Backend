const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const { Category } = require("../models/category");
const { Product } = require("../models/product.js");
const authorize = require("../helpers/authorize");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("Invalid image type");
    if (isValid) uploadError = null;
    cb(uploadError, "public/uploads");
  },
  filename: function (req, file, cb) {
    // ✅ fixed: reg → req
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

// ✅ Public routes
router.get("/", async (req, res, next) => {
  try {
    let filter = {};
    if (req.query.categories) {
      filter = { category: req.query.categories.split(",") };
    }
    const productList = await Product.find(filter);
    if (!productList) return res.status(500).json({ success: false });
    res.send(productList);
  } catch (err) {
    next(err);
  }
});

// ✅ MOVED ABOVE /:id
router.get("/get/count", async (req, res, next) => {
  try {
    const productCount = await Product.countDocuments();
    if (!productCount) return res.status(500).json({ success: false });
    res.status(200).json({ success: true, productCount: productCount });
  } catch (err) {
    next(err);
  }
});

// ✅ MOVED ABOVE /:id
router.get("/get/featured", async (req, res, next) => {
  try {
    const isFeatured = await Product.find({ isFeatured: true });
    if (!isFeatured) return res.status(500).json({ success: false });
    res.send(isFeatured);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) return res.status(404).json({ success: false });
    res.send(product);
  } catch (err) {
    next(err);
  }
});

router.post("/", authorize("admin", "manager"), async (req, res, next) => {
  try {
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send("Invalid category");

    let product = new Product({
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: req.body.image,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    });

    product = await product.save();
    if (!product) return res.status(500).send("The product cannot be created!");
    res.status(201).send(product);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", authorize("admin", "manager"), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).send("Invalid product id");
    }
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send("Invalid category");

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: req.body.image,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
      },
      { new: true },
    );
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "The product cannot be updated" });
    }
    res.status(200).send(product);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authorize("admin"), async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    res.status(200).json({ success: true, message: "Successfully Deleted" });
  } catch (err) {
    next(err);
  }
});

router.put(
  "/gallery-images/:id",
  authorize("admin", "manager"),
  uploadOptions.array("image", 10),
  async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).send("Invalid product id");
      }
      const files = req.files;
      const basepath = `${req.protocol}://${req.get("host")}/public/uploads/`;
      const imagesPaths = files
        ? files.map((file) => `${basepath}${file.filename}`)
        : [];

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { images: imagesPaths },
        { new: true },
      );
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "The product cannot be updated" });
      }
      res.status(200).send(product);
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
