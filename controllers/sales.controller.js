const mongoose = require("mongoose");
const _ = require("lodash");
const Model = require("../models/sales.model");
const { catchAsync } = require("./errors.controller");
const AppError = require("../utils/AppError");
const utils = require("../utils");
const path = require("path");
const { addStock, consumeStock } = require("./stock.controller");

const sanitizeSaleBody = (b, next) => {
    const body = _.pick(b, ["customer", "paid", "discount", "products"]);
    body.products = body.products.map((e) => ({ _id: e.product, quantity: e.quantity, total: e.total }));

    if (Object.keys(body).length < 4) return next(new AppError("Invalid sale", 400));

    if (!mongoose.isValidObjectId(body.customer)) return next(new AppError("Invalid customer id", 400));

    if (body.products.some((e) => !e._id || !e.quantity)) return next(new AppError("Invalid products in sale"));

    return body;
};

module.exports.getProductsBySaleId = catchAsync(async function (req, res, next) {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) return next(new AppError("Invalid Sale id", 400));

    const sale = await Model.findById(id, "products")
        .populate({
            path: "products.productVariant",
            select: "_id name sku price product",
            populate: { path: "product", select: "_id name" },
        })
        .lean();

    res.status(200).json(sale.products);
});

module.exports.addOne = catchAsync(async function (req, res, next) {
    const body = sanitizeSaleBody(req.body, next);

    const subtotals = body.products.map((e) => parseInt(e.total));

    const subtotal = [0, 0, ...subtotals].reduce((a, b) => a + b);

    const total = subtotal - Math.floor((subtotal * parseInt(body.discount)) / 100);

    const isFullyPaid = body.paid >= total;

    const sale = {
        ...body,
        products: body.products.map((e) => ({ ...e, productVariant: e._id })),
        subtotal,
        total,
        isFullyPaid,
    };

    await Promise.all([consumeStock(body.products, next), Model.create(sale)]);

    res.status(200).send();
});
