const multer = require("multer");
const csv = require("csvtojson");
const lodash = require("lodash");
const jwt = require("jsonwebtoken");

class Utils {
    constructor() {
        const storage = multer.memoryStorage();
        this.multerUploadInstance = multer({ storage });
    }

    async readJsonFromCSV(buffer) {
        const json = await csv().fromString(buffer.toString());
        return json;
    }

    signJWTToken(payload) {
        const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        return token;
    }

    searchRegex(search, field) {
        return { [field]: { $regex: `${search}`, $options: "i" } };
    }

    getMinifiedPaginationResult(data) {
        return lodash.pick(data, ["docs", "totalDocs", "hasPrevPage", "hasNextPage", "totalPages", "pagingCounter"]);
    }

    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

const utils = new Utils();
module.exports = utils;
