const mongoose = require("mongoose");
const _ = require("lodash");
const Model = require("../models/stock.model");
const Product = require("../models/products.model");
const ProductVariant = require("../models/productVariants.model");

const { catchAsync } = require("./errors.controller");
const AppError = require("../utils/AppError");
const utils = require("../utils");
const path = require("path");

const sanitizeStockBody = (b) => {
    let body = b.map((e) => _.pick(e, ["_id", "quantity"]));

    const isInvalid = b.some((e) => Object.keys(e).length < 2);

    body = body.map((e) => ({ productVariant: e._id, quantity: e.quantity }));

    return { body, isInvalid };
};

const addStock = async (b, next) => {
    const { body, isInvalid } = sanitizeStockBody(b);

    if (isInvalid) return next(new AppError("Invalid stock", 400));

    const stock = await Model.find({ isDeleted: false }).lean();

    const stockToBeUpdated = [];

    stock.forEach((s) => {
        const toUpdate = body.find((b) => s.productVariant.toString() === b.productVariant.toString());
        if (toUpdate) stockToBeUpdated.push(toUpdate);
    });

    const promises = stockToBeUpdated.map((e) => {
        const correspondingStock = stock.find((s) => s.productVariant.toString() === e.productVariant.toString());
        return Model.findByIdAndUpdate(correspondingStock._id, {
            quantity: parseInt(e.quantity) + correspondingStock.quantity,
        });
    });

    if (promises.length) await Promise.all(promises);
    else await Model.create(body);
};

module.exports.addStock = addStock;

const consumeStock = async (b, next) => {
    const { body, isInvalid } = sanitizeStockBody(b);

    if (isInvalid) return next(new AppError("Invalid stock", 400));

    const stock = await Model.find({ isDeleted: false })
        .populate({ path: "productVariant", select: "_id name product", populate: { path: "product", select: "name" } })
        .lean();

    const stockToBeUpdated = [];

    stock.forEach((s) => {
        const toUpdate = body.find((b) => s.productVariant._id.toString() === b.productVariant.toString());
        if (toUpdate) stockToBeUpdated.push(toUpdate);
    });

    const promises = [];

    for (const e of stockToBeUpdated) {
        const correspondingStock = stock.find((s) => s.productVariant._id.toString() === e.productVariant.toString());
        const quantity = correspondingStock.quantity - parseInt(e.quantity);

        if (quantity < 0)
            return next(
                new AppError(
                    `Insufficient stock for ${correspondingStock.productVariant.product.name} - ${correspondingStock.productVariant.name}`,
                    404
                )
            );

        promises.push(
            Model.findByIdAndUpdate(correspondingStock._id, {
                quantity,
            })
        );
    }

    await Promise.all(promises);
};

module.exports.consumeStock = consumeStock;

module.exports.getAll = catchAsync(async function (req, res, next) {
    const { page, limit, sort, search = "" } = req.query;

    let products = [],
        productIds = [],
        productVariants = [],
        productVariantIds = [];

    if (search) {
        const productsBySearch = await utils.getStockBySearch(search, { searchDeletedProducts: true });

        products = productsBySearch.products;
        productIds = productsBySearch.productIds;
        productVariants = productsBySearch.productVariants;
        productVariantIds = productsBySearch.productVariantIds;
    } else {
        products = await Product.find().lean();
        productVariants = await ProductVariant.find().lean();
        productVariantIds = productVariants.map((e) => e._id);
    }

    const stock = await Model.find({ productVariant: { $in: productVariantIds }, isDeleted: false })
        .populate("productVariant")
        .lean();

    const productVariantsByProduct = [];

    products.forEach((product) => {
        const correspondingProductVariants = stock.filter(
            (s) => s.productVariant.product.toString() === product._id.toString()
        );

        if (correspondingProductVariants.length) {
            const entry = { _id: product._id, product, variants: correspondingProductVariants };
            productVariantsByProduct.push(entry);
        }
    });

    const paginatedProductVariantsByProduct = utils.paginate({ data: productVariantsByProduct, page, limit });

    res.status(200).json(paginatedProductVariantsByProduct);
});

module.exports.addOne = catchAsync(async function (req, res, next) {
    await addStock(req.body, next);
    res.status(200).send();
});

module.exports.consume = catchAsync(async function (req, res, next) {
    await consumeStock(req.body, next);
    res.status(200).send();
});

module.exports.bulkUpload = catchAsync(async function (req, res, next) {
    const json = await utils.readJsonFromCSV(req.file.buffer);
    await Model.create(json);
    res.status(200).send();
});

module.exports.edit = catchAsync(async function (req, res, next) {
    const { body, isInvalid } = sanitizeStockBody(req.body);

    if (isInvalid) return next(new AppError("Invalid stock", 400));

    const promises = body.map((e) =>
        Model.findOneAndUpdate({ productVariant: e.productVariant }, { quantity: e.quantity }, { runValidators: true })
    );

    await Promise.all(promises);

    res.status(200).json();
});

module.exports.remove = catchAsync(async function (req, res, next) {
    const productIds = req.params.id.split(",");

    for (const id of productIds) {
        if (!mongoose.isValidObjectId(id)) return next(new AppError("Invalid product id", 400));
    }

    const productVariants = await ProductVariant.find({ product: { $in: productIds } }, "_id").lean();

    const productVariantIds = [...new Set(productVariants.map((e) => e._id))];

    await Model.updateMany({ productVariant: { $in: productVariantIds } }, { isDeleted: true });

    res.status(200).json();
});

module.exports.removeAll = catchAsync(async function (req, res, next) {
    await Model.updateMany({}, { isDeleted: true });
    res.status(200).json();
});

module.exports.getSampleFile = catchAsync(async function (req, res, next) {
    res.download(path.join(__dirname, "..", "public", `suppliers.csv`));
});
