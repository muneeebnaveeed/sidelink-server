const mongoose = require("mongoose");
const _ = require("lodash");
const Purchase = require("../models/purchases.model");
const Sale = require("../models/sales.model");

const { catchAsync } = require("./errors.controller");
const AppError = require("../utils/AppError");
const utils = require("../utils");

module.exports.getAll = catchAsync(async function (req, res, next) {
    const { page, limit, sort, search = "", type = "sale,purchase", paid = "all", dates } = req.query;

    const [startDate, endDate] = dates.split(",");

    const typeFilter = type.split(",");

    const paidQuery = {};

    if (paid === "full") paidQuery.isFullyPaid = true;
    else if (paid === "partial") paidQuery.isFullyPaid = false;

    let purchasePromise = null,
        salePromise = null;

    if (typeFilter.includes("sale"))
        salePromise = Sale.find(
            {
                ...utils.searchRegex(search, "sr"),
                isDeleted: false,
                createdAt: { $gte: startDate, $lte: endDate },
                ...paidQuery,
            },
            "_id subtotal paid discount total customer sr createdAt"
        )
            .populate("customer")
            .lean();

    if (typeFilter.includes("purchase"))
        purchasePromise = Purchase.find(
            {
                ...utils.searchRegex(search, "sr"),
                isDeleted: false,
                createdAt: { $gte: startDate, $lte: endDate },
                ...paidQuery,
            },
            "_id subtotal paid discount total supplier sr createdAt"
        )
            .populate("supplier")
            .lean();

    const [purchases, sales] = await Promise.all([purchasePromise, salePromise]);

    let data = [],
        transformedPurchases = [],
        transformedSales = [];

    if (purchases)
        transformedPurchases = purchases.map((e) => ({
            ..._.omit(e, ["supplier"]),
            contact: e.supplier,
            type: "PURCHASE",
        }));

    if (sales)
        transformedSales = sales.map((e) => ({
            ..._.omit(e, ["customer"]),
            contact: e.customer,
            type: "SALE",
        }));

    if (sales && purchases) data = [...transformedPurchases, ...transformedSales];
    else if (sales) data = [...transformedSales];
    else data = [...transformedPurchases];

    // data = data.map((e) => ({
    //     ...e,
    //     sr: e._id.toString().slice(e._id.toString().length - 4, e._id.toString().length),
    // }));

    const sorted = utils.sort({ data, sort });

    const paginated = utils.paginate({ data: sorted, page, limit });

    res.status(200).json(paginated);
});

module.exports.remove = catchAsync(async function (req, res, next) {
    let ids = req.params.id.split(",");

    for (const id of ids) {
        if (!mongoose.isValidObjectId(id)) return next(new AppError("Invalid transaction id", 400));
    }

    ids = ids.map((id) => mongoose.Types.ObjectId(id));

    await Promise.all([
        Purchase.updateMany({ _id: { $in: ids } }, { isDeleted: true }),
        Sale.updateMany({ _id: { $in: ids } }, { isDeleted: true }),
    ]);

    res.status(200).json();
});

module.exports.pay = catchAsync(async function (req, res, next) {
    const { id, amount } = req.params;

    if (!mongoose.isValidObjectId(id)) return next(new AppError("Invalid transaction id", 400));

    if (amount > 0) {
        const [purchase, sale] = await Promise.all([Purchase.findById(id), Sale.findById(id)]);

        let promise = null;

        if (purchase) {
            const paid = purchase.paid + amount;
            const isFullyPaid = paid >= purchase.total;
            purchase.paid = paid;
            purchase.isFullyPaid = isFullyPaid;

            promise = purchase.save();
        } else if (sale) {
            const paid = sale.paid + amount;
            const isFullyPaid = paid >= sale.total;
            sale.paid = paid;
            sale.isFullyPaid = isFullyPaid;

            promise = sale.save();
        } else return next(new AppError("Transaction does not exist", 404));

        await promise;
    }

    res.status(200).json();
});

module.exports.removeAll = catchAsync(async function (req, res, next) {
    await Promise.all([Purchase.updateMany({}, { isDeleted: true }), Sale.updateMany({}, { isDeleted: true })]);
    res.status(200).json();
});
