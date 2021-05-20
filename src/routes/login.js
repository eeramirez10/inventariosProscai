const router = require('express').Router();

const loginController = require('../controllers/loginController');

const { redirect }  = require('../helpers/rolRuta')

router.get('/', loginController.login);
router.post('/login', loginController.loginPost, (req, res) => {
    let { area, rol } = req.user;

    res.redirect(redirect[rol]);


});

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/')
})


module.exports = router;