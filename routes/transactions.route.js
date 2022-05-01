const router = require("express").Router();
const utils = require("../utils");

const { getAll, remove, removeAll, pay } = require("../controllers/transactions.controller");
const autoParams = require("../utils/autoParams");

// router.get("/products_only", getAllProductsOnly);
router.get("/", getAll);
router.post("/id/:id/pay/amount/:amount", pay);
// router.patch("/id/:id", edit);
router.delete("/id/:id", remove);
router.delete("/all", removeAll);

module.exports = router;
