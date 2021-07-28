const controller = {}

const multer = require('multer');
const FTPStorage = require('multer-ftp');
const path = require('path');
const Client = require('ftp');
const fs = require('fs');

const queryProscai = require('../connection/proscaiConnection');

const query = require('../connection/tuvansaConnection');

let { table } = require('../helpers/tableServerPro')


const upload = multer({
    fileFilter: function (req, file, cb) {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Archivo no permitido'))
        }
        cb(null, true)
    },

    storage: new FTPStorage({

        basepath: '/certificados',
        destination: (req, file, options, cb) => {


            cb(null, path.join(options.basepath, file.originalname))


        },

        ftp: {
            host: 'tuvansa-server.dyndns.org',
            secure: false,
            user: 'Administrador',
            password: '912522Pop'
        }
    }),



}).single('certificado')





let sTable = 'producto_coladas as pc';

var aColumns = [
    "pc.idProductoColadas as ID",
    'DATE_FORMAT(pc.fecha,"%Y-%m-%d") as Alta',
    "prod.codigo as Codigo",
    "prod.iean as EAN",
    "prod.descripcion as Descripcion",
    "col.colada as Colada",
    'DATE_FORMAT(doc.fecha,"%Y-%m-%d") as Fecha',
    "cer.descripcion as Certificado",
    "doc.entrada as Entrada",
    "doc.orden as Orden",
    "prov.nombre as Proveedor",
];

const sjoin = `
    inner join producto as prod on prod.idProducto = pc.idProducto
    inner join coladas as col on col.idColada = pc.idColada
    inner join certificados as cer on cer.idCertificado = col.idCertificado
    inner join productos_documentos as po on po.idProducto = prod.idProducto
    inner join documentos as doc on doc.idDocumento = po.idDocumento
    inner join proveedores as prov on prov.idProveedor = doc.idProveedor
`;








controller.pdf = (req, res) => {

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

controller.certificadosQuery = async (req, res) => {

    let resp = await table(sTable, aColumns, sjoin, '', 'Tuvansa', req);

    res.status(200).send(resp)

}

controller.uploadData = (req, res) => {


    upload(req, res, async function (err) {

        if (err) {

            return res.status(500).json({
                ok: false,
                status: 500,
                message: err.message
            })
        }

        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.

            return res.status(500).json({
                ok: false,
                status: 500,
                message: err.code
            })

        }
        let certificado = req.file;
        let { coladas } = req.body;

        let data = JSON.parse(req.body.data);

        for (let colada of coladas) {
            if (colada === '') {
                return res.status(400).json({
                    ok: false,
                    message: 'Las coladas son necesarias'
                })
            }
        }


        let { status, resp } = await asincrinos(certificado, coladas, data)

        res.status(status).json({
            ...resp
        })



    })

}



async function asincrinos(certificado, coladas, data, res) {

    const {
        DMULTICIA,
        PRVCOD,
        PRVNOM,
        PRVRFC,
        DNUM,
        DFECHA, DREFERELLOS, DREFER,
        ICOD,
        IUM,
        IEAN,
        I2DESCR,
        AICANTF,

    } = data;

    const { fieldname, originalname, encoding, mimetype, path } = certificado;

    try {

        let idProveedor = PRVCOD === null
            ? 4499
            : await query('SELECT idProveedor From proveedores where codigo = ?', [PRVCOD])
                .then(resp => resp[0].idProveedor);


        const documentosTable = await query(`
        INSERT INTO documentos (entrada , fecha, factura ,  idProveedor , orden)
        SELECT * FROM (SELECT '${DNUM}','${DFECHA}','${DREFERELLOS}', ${idProveedor},'${DREFER}') AS tmp
        WHERE NOT EXISTS (SELECT entrada FROM documentos WHERE entrada = '${DNUM}' ) 
    `)

        const { insertId } = documentosTable;

        let idDocumento = (insertId === 0)
            ?
            await query(`SELECT idDocumento FROM documentos WHERE entrada = '${DNUM}'`)
                .then(resp => resp[0].idDocumento)
            : insertId;

        console.log('idDocumento', idDocumento)

        const productosTable = await query(`
    INSERT INTO producto (codigo , descripcion, cantidad ,  unidad , iean)
    SELECT * FROM (SELECT '${ICOD}','${I2DESCR}',${AICANTF}, '${IUM}','${IEAN}') AS tmp
    WHERE NOT EXISTS (SELECT idProducto FROM producto WHERE codigo = '${ICOD}' ) 
    `)

        let idProducto = productosTable.insertId === 0
            ?
            await query(`SELECT idProducto FROM producto WHERE codigo = '${ICOD}'`)
                .then(resp => resp[0].idProducto)
            : productosTable.insertId

        console.log('idProducto', idProducto)


        const productoDocumentos = await query(`
        INSERT INTO productos_documentos (idProducto, idDocumento)
        SELECT * FROM (SELECT ${idProducto},${idDocumento}) AS tmp
        WHERE NOT EXISTS ( SELECT * from productos_documentos 
        WHERE idProducto = ${idProducto} AND IdDocumento = ${idDocumento})
        
        `
        );


        const certificadosTable = await query(`
    INSERT INTO certificados (descripcion , destino, ruta )
    SELECT * FROM (SELECT '${originalname}','${certificado.destination}','${path}') AS tmp
    WHERE NOT EXISTS (SELECT idCertificado FROM certificados WHERE descripcion = '${originalname}' ) 
    `);


        let idCertificado =
            (certificadosTable.insertId === 0)
                ?
                await query(`SELECT idCertificado FROM certificados WHERE descripcion = '${originalname}'`)
                    .then(resp => resp[0].idCertificado)
                :
                certificadosTable.insertId;

        console.log('idCertificado', idCertificado)


        for (let colada of coladas) {

            try {

                const isInColadas = await query('SELECT idColada from coladas where colada = ?  limit 1', [colada])


                if (isInColadas.length > 0) {
                    return {
                        status: 400,
                        resp: {
                            ok: false,
                            message: `La colada =  ${colada}    ya existe y debe de ser unica`
                        }

                    }
                }


                const coladasTable = await query(`
                    INSERT INTO coladas  (colada,idCertificado)
                    SELECT * FROM ( SELECT '${colada}', ${idCertificado}) as tmp
                    WHERE NOT EXISTS (SELECT idColada FROM coladas WHERE colada = '${colada}' ) `
                );

                console.log(coladasTable)


                let idColada =
                    (coladasTable.insertId === 0)
                        ? await query(`SELECT idColada FROM coladas WHERE colada = '${colada}'`)
                            .then(resp => resp[0].idColada)
                        : coladasTable.insertId





                const productoColadasTable = await query(`
                    INSERT INTO producto_coladas (idProducto, idColada) 
                    SELECT * FROM (SELECT ${idProducto}, ${idColada}) as tmp
                    WHERE NOT EXISTS (SELECT idColada, idProducto FROM producto_coladas WHERE idProducto = ${idProducto} AND idColada = ${idColada} ) 
                `);


            } catch (error) {
                console.log(error);
                return {
                    status: 500,
                    resp: {
                        ok: false,
                        message: 'Revisar logs'
                    }
                }

            }


        }

        return {
            status: 200,
            resp: {
                ok: true,
                message: 'Agregado Correctamente'
            }

        }


    } catch (error) {

        console.log(error)

        return {
            status: 500,
            resp: {
                ok: false,
                message: 'Revisar logs'
            }

        }

    }
}

controller.getTables = async (req, res) => {

    let { table } = req.params;
    let { body } = req


    const { status, payload } = await asyncTables(table, body)

    res.status(status).json({ 
        ...payload
    })


}


async function asyncTables(tabla, body) {


    try {

        if (tabla === "productos") {


            let { codigo } = body;
    
            let productos = await queryProscai(`
            SELECT  DMULTICIA,PRVCOD,PRVNOM,PRVRFC,DNUM,DATE_FORMAT(DFECHA,"%Y-%m-%d") as DFECHA,DREFERELLOS,DREFER, ICOD,IUM,IEAN,I2DESCR,AICANT as AICANTF FROM FAXINV
            LEFT JOIN FDOC ON FDOC.DSEQ=FAXINV.DSEQ
            LEFT JOIN FINV ON FINV.ISEQ=FAXINV.ISEQ
            LEFT JOIN FINV2 ON FINV2.I2KEY=FINV.ISEQ
            LEFT JOIN FPRV ON FPRV.PRVSEQ=FDOC.PRVSEQ
            WHERE DNUM='${codigo}' 
            ORDER BY DNUM,AISEQ`);
    
    
            let productosDBTuvansa = await query(`
                SELECT prod.codigo FROM producto_coladas as pc
                INNER JOIN producto as prod on prod.idProducto = pc.idProducto
                INNER JOIN productos_documentos as po on po.idProducto = prod.idProducto
                INNER JOIN documentos as doc on doc.idDocumento = po.idDocumento
                WHERE doc.entrada = '${codigo}'
            `);
    
    
    
            if (productosDBTuvansa.length > 0) {
    
                productosDBTuvansa.forEach(
                    ({ codigo }) => 
                    productos = productos.filter(producto => producto.ICOD !== codigo)
                )
    
            }
    
    
            return ({
                status: 200,
                payload:{
                    ok: true,
                    data: productos
                }
               
            })
        }
        
    } catch (error) {

        console.log(error)

        return ({
            status: 500,
            payload:{
                ok: false,
                message: 'Revisar Logs'
            }
  
        })
        
    }

}









module.exports = controller;