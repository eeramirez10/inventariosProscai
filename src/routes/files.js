const router = require('express').Router();

const filesController = require('../controllers/filesController');

//Upload files routes
router.post('/getFiles', filesController.getFiles);
router.post('/upload/:folder1?/:folder2?/:folder3?/:folder4?/:folder5?', filesController.uploadFiles);

module.exports = router;