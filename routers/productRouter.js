const express = require("express");
const router = express.Router();
const productCtrl = require("../controllers/productCtrl");

router
  .route("/products")
  .get(productCtrl.getProducts)
  .post(productCtrl.createProducts);

router
  .route("/products/:id")
  .delete(productCtrl.deleteProducts)
  .put(productCtrl.updateProducts);

module.exports = router;
