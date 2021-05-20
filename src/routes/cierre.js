const router = require('express').Router();

const filesController = require('../controllers/filesController');

const {  isAuthenticated, isCierre } = require('../middlewares/loginMiddleware');

//Upload files routes
router.post('/getFiles', filesController.getFiles);
router.post('/upload/:folder1?/:folder2?/:folder3?/:folder4?/:folder5?', filesController.uploadFiles);

router.get('/cierre',[isAuthenticated, isCierre],(req, res)=>{

    const data = {
        user: req.user,
        title: 'Cierre'
    }
    res.render('pages/cierre',{
        data
    })
})


module.exports = router;