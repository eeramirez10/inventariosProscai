const express = require('express');
const router = express.Router();

const {  isAuthenticated, isCertificado, isAdmin} = require('../middlewares/loginMiddleware');

let { actualizar, usuarios, usuarioNuevo } = require('../controllers/usuarioController');

router.get('/usuarios',[isAuthenticated,isAdmin], (req, res) => {

    const data = {
        user: req.user,
        title: 'Usuarios'
    }

    res.render('pages/usuarios',{data})
   
})

router.get('/usuariosTable', usuarios );


router.post('/usuarios', actualizar);

router.post('/usuarioNuevo', usuarioNuevo);






module.exports = router;