const controller = {};

const Client = require('ftp');
const path = require('path');
const multer = require('multer');
const FTPStorage = require('multer-ftp');

const storage = multer.diskStorage({
    destination: path.join(__dirname, 'public/uploads'),
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

const upload = multer({
    storage: new FTPStorage({
        basepath: '/uploads',
        destination: (req, file, options, cb) => {
            const sucursal = req.user.sucursal;
            let usuario = req.user;
            
            let folders = req.params;
            let foldersItera = ``
            for (let folder in folders) {

                if (folders[folder] !== undefined) {
                    foldersItera += `/${folders[folder]}`
                }
            }

            let ruta = usuario.user === "jortiz" ? `${options.basepath}${foldersItera}` : `${options.basepath}/${sucursal}${foldersItera}`;
            // aqui pone la ruta con el nombre del archivo en el callback
            cb(null, path.join(ruta, file.originalname))

        },
        ftp: {
            host: 'tuvansa-server.dyndns.org',
            secure: false,
            user: 'Administrador',
            password: 'Ag7348pp**'
        }
    }),


}).array('archivos')

let uploadFile = (req, res) => {

    return new Promise((resolve, reject) => {
        upload(req, res, function (err) {

            if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading.
                return reject({
                    ok: false,
                    status: 500,
                    mesagge: err.code
                })
            }
            return resolve({
                ok: true,
                status: 200,
                message: 'Subido'
            })
        })
    })

}



controller.getFiles = (req, res) => {

    let ruta = req.body.path !== undefined || req.body.path !== '' ? req.body.path : '';

    let c = new Client();

    
    let sucursal = req.user.sucursal;
    let usuario = req.user;
 

    c.connect({
        host: 'tuvansa-server.dyndns.org',
        secure: false,
        user: 'Administrador',
        password: 'Ag7348pp**'
    })

    let path = usuario.user === "jortiz" ?  `/uploads${ruta}`: `/uploads/${sucursal}${ruta}`;

    c.on('ready', function () {
        c.list(path, function (err, list) {

            if (err) throw err;

            res.json({ data: list })

            c.end()
        })
    })
}

controller.uploadFiles = (req, res) => {


    uploadFile(req, res)
        .then(file => {
            if(req.files.length === 0){
                res.status(404).json({ message: 'No se subio ningun archivo'}) 
            }
            res.status(file.status).json(file.message)

        })
        .catch(fileError => res.status(fileError.status).json(fileError.mesagge))


}



module.exports = controller;