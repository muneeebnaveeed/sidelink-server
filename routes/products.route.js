const router = require('express').Router();

const { getAll, addOne, remove } = require('../controllers/products.controller');
const autoParams = require('../utils/autoParams');

router.get('/', autoParams, getAll);
router.post('/', addOne);
router.delete('/', remove);

module.exports = router;
