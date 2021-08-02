const express = require('express')
const router = express.Router();

const { certificadosQuery, getTables, uploadData } = require('../controllers/certificadosController');
const viewPdf = require('../controllers/viewPdf');

const {  isAuthenticated, isCertificado, isAlmacenista, isAdmin } = require('../middlewares/loginMiddleware');

router.get('/certificadosTable',certificadosQuery);

router.post('/certificadosData/:table',getTables );

router.post('/certificadosUpload', uploadData);

router.get('/pdf/:id',viewPdf);

router.get('/certificados',[isAuthenticated, isCertificado], (req, res)=>{
    const data = {
        user: req.user,
        title: 'Certificados'
    }

    res.render('pages/certificados',{data})
})



module.exports = router;