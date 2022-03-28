const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

const Database = require('./utils/db');
const AppError = require('./utils/AppError');

const productsRoute = require('./routes/products.route');

const { errorController } = require('./controllers/errors.controller');

const app = express();

dotenv.config();

const port = process.env.PORT || 5500;

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);

    new Database()
        .connect()
        .then(() => console.log('Connected to DB'))
        .catch((err) => console.log(err.message));

    app.use(express.json());

    app.use(cors());

    app.get('/', (req, res) => {
        res.status(200).send(`Server running at PORT ${port}`);
    });

    app.use('/products', productsRoute);

    app.use('*', (req, res, next) => next(new AppError(`Cannot find ${req.originalUrl} on the server!`, 404)));

    app.use(errorController);
});
