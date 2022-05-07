const mongoose = require("mongoose");
const mongoosePagiante = require("mongoose-paginate-v2");

const schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please enter the employee name"],
            minlength: [4, "Bare minimum of 4 characters are required for the employee name"],
        },
        phone: String,
        salary: {
            type: Number,
            required: [true, "Please input salary"],
        },
        isDeleted: {
            type: Boolean,
            default: false,
            select: false,
        },
    },
    { timestamps: true }
);

schema.plugin(mongoosePagiante);

const Model = mongoose.model("Employee", schema);

module.exports = Model;
