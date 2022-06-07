const mongoose = require("mongoose");
const _ = require("lodash");
const Model = require("../models/employees.model");
const { catchAsync } = require("./errors.controller");
const AppError = require("../utils/AppError");
const utils = require("../utils");
const path = require("path");

module.exports.getUnpaginated = catchAsync(async function (req, res, next) {
    const data = await Model.find({}, "_id name salary").lean();
    res.status(200).json(data);
});

module.exports.getAll = catchAsync(async function (req, res, next) {
    const { page, limit, sort, search = "" } = req.query;

    const data = await Model.paginate(
        {
            isDeleted: false,
            $or: [utils.searchRegex(search, "name")],
        },
        { projection: { __v: 0 }, lean: true, page, limit, sort }
    );

    res.status(200).json(utils.getMinifiedPaginationResult(data));
});

module.exports.addOne = catchAsync(async function (req, res, next) {
    const body = _.pick(req.body, ["name", "phone", "salary"]);
    await Model.create(body);
    res.status(200).send();
});

module.exports.bulkUpload = catchAsync(async function (req, res, next) {
    const json = await utils.readJsonFromCSV(req.file.buffer);
    await Model.create(json);
    res.status(200).send();
});

module.exports.edit = catchAsync(async function (req, res, next) {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) return next(new AppError("Invalid employee id", 400));

    const body = _.pick(req.body, ["name", "phone", "salary"]);

    await Model.findByIdAndUpdate(id, body, { runValidators: true });

    res.status(200).json();
});

module.exports.remove = catchAsync(async function (req, res, next) {
    let ids = req.params.id.split(",");

    for (const id of ids) {
        if (!mongoose.isValidObjectId(id)) return next(new AppError("Invalid employee id", 400));
    }

    ids = ids.map((id) => mongoose.Types.ObjectId(id));

    await Model.updateMany({ _id: { $in: ids } }, { isDeleted: true });

    res.status(200).json();
});

module.exports.removeAll = catchAsync(async function (req, res, next) {
    await Model.updateMany({}, { isDeleted: true });
    res.status(200).json();
});

module.exports.getSampleFile = catchAsync(async function (req, res, next) {
    res.download(path.join(__dirname, "..", "public", `employees.csv`));
});
