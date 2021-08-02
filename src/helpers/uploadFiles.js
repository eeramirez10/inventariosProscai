const multer = require('multer');

const FTPStorage = require('multer-ftp');

const path = require('path');

const storageOptions = multer({
    fileFilter: (req, file, cb) =>
        (file.mimetype !== 'application/pdf')
            ? cb(new Error('Archivo no permitido'))
            : cb(null, true)
    ,

    storage: new FTPStorage({

        basepath: '/certificados',
        destination: (req, file, options, cb) => cb(null, path.join(options.basepath, file.originalname))
        ,

        ftp: {
            host: 'tuvansa-server.dyndns.org',
            secure: false,
            user: 'Administrador',
            password: '912522Pop'
        }
    }),



}).array('certificados');

module.exports = storageOptions;