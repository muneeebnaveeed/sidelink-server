const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const Database = require("./utils/db");
const AppError = require("./utils/AppError");

const { errorController } = require("./controllers/errors.controller");

const app = express();

dotenv.config({ path: `.${process.env.NODE_ENV}.env` });

const port = process.env.PORT || 5500;

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);

    new Database()
        .connect()
        .then(() => console.log("Connected to DB"))
        .catch((err) => console.log(err.message));

    app.use(express.json());

    app.use(cors());

    app.get("/", (req, res) => {
        res.status(200).send(`Server running at PORT ${port}`);
    });

    app.use("/products", require("./routes/products.route"));
    app.use("/product_variants", require("./routes/productVariants.route"));

    app.use("/suppliers", require("./routes/suppliers.route"));
    app.use("/customers", require("./routes/customers.route"));

    app.use("/stock", require("./routes/stock.route"));

    app.use("/purchases", require("./routes/purchases.route"));
    app.use("/sales", require("./routes/sales.route"));
    app.use("/transactions", require("./routes/transactions.route"));

    app.use("*", (req, res, next) => next(new AppError(`Cannot find ${req.originalUrl} on the server!`, 404)));

    app.use(errorController);
});
