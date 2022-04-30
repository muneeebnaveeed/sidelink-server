const router = require("express").Router();

const { addOne, edit, getAll, remove, removeAll, consume } = require("../controllers/stock.controller");
const utils = require("../utils");
const autoParams = require("../utils/autoParams");

router.get("/", getAll);
router.post("/", addOne);
router.post("/consume", consume);

// router.post("/bulk", utils.multerUploadInstance.single("file"), bulkUpload);
router.patch("/", edit);
router.delete("/id/:id", remove);
router.delete("/all", removeAll);
// router.get("/sample", getSampleFile);

module.exports = router;
