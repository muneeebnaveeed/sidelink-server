const mongoose = require("mongoose");
const mongoosePagiante = require("mongoose-paginate-v2");

const schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please enter the contact name"],
            minlength: [4, "Bare minimum of 4 characters are required for the customer name"],
        },
        phone: String,
    },
    { timestamps: true }
);

schema.plugin(mongoosePagiante);
const Model = mongoose.model("Customer", schema);

module.exports = Model;
