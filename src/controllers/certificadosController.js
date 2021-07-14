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
        let coladas = req.body.coladas;
        let data = JSON.parse(req.body.data);

        for (let colada of coladas) {
            if (colada === '') {
                return res.status(400).json({
                    ok: false,
                    message: 'Las coladas son necesarias'
                })
            }
        }

        await asincrinos(certificado, coladas, data, res).catch((err) => {
            console.log(err)
            res.status(500).json({
                ok: false,
                err: 'error'
            })
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
        DFECHA,
        DREFERELLOS,
        DREFER,
        ICOD,
        IUM,
        IEAN,
        I2DESCR,
        AICANTF,

    } = data;

    const {
        fieldname,
        originalname,
        encoding,
        mimetype,
        path
    } = certificado;

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

        coladas.forEach(async (colada) => {

            const coladasTable = await query(`
            INSERT INTO coladas  (colada,idCertificado)
            SELECT * FROM ( SELECT '${colada}', ${idCertificado}) as tmp
            WHERE NOT EXISTS (SELECT idColada FROM coladas WHERE colada = '${colada}' ) 
            
            `
            );

            const { insertId: idColada } = coladasTable;

            const productoColadasTable = await query('INSERT INTO producto_coladas SET IdProducto = ?, idColada= ?', [idProducto, idColada]);


        })



        res.json({
            ok: true,
            message: 'Agregado Correctamente'
        })


    } catch (error) {

        console.log(error)

        res.status(500).json({
            ok: false,
            message: 'Revisar logs'
        })
    }
}

controller.getTables = async (req, res) => {

    let tabla = req.params.table;
    let body = req.body;



    asyncTables(tabla, body, res)
        .catch(err => {
            console.log(err)
        })



}


async function asyncTables(tabla, body, res) {

    let dataArray = [];

    if (tabla === 'extra') {
        let entrada = body.codigo

        let productosDBTuvansa = await query(`
        
        select doc.entrada, doc.orden, prod.codigo, prod.descripcion, prod.cantidad, prod.unidad from productos_documentos as po
        inner join documentos as doc on doc.idDocumento = po.idDocumento
        inner join producto as prod on prod.idProducto = po.idProducto
        where doc.entrada = '${entrada}'
    
    `);

        console.log(entrada)

        return res.json({
            ok: true,
            productosDBTuvansa
        })
    }

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
            SELECT pc.idProductoColadas ,prod.codigo,prod.descripcion,doc.entrada,doc.orden,prov.nombre FROM producto_coladas as pc
            INNER JOIN producto as prod on prod.idProducto = pc.idProducto
            INNER JOIN coladas as col on col.idColada = pc.idColada
            INNER JOIN certificados as cer on cer.idCertificado = col.idCertificado
            INNER JOIN productos_documentos as po on po.idProducto = prod.idProducto
            INNER JOIN documentos as doc on doc.idDocumento = po.idDocumento
            INNER JOIN proveedores as prov on prov.idProveedor = doc.idProveedor
            WHERE doc.entrada = '${codigo}'
        `);

        //console.log(productosDBTuvansa)

        if (productosDBTuvansa.length > 0) {

            for (let productoDB of productosDBTuvansa) {

                for (let [i, prod] of productos.entries()) {

                    if (productoDB.codigo == prod.ICOD) {


                        productos.splice(i, 1)

                    }
                }
            }
        }


        return res.json({
            ok: true,
            data: productos
        })
    }

    if (tabla === 'proveedores') {

        let proveedores = await queryProscai('SELECT PRVCOD,PRVNOM,PRVRFC FROM FPRV WHERE MID(PRVCOD,1,1)="3"');




        for (let proveedor of proveedores) {
            let proveedorArray = []
            proveedorArray.push(proveedor.PRVCOD, proveedor.PRVNOM, proveedor.PRVRFC)
            dataArray.push(proveedorArray);
        }

        let columns = [
            { title: "Codigo" },
            { title: "Nombre" },
            { title: "RFC" },
        ]

        return res.json({
            ok: true,
            data: dataArray,
            columns
        })


    }



    if (tabla === 'ordenes') {

        let codigoProveedor = body.codigo



        let ordenes = await queryProscai(`SELECT PRVCOD,PRVNOM,PRVRFC,DNUM,DATE_FORMAT(DFECHA,"%Y-%m-%d") as DFECHA,DREFERELLOS,DREFER FROM FDOC
            LEFT JOIN FPRV ON FPRV.PRVSEQ=FDOC.PRVSEQ
            WHERE PRVCOD='${codigoProveedor}' AND MID(PRVCOD,1,1)='3'  AND DESFACT=2 AND MID(DNUM,1,2)='RA'
            ORDER BY DFECHA,DNUM`);



        let columns = [
            { title: "RFC" },
            { title: "Entrada" },
            { title: "Fecha" },
            { title: "Factura" },
            { title: "Orden" },

        ]


        for (let orden of ordenes) {
            let ordenArray = [];


            ordenArray.push(orden.PRVRFC, orden.DNUM, orden.DFECHA, orden.DREFERELLOS, orden.DREFER);

            dataArray.push(ordenArray);
        }

        return res.json({
            ok: true,
            data: dataArray,
            columns
        })


    }



    res.status(400).json({
        ok: false,
        message: 'Se necesita un parametro'
    })
}









module.exports = controller;