const path = require('path');
const Client = require('ftp');
const fs = require('fs');

const viewPdf = (req, res) => {

    let pdf = req.params.id;
    let c = new Client();
    c.connect({
        host: 'tuvansa-server.dyndns.org',
        secure: false,
        user: 'Administrador',
        password: '912522Pop'
    })

    c.on('ready', function () {

        if (fs.existsSync(path.join(__dirname, `../public/uploads/${pdf}`))) {

            return res.json({
                ok: true,
                message: 'Ya esta cargado'
            })
        }

        c.get(`/certificados/${pdf}`, function (err, stream) {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                })
            }
            stream.once('close', function () { c.end(); });
            stream.pipe(fs.createWriteStream(path.join(__dirname, `../public/uploads/${pdf}`)));
            stream.on('end', function () {
                res.json({
                    ok: true,
                    message: 'No estaba cargado'
                })
            })

        })

    })






}

module.exports = viewPdf;