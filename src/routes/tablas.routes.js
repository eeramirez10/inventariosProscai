const express = require('express');

const router = express.Router();

let {dataTableOrdenes, productosEntradas } = require('../controllers/tabla')

router.get('/table', dataTableOrdenes )

router.get('/tableProductosEntradas', productosEntradas)

module.exports = router;