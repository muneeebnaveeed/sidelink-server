const mongoose = require('mongoose');
const _ = require('lodash');
const Model = require('../models/products.model');
const { catchAsync } = require('./errors.controller');
const AppError = require('../utils/AppError');
const User = require('../models/users.model');
const dayjs = require('dayjs');
const { getMinifiedPaginationResult } = require('../utils/misc');

module.exports.getAll = catchAsync(async function (req, res, next) {
    const { page, limit } = req.query;
    const data = await Model.paginate({}, { projection: { __v: 0 }, lean: true, page, limit });
    res.status(200).json(getMinifiedPaginationResult(data));
});

module.exports.addOne = catchAsync(async function (req, res, next) {
    const body = _.pick(req.body, ['name', 'sku', 'price']);
    await Model.create(body);
    res.status(200).send();
});

// module.exports.edit = catchAsync(async function (req, res, next) {
//     const { id } = req.params;

//     if (!mongoose.isValidObjectId(id)) return next(new AppError('Please enter a valid id', 400));

//     const body = _.pick(req.body, ['color', 'title', 'shiftTimes', 'employees']);

//     await Model.findByIdAndUpdate(id, body, { runValidators: true });
//     await User.updateMany({ _id: { $in: body.employees } }, { schedule: id, isScheduleAssigned: true });

//     res.status(200).json();
// });

module.exports.remove = catchAsync(async function (req, res, next) {
    let ids = req.params.id.split(',');

    for (const id of ids) {
        if (!mongoose.isValidObjectId(id)) return next(new AppError('Please enter valid id(s)', 400));
    }

    ids = ids.map((id) => mongoose.Types.ObjectId(id));

    await Model.deleteMany({ _id: { $in: ids } });

    res.status(200).json();
});