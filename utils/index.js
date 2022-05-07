const multer = require("multer");
const csv = require("csvtojson");
const lodash = require("lodash");
const jwt = require("jsonwebtoken");
const ProductVariant = require("../models/productVariants.model");
const Product = require("../models/products.model");
const Stock = require("../models/stock.model");

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

    sort({ data, sort }) {
        const arrayedSort = Object.entries(JSON.parse(sort));
        const sortKey = arrayedSort[0][0];
        const sortValue = arrayedSort[0][1];

        const sorted = data.sort((a, b) => {
            return a[sortKey] === b[sortKey] ? 0 : a[sortKey] > b[sortKey] ? sortValue * 1 : sortValue * -1;
        });

        return sorted;
    }

    paginate({ data, page, limit }) {
        const docsToLimitRatio = data.length / limit;
        const flooredDocsToLimitRatio = Math.floor(docsToLimitRatio);

        let pages = flooredDocsToLimitRatio,
            docs = [];

        if (flooredDocsToLimitRatio < docsToLimitRatio) pages = flooredDocsToLimitRatio + 1;

        const hasNextPage = page < pages;

        const startIndex = page * limit - limit;

        docs = data.slice(startIndex, startIndex + limit);

        return { docs, pagingCounter: startIndex + 1, hasNextPage, page, limit };
    }

    deduplicateObjectsArray(arr, key) {
        return arr.filter((value, index, self) => index === self.findIndex((t) => t[key] === value[key]));
    }

    groupProductVariants(products, productVariants) {
        const productVariantsByProduct = [];

        products.forEach((product) => {
            const correspondingProductVariants = productVariants.filter(
                (productVariant) => productVariant.product.toString() === product._id.toString()
            );
            const entry = { _id: product._id, product, variants: correspondingProductVariants };
            productVariantsByProduct.push(entry);
        });

        return productVariantsByProduct;
    }

    async getProductsBySearch(search) {
        const [searchedProductVariants, searchedProducts] = await Promise.all([
            ProductVariant.find(
                {
                    $or: [utils.searchRegex(search, "name"), utils.searchRegex(search, "sku")],
                    isDeleted: false,
                },
                "product"
            ).lean(),
            Product.find({ ...utils.searchRegex(search, "name"), isDeleted: false }, "_id").lean(),
        ]);

        const searchedProductIds = [
            ...searchedProducts.map((e) => e._id.toString()),
            ...searchedProductVariants.map((e) => e.product.toString()),
        ];

        const productIds = [...new Set(searchedProductIds)];

        const products = await Product.find({ _id: { $in: productIds }, isDeleted: false }).lean();

        return {
            productIds,
            products,
        };
    }

    async getStockBySearch(search, params = { searchDeletedProducts: false }) {
        const isDeleted = [false];

        if (params.searchDeletedProducts) isDeleted.push(true);

        const stock = await Stock.find({ isDeleted: false }, "productVariant").lean();

        const stockedProductVariantIds = [...new Set(stock.map((s) => s.productVariant.toString()))];

        const searchedProductVariants = await ProductVariant.find({
            _id: { $in: stockedProductVariantIds },
            $or: [utils.searchRegex(search, "name"), utils.searchRegex(search, "sku")],
        }).lean();

        const searchedVariantProductIds = [...new Set(searchedProductVariants.map((e) => e.product.toString()))];

        const searchedProducts = await Product.find(
            {
                $or: [utils.searchRegex(search, "name"), { _id: { $in: searchedVariantProductIds } }],
            },
            "_id name"
        ).lean();

        const searchedProductIds = searchedProducts.map((e) => e._id.toString());

        const productIds = [...new Set(searchedProductIds)];

        const productVariantIds = searchedProductVariants.map((e) => e._id.toString());

        return {
            productIds,
            products: searchedProducts,
            productVariants: searchedProductVariants,
            productVariantIds,
        };
    }

    generateSR(next) {
        if (this.isNew) {
            const id = this._id.toString();
            const sr = id.slice(id.length - 4, id.length);
            this.sr = sr;
        }

        next();
    }
}

const utils = new Utils();

module.exports = utils;
