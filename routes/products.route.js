const router = require("express").Router();
const utils = require("../utils");

const {
    getAll,
    addOne,
    remove,
    edit,
    removeAll,
    getSampleFile,
    getAllProductsOnly,
} = require("../controllers/products.controller");
const autoParams = require("../utils/autoParams");

router.get("/products_only", getAllProductsOnly);
router.get("/", autoParams, getAll);
router.post("/", addOne);
router.patch("/id/:id", edit);
router.delete("/id/:id", remove);
router.delete("/all", removeAll);

module.exports = router;
