const express = require("express");
const router = express.Router();
const categorCtrl = require("../controllers/categoryCtrl");
const auth = require("../middleware/auth");
const authAdmin = require("../middleware/authAdmin");

router
  .route("/category")
  .get(categorCtrl.getCategories)
  .post(auth, authAdmin, categorCtrl.createCategory);

router
  .route("/category/:id")
  .delete(auth, authAdmin, categorCtrl.deleteCategory)
  .put(auth, authAdmin, categorCtrl.updateCategory);

module.exports = router;
