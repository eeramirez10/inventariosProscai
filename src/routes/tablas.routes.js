const express = require('express');

const router = express.Router();

let {dataTableOrdenes } = require('../controllers/tabla')

router.get('/table', dataTableOrdenes )

module.exports = router;