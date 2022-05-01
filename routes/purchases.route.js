const router = require("express").Router();
const utils = require("../utils");

const { addOne, getProductsByPurchaseId } = require("../controllers/purchases.controller");
const autoParams = require("../utils/autoParams");

// router.get("/products_only", getAllProductsOnly);
// router.get("/", autoParams, getAll);
router.post("/", addOne);
router.get("/id/:id/products", getProductsByPurchaseId);
// router.patch("/id/:id", edit);
// router.delete("/id/:id", remove);
// router.delete("/all", removeAll);

module.exports = router;
