const controller = {}

const multer = require('multer');
const FTPStorage = require('multer-ftp');
const path = require('path');
const Client = require('ftp');
const fs = require('fs');

const queryProscai = require('../connection/proscaiConnection');

const query = require('../connection/tuvansaConnection');

/* let storage = multer.diskStorage({
    destination: path.join(__dirname, '../public/uploads'),
    filename: (req, file, cb) => {
        
        cb(null, file.originalname)
    }

}) */

/* controller.upload = multer({
    storage: storage
}) */

/* const upload = multer({
    fileFilter: function (req, file, cb) {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Archivo no permitido'))
        }
        cb(null, true)
    },
    storage: storage

}).single('certificado'); */


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
            password: 'Ag7348pp**'
        }
    }),



}).single('certificado')




let sIndexColumn = '*';
let sTable = 'producto_coladas';
var request = {};
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








controller.pdf = (req, res) => {

    let pdf = req.params.id;
    let c = new Client();
    c.connect({
        host: 'tuvansa-server.dyndns.org',
        secure: false,
        user: 'Administrador',
        password: 'Ag7348pp**'
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

    console.log('GET request to /Certificados');
    request = req.query;
    server(res);

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
            res.status(500).json({
                ok: false,
                err: 'error'
            })
        })


    })

}



async function asincrinos(certificado, coladas, data, res) {

    console.log(data)
    console.log(coladas)

    let insertarDB = [];

    let proveedoresDB = await query(`Select * from proveedores where codigo = ?`, data.PRVCOD);



    // Si no existe el proveedor en nuestra base de datos
    if (proveedoresDB.length === 0) {
        await query(`INSERT INTO proveedores SET codigo = ?, nombre = ?, rfc = ?`, [data.PRVCOD, data.PRVNOM, data.PRVRFC])
        proveedoresDB = await query(`Select idProveedor from proveedores where codigo = ?`, data.PRVCOD)
    }




    let documentosDB = await query(`Select * from documentos  where entrada = ?`, data.DNUM)



    if (documentosDB.length === 0) {

        await query(`INSERT INTO documentos SET entrada = ?, fecha = ?, factura = ?,  idProveedor = ?, orden = ?`,
            [data.DNUM, data.DFECHA, data.DREFERELLOS, proveedoresDB[0].idProveedor, data.DREFER])

        documentosDB = await query(`Select * from documentos  where entrada = ?`, data.DNUM)
    }


    let productosDB = await query(`Select * from producto  where codigo = ?`, [data.ICOD]);

    if (productosDB.length === 0) {
        await query('INSERT INTO producto SET codigo = ?, descripcion = ?, cantidad = ?, unidad = ?, iean = ?', [data.ICOD, data.I2DESCR, data.AICANTF, data.IUM, data.IEAN])
        productosDB = await query(`Select * from producto  where codigo = ?`, [data.ICOD]);
    }




    let productosOrdenesDB = await query(`
        SELECT p.codigo, p.descripcion, p.cantidad, p.unidad, doc.orden, doc.entrada
        FROM productos_documentos as po
        inner join producto as p on p.idProducto =  po.idProducto
        inner join documentos as doc on doc.idDocumento = po.idDocumento
        WHERE p.codigo = ? AND doc.idDocumento = ?
    `, [productosDB[0].codigo, documentosDB[0].idDocumento]);

    if (productosOrdenesDB.length === 0) {
        await query('INSERT INTO productos_documentos set idProducto = ?, idDocumento = ?', [productosDB[0].idProducto, documentosDB[0].idDocumento]);
    }



    let certificadosDB = await query('SELECT idCertificado, descripcion from certificados where descripcion = ?', [certificado.originalname]);


    // Si no existe el certificado en la base de datos Tuvansa
    if (certificadosDB.length === 0) {
        //Si no existe lo inserta
        await query('INSERT INTO certificados SET descripcion = ?, destino = ?, ruta = ?', [certificado.originalname, certificado.destination, certificado.path]);
        //Guardamos el Id ultimo del certificado
        certificadosDB = await query('SELECT idCertificado, descripcion from certificados where descripcion = ?', [certificado.originalname]);
    }

    //console.log(certificadosDB)

    console.log(certificadosDB[0].idCertificado)

    for (let colada of coladas) {




        await query('INSERT INTO coladas SET colada = ?, idCertificado = ?', [colada, certificadosDB[0].idCertificado])
        coladaDB = await query('SELECT * FROM coladas where colada = ? and idCertificado = ?', [colada, certificadosDB[0].idCertificado]);



        await query('INSERT INTO producto_coladas SET IdProducto = ?, idColada = ?', [productosDB[0].idProducto, coladaDB[0].idColada]);




    }






    res.json({
        ok: true,
        message: 'Agregado Correctamente'
    })
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

        let recepcion = body.codigo;

        let productos = await queryProscai(`
        SELECT  DMULTICIA,PRVCOD,PRVNOM,PRVRFC,DNUM,DATE_FORMAT(DFECHA,"%Y-%m-%d") as DFECHA,DREFERELLOS,DREFER, ICOD,IUM,IEAN,I2DESCR,AICANTF FROM FAXINV
        LEFT JOIN FDOC ON FDOC.DSEQ=FAXINV.DSEQ
        LEFT JOIN FINV ON FINV.ISEQ=FAXINV.ISEQ
        LEFT JOIN FINV2 ON FINV2.I2KEY=FINV.ISEQ
        LEFT JOIN FPRV ON FPRV.PRVSEQ=FDOC.PRVSEQ
        WHERE DNUM='${recepcion}' AND DESFACT=2 AND MID(PRVCOD,1,1)='3'  AND DESFACT=2 AND MID(DNUM,1,2)='RA'
        ORDER BY DNUM,AISEQ`);

        //console.log(productos)



        let productosDBTuvansa = await query(`
            SELECT pc.idProductoColadas ,prod.codigo,prod.descripcion,doc.entrada,doc.orden,prov.nombre FROM producto_coladas as pc
            INNER JOIN producto as prod on prod.idProducto = pc.idProducto
            INNER JOIN coladas as col on col.idColada = pc.idColada
            INNER JOIN certificados as cer on cer.idCertificado = col.idCertificado
            INNER JOIN productos_documentos as po on po.idProducto = prod.idProducto
            INNER JOIN documentos as doc on doc.idDocumento = po.idDocumento
            INNER JOIN proveedores as prov on prov.idProveedor = doc.idProveedor
            WHERE doc.entrada = '${recepcion}'
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

async function server(res) {
    //Paging
    var sLimit = "";
    if (request['length'] && request['length'] != -1) {
        sLimit = 'LIMIT ' + request['start'] + ', ' + request['length']
    }

    //Ordering
    var sOrder = "";

    if (request['order']) {

        sOrder = `ORDER BY ${aColumns[request['order'][0]['column']].split(" ")[0]} ${request['order']['0']['dir']}`;

        //console.log(`ORDER BY ${aColumns[request['order'][0]['column']] } ${request['order']['0']['dir']}`)
    }
    //Filtering
    var sWhere = "";
    if (request['search']['value'] && request['search']['value'] != "") {

        let busqueda = request['search']['value'].toUpperCase();
        sWhere = "WHERE (";
        for (var i = 0; i < aColumns.length; i++) {
            sWhere += aColumns[i].split(" ")[0] + " LIKE " + "\'%" + busqueda + "%\'" + " OR ";
        }

        sWhere = sWhere.substring(0, sWhere.length - 4);
        sWhere += ')';
    }



    //Queries
    //var sQuery = "SELECT SQL_CALC_FOUND_ROWS " +aColumns.join(',')+ " FROM " +sTable+" "+sWhere+" "+sOrder+" "+sLimit +" limit 10";


    var sQuery = `
        SELECT SQL_CALC_FOUND_ROWS  ${aColumns.join(',')} 
        FROM ${sTable} as pc
        inner join producto as prod on prod.idProducto = pc.idProducto
        inner join coladas as col on col.idColada = pc.idColada
        inner join certificados as cer on cer.idCertificado = col.idCertificado
        inner join productos_documentos as po on po.idProducto = prod.idProducto
        inner join documentos as doc on doc.idDocumento = po.idDocumento
        inner join proveedores as prov on prov.idProveedor = doc.idProveedor
        
        ${sWhere} 
       
        ${sOrder} 
        ${sLimit} 

        
        `;


    //console.log(sQuery)



    var rResult = {};
    var rResultFilterTotal = {};
    var aResultFilterTotal = {};
    var iFilteredTotal = {};
    var iTotal = {};
    var rResultTotal = {};
    var aResultTotal = {};



    let results = await query(sQuery)
        .catch(err => {
            console.log(err)
        })

    if (!results) {
        return;
    }

    rResult = results;

    //Data set length after filtering 
    sQuery = "SELECT FOUND_ROWS()";

    results = await query(sQuery);

    rResultFilterTotal = results;
    aResultFilterTotal = rResultFilterTotal;
    iFilteredTotal = aResultFilterTotal[0]['FOUND_ROWS()'];

    //Total data set length 
    sQuery = "SELECT COUNT(" + sIndexColumn + ") FROM " + sTable;

    results = await query(sQuery);

    rResultTotal = results;
    aResultTotal = rResultTotal;
    iTotal = aResultTotal[0]['COUNT(*)'];

    //Output
    var output = {};
    var temp = [];

    output.sEcho = parseInt(request['sEcho']);
    output.iTotalRecords = iTotal;
    output.iTotalDisplayRecords = iFilteredTotal;
    output.aaData = [];

    var aRow = rResult;
    var row = [];

    for (var i in aRow) {
        for (Field in aRow[i]) {
            if (!aRow[i].hasOwnProperty(Field)) continue;
            temp.push(aRow[i][Field]);
        }
        output.aaData.push(temp);
        temp = [];
    }




    sendJSON(res, 200, output);







}

function sendJSON(res, httpCode, body) {
    var response = JSON.stringify(body);

    res.status(httpCode).send(response)

}





module.exports = controller;