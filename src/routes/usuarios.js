const express = require('express');
const router = express.Router();

const {  isAuthenticated } = require('../middlewares/loginMiddleware');

let { getUpdateUsuarios } = require('../controllers/usuarioController');

router.get('/usuarios',isAuthenticated, (req, res) => {

    const data = {
        user: req.user,
        title: 'Usuarios'
    }

    res.render('pages/usuarios',{data})
   
})


router.post('/usuarios', getUpdateUsuarios);






module.exports = router;