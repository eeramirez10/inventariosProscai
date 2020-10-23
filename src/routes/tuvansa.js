const router = require('express').Router();

//Controllers
const tuvansaController = require('../controllers/tuvansaController');
const loginController = require('../controllers/loginController');


router.get('/',loginController.login);
router.get('/server', tuvansaController.cargaDataTable );
router.post('/data', tuvansaController.inserta);

router.post('/login', loginController.loginPost);


router.get('/inventarios',(req, res, next)=>{
    console.log(req.isAuthenticated())

    if (req.isAuthenticated()){
        return next();
    }

    res.redirect('/');

},

(req, res) => {

    
    const user = req.user;
    res.render('index', { user })
})


router.get('/logout', (req, res)=>{
    req.logout();
    res.redirect('/')
})



module.exports = router;