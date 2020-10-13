const router = require('express').Router();

//Controllers
const tuvansaController = require('../controllers/tuvansaController');

router.get('/',(req, res) => {
    res.render('index')
})


router.get('/server', tuvansaController.cargaDataTable );
router.post('/data', tuvansaController.inserta);



module.exports = router;