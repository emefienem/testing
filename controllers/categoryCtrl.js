const Category = require("../models/categoryModel");

const categorCtrl = {
  getCategories: async (req, res) => {
    try {
      const categories = await Category.find();
      res.json(categories);
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  createCategory: async (req, res) => {
    try {
      const { name } = req.body;
      const category = await Category.findOne({ name });
      if (category)
        return res.status(400).json({ msg: "This category already exist" });

      const newCatgory = new Category({ name });

      await newCatgory.save();
      return res.json({ msg: "Created category successfully" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  deleteCategory: async (req, res) => {
    try {
      await Category.findByIdAndDelete(req.params.id);
      return res.json({ msg: "Category deleted successfully" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  updateCategory: async (req, res) => {
    const { name } = req.body;
    await Category.findOneAndUpdate({ _id: req.params.id }, { name });
    res.json({ msg: "Category updated successfully" });
  },
};

module.exports = categorCtrl;
