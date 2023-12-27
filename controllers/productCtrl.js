const Products = require("../models/productModel");

class APIfeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filtering() {
    const queryObj = { ...this.queryString };
    console.log({ before: queryObj });
    const excludedFields = ["page", "sort", "limit"];
    excludedFields.forEach((field) => delete queryObj[field]);

    console.log({ after: queryObj });
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lt|lte|regex)\b/g,
      (match) => "$" + match
    );
    this.query.find(JSON.parse(queryStr));
    console.log(queryStr);
    return this;
  }
  sorting() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      console.log(sortBy);
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("createdAt");
    }
    return this;
  }
  paginating() {
    const page = this.queryString * 1 || 1;
    const limit = this.queryString.limit * 1 || 3;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

const productCtrl = {
  getProducts: async (req, res) => {
    try {
      const features = new APIfeatures(Products.find(), req.query)
        .filtering()
        .sorting()
        .paginating();
      const products = await features.query;

      return res.json({
        status: "success",
        result: products.length,
        products,
      });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  createProducts: async (req, res) => {
    try {
      const {
        product_id,
        title,
        price,
        description,
        content,
        images,
        category,
      } = req.body;
      if (!images) return res.status(400).json({ msg: "No image upload" });

      const product = await Products.findOne({ product_id });

      if (product) return res.status(400).json({ msg: "This product exists" });

      const newProducts = new Products({
        product_id,
        title: title.toLowerCase(),
        price,
        description,
        content,
        images,
        category,
      });
      await newProducts.save();
      return res.json({ msg: "Created the product" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  deleteProducts: async (req, res) => {
    try {
      await Products.findByIdAndDelete(req.params.id);
      res.json({ msg: "Deleted the product" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  updateProducts: async (req, res) => {
    try {
      const { title, price, description, content, images, category } = req.body;
      if (!images) return res.status(400).json({ msg: "No image upload" });
      await Products.findOneAndUpdate(
        { _id: req.params.id },
        {
          title: title.toLowerCase(),
          price,
          description,
          content,
          images,
          category,
        }
      );
      return res.json({ msg: "Updated the products" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
};

module.exports = productCtrl;
