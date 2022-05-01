const router = require("express").Router();
const utils = require("../utils");

const { addOne, getProductsBySaleId } = require("../controllers/sales.controller");
const autoParams = require("../utils/autoParams");

router.post("/", addOne);
router.get("/id/:id/products", getProductsBySaleId);

module.exports = router;
