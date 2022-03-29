const router = require('express').Router();

const { getAll, addOne, remove, edit } = require('../controllers/contacts.controller');
const autoParams = require('../utils/autoParams');

router.get('/', autoParams, getAll);
router.post('/', addOne);
router.patch('/id/:id', edit);
router.delete('/', remove);

module.exports = router;
