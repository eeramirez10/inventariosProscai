const router = require('express').Router();

const loginController = require('../controllers/loginController');

const { redirect }  = require('../helpers/rolRuta')

router.get('/', loginController.login);
router.post('/login', loginController.loginPost, (req, res) => {
    
    let { area, rol } = req.user;


    console.log(redirect[rol])
    res.redirect('/certificados');


});

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/')
})


module.exports = router;