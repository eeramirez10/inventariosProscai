const router = require('express').Router();

const loginController = require('../controllers/loginController');

router.get('/',loginController.login);
router.post('/login', loginController.loginPost);

router.get('/logout', (req, res)=>{
    req.logout();
    res.redirect('/')
})


module.exports = router;