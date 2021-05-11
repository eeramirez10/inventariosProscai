const express = require('express')
const router = express.Router();

const { certificadosQuery, getTables, uploadData, upload, pdf } = require('../controllers/certificadosController')

const {  isAuthenticated, isCertificado } = require('../middlewares/loginMiddleware');

router.get('/certificadosTable',certificadosQuery);

router.post('/certificadosData/:table',getTables );

router.post('/certificadosUpload', uploadData);

router.get('/pdf/:id',pdf)

router.get('/certificados',[isAuthenticated, isCertificado], (req, res)=>{
    const data = {
        user: req.user,
        title: 'Certificados'
    }

    console.log(data)
    res.render('pages/certificados',{data})
})



module.exports = router;