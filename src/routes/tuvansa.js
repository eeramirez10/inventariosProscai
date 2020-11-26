const router = require('express').Router();

//Controllers
const tuvansaController = require('../controllers/tuvansaController');
const loginController = require('../controllers/loginController');
const filesController = require('../controllers/filesController');


router.get('/',loginController.login);
router.get('/server', tuvansaController.cargaDataTable );
router.post('/data', tuvansaController.inserta);

router.post('/login', loginController.loginPost);

const isAuthenticated = (req, res, next)=>{
   
    if (req.isAuthenticated()) return next();
    res.redirect('/');

}


router.get('/inventarios',isAuthenticated,(req, res) => {

    
    const data = {
        user: req.user,
        title: 'Inventarios'
    }
    res.render('pages/inventarios', { data })
})


router.get('/logout', (req, res)=>{
    req.logout();
    res.redirect('/')
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


//Upload files routes
router.post('/getFiles', filesController.getFiles);
router.post('/upload/:folder1?/:folder2?/:folder3?/:folder4?/:folder5?', filesController.uploadFiles)



module.exports = router;