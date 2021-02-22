const express = require('express')
const router = express.Router();

//Controllers
const tuvansaController = require('../controllers/tuvansaController');

//Middlewares
const {  isAuthenticated } = require('../middlewares/loginMiddleware');


router.get('/server', tuvansaController.cargaDataTable );
router.post('/data', tuvansaController.inserta);



//Power Bi

router.get('/estadisticas',isAuthenticated, (req, res)=>{

    const data = {
        user: req.user,
        title: 'Estadisticas'
    }

    res.render('pages/estadisticas', {data});
})


router.get('/inventarios',isAuthenticated,(req, res) => {
    const data = {
        user: req.user,
        title: 'Inventarios'
    }
    res.render('pages/inventarios', { data })
})











module.exports = router;