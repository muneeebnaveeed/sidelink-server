const _ = require('lodash');

module.exports.getSearchRegex = function (field, search) {
    return { [field]: { $regex: `${search}`, $options: 'i' } };
};

module.exports.getMinifiedPaginationResult = function (data) {
    return _.pick(data, ['docs', 'totalDocs', 'hasPrevPage', 'hasNextPage', 'totalPages', 'pagingCounter']);
};
