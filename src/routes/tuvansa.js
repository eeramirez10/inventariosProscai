const express = require('express')


const router = express.Router();



//Controllers
const tuvansaController = require('../controllers/tuvansaController');

const { certificadosQuery, getTables, uploadData, upload, pdf } = require('../controllers/certificadosController')

//Middlewares
const {  isAuthenticated } = require('../middlewares/loginMiddleware');


router.get('/server', tuvansaController.cargaDataTable );
router.post('/data', tuvansaController.inserta);

//Certificados
router.get('/certificadosTable',certificadosQuery);

router.post('/certificadosData/:table',getTables );

router.post('/certificadosUpload', uploadData);

router.get('/pdf',pdf)



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



router.get('/cierre',isAuthenticated,(req, res)=>{

    const data = {
        user: req.user,
        title: 'Cierre'
    }
    res.render('pages/cierre',{
        data
    })
})

router.get('/certificados',isAuthenticated, (req, res)=>{
    const data = {
        user: req.user,
        title: 'Cierre'
    }
    res.render('pages/certificados',{data})
})






module.exports = router;