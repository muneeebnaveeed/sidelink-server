const mongoose = require("mongoose");
const _ = require("lodash");
const Product = require("../models/products.model");
const ProductVariant = require("../models/productVariants.model");

const { catchAsync } = require("./errors.controller");
const AppError = require("../utils/AppError");
const utils = require("../utils");
const path = require("path");

const sanitizeProductBody = (b) => {
    const body = {
        ..._.pick(b, ["name"]),
        variants: b.variants.map((v) => _.pick(v, ["name", "sku", "price", "index"])),
    };

    let isInvalid = false;

    if (Object.keys(body).length < 2) isInvalid = true;
    if (body.variants.some((v) => Object.keys(v).length < 3)) isInvalid = true;

    return { body, isInvalid };
};

module.exports.getAllProductsOnly = catchAsync(async function (req, res, next) {
    const products = await Product.find({ isDeleted: false }, "_id name").lean();
    res.status(200).json(products);
});

module.exports.getAll = catchAsync(async function (req, res, next) {
    const { page, limit, sort, search = "" } = req.query;

    let products = [],
        productIds = [];

    if (search) {
        const productsBySearch = await utils.getProductsBySearch(search);

        products = productsBySearch.products;
        productIds = productsBySearch.productIds;
    } else {
        products = await Product.find({ isDeleted: false }).lean();
        productIds = products.map((p) => p._id);
    }

    const productVariants = await ProductVariant.find({ product: { $in: productIds }, isDeleted: false }).lean();

    const productVariantsByProduct = utils.groupProductVariants(products, productVariants);

    const paginatedProductVariantsByProduct = utils.paginate({ data: productVariantsByProduct, page, limit });

    res.status(200).json(paginatedProductVariantsByProduct);
});

module.exports.addOne = catchAsync(async function (req, res, next) {
    const { body, isInvalid } = sanitizeProductBody(req.body);

    if (isInvalid) return next(new AppError("Invalid product", 400));

    const createdProduct = await Product.create({ name: body.name });

    const variants = body.variants.map((v) => ({ ...v, product: createdProduct._id }));

    await ProductVariant.create(variants);

    res.status(200).send();
});

module.exports.edit = catchAsync(async function (req, res, next) {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) return next(new AppError("Invalid product id", 400));

    const { body, isInvalid } = sanitizeProductBody(req.body);

    if (isInvalid) return next(new AppError("Invalid product", 400));

    const correspondingProduct = await Product.findById(id);

    const promises = [];

    if (body.name !== correspondingProduct.name) {
        correspondingProduct.name = body.name;
        promises.push(correspondingProduct.save());
    }

    const allVariants = await ProductVariant.find({ product: correspondingProduct._id }, "name price sku index").lean();

    const deletedVariants = allVariants.filter((v) => !body.variants.some((b) => b.index === v.index));

    if (deletedVariants.length > 0) {
        const deletedVariantIds = deletedVariants.map((v) => v._id);
        const deletePromise = ProductVariant.deleteMany({ _id: { $in: deletedVariantIds } });
        promises.push(deletePromise);
    }

    body.variants.forEach((v) => {
        const correspondingId = allVariants.find((e) => e.index === v.index)?._id;
        let promise = null;

        if (correspondingId) promise = ProductVariant.findByIdAndUpdate(correspondingId, v, { runValidators: true });
        else promise = ProductVariant.create({ ...v, product: id });

        promises.push(promise);
    });

    await Promise.all(promises);

    res.status(200).send();
});

module.exports.remove = catchAsync(async function (req, res, next) {
    let ids = req.params.id.split(",");

    for (const id of ids) {
        if (!mongoose.isValidObjectId(id)) return next(new AppError("Invalid product ids", 400));
    }

    ids = ids.map((id) => mongoose.Types.ObjectId(id));

    await Product.updateMany({ _id: { $in: ids } }, { isDeleted: true });

    res.status(200).json();
});

module.exports.removeAll = catchAsync(async function (req, res, next) {
    await Product.updateMany({}, { isDeleted: true });
    res.status(200).json();
});
