const mongoose = require("mongoose");
const mongoosePagiante = require("mongoose-paginate-v2");

const schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please enter variant name"],
        },
        sku: {
            type: String,
            required: [true, "Please enter variant SKU"],
        },
        price: {
            type: Number,
            required: [true, "Please enter product price"],
            min: [1, "Product price must be greater than 0"],
        },
        product: {
            required: [true, "Product is required"],
            type: mongoose.Types.ObjectId,
            ref: "Product",
        },
        index: { type: Number, required: [true, "Product variant index is required"] },
        isDeleted: {
            type: Boolean,
            default: false,
            select: false,
        },
    },
    { timestamps: true }
);

schema.plugin(mongoosePagiante);
const Model = mongoose.model("ProductVariant", schema);

module.exports = Model;
