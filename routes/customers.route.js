const router = require("express").Router();

const {
    addOne,
    remove,
    edit,
    getAll,
    removeAll,
    getSampleFile,
    bulkUpload,
} = require("../controllers/customers.controller");
const utils = require("../utils");
const autoParams = require("../utils/autoParams");

router.get("/", autoParams, getAll);
router.post("/", addOne);
router.post("/bulk", utils.multerUploadInstance.single("file"), bulkUpload);
router.patch("/id/:id", edit);
router.delete("/id/:id", remove);
router.delete("/all", removeAll);
router.get("/sample", getSampleFile);

module.exports = router;
