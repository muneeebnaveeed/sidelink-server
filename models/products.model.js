const mongoose = require('mongoose');
const mongoosePagiante = require('mongoose-paginate-v2');

const schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please enter product name'],
            minlength: [4, 'Bare minimum of 4 characters are required for product name'],
        },
        sku: String,
        price: {
            type: Number,
            required: [true, 'Please enter product price'],
            min: [1, 'Product price must be greater than 0'],
        },
    },
    { timestamps: true }
);

schema.plugin(mongoosePagiante);
const Model = mongoose.model('Product', schema);

module.exports = Model;
