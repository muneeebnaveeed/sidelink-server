const mongoose = require("mongoose");
const _ = require("lodash");
const Product = require("../models/products.model");
const ProductVariant = require("../models/productVariants.model");

const { catchAsync } = require("./errors.controller");
const AppError = require("../utils/AppError");
const utils = require("../utils");
const path = require("path");

const sanitizeAddProductVariantBody = (b) => {
    const body = _.pick(b, ["name", "price", "sku", "product", "index"]);

    let isInvalid = Object.values(body).length < 4;

    return { body, isInvalid };
};

module.exports.getAllByProduct = catchAsync(async function (req, res, next) {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) return next(new AppError("Invalid product id", 400));

    const productVariants = await ProductVariant.find({ product: productId });

    res.status(200).send(productVariants);
});

module.exports.addOne = catchAsync(async function (req, res, next) {
    const { body, isInvalid } = sanitizeAddProductVariantBody(req.body);

    if (isInvalid) return next(new AppError("Invalid product variant", 400));

    await ProductVariant.create(body);

    res.status(200).send();
});

module.exports.edit = catchAsync(async function (req, res, next) {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) return next(new AppError("Invalid product variant id", 400));

    const { body, isInvalid } = sanitizeAddProductVariantBody(req.body);

    if (isInvalid) return next(new AppError("Invalid product variant", 400));

    await ProductVariant.findByIdAndUpdate(id, body, { runValidators: true });

    res.status(200).send();
});

module.exports.remove = catchAsync(async function (req, res, next) {
    let ids = req.params.id.split(",");

    for (const id of ids) {
        if (!mongoose.isValidObjectId(id)) return next(new AppError("Invalid product ids", 400));
    }

    ids = ids.map((id) => mongoose.Types.ObjectId(id));

    await ProductVariant.updateMany({ _id: { $in: ids } }, { isDeleted: true });

    res.status(200).json();
});
