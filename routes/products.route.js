const router = require('express').Router();

const { getAll, addOne, remove, edit } = require('../controllers/products.controller');
const autoParams = require('../utils/autoParams');

router.get('/', autoParams, getAll);
router.post('/', addOne);
router.patch('/id/:id', edit);
router.delete('/id/:id', remove);

module.exports = router;
