const mongoose = require("mongoose");
const mongoosePagiante = require("mongoose-paginate-v2");

const schema = new mongoose.Schema(
    {
        supplier: {
            type: mongoose.Types.ObjectId,
            ref: "Supplier",
            required: [true, "Please select a supplier"],
        },
        paid: {
            type: Number,
            min: [0, "Paid amount can not be less than zero"],
            required: [true, "Please enter paid amount"],
        },
        discount: {
            type: Number,
            min: [0, "Discount can not be less than zero"],
            required: [true, "Please enter discount"],
        },
        subtotal: {
            type: Number,
            required: [true, "Please enter subtotal"],
        },
        total: {
            type: Number,
            required: [true, "Please enter total"],
        },
        products: {
            type: [
                {
                    productVariant: {
                        type: mongoose.Types.ObjectId,
                        required: [true, "Please select a product"],
                        ref: "ProductVariant",
                    },
                    quantity: {
                        type: Number,
                        required: [true, "Please enter product quantity"],
                        min: [1, "Quantity can not be less than one"],
                    },
                    total: {
                        type: Number,
                        required: [true, "Please enter product total"],
                    },
                },
            ],
            required: [true, "Please select products to make purchase"],
        },
        isFullyPaid: {
            type: Boolean,
            required: true,
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
const Model = mongoose.model("Purchase", schema);

module.exports = Model;
