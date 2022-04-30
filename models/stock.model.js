const mongoose = require("mongoose");
const mongoosePagiante = require("mongoose-paginate-v2");

const schema = new mongoose.Schema(
    {
        productVariant: {
            type: mongoose.Types.ObjectId,
            required: [true, "Please select a product"],
            ref: "ProductVariant",
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [0, "Quantity can never be negative"],
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
const Model = mongoose.model("Stock", schema);

module.exports = Model;
