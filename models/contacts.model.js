const mongoose = require('mongoose');
const mongoosePagiante = require('mongoose-paginate-v2');

const schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please enter the contact name'],
            minlength: [4, 'Bare minimum of 4 characters are required for the contact name'],
        },
        phone: Number,
        type: {
            type: String,
            enum: ['SUPPLIER', 'CUSTOMER'],
            required: [true, 'Please give it a type'],
        },
    },
    { timestamps: true }
);

schema.plugin(mongoosePagiante);
const Model = mongoose.model('Contact', schema);

module.exports = Model;
