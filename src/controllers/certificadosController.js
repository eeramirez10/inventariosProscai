const controller = {}





const util = require('util');

const queryProscai = require('../connection/proscaiConnection');

const query = require('../connection/tuvansaConnection');

let { table } = require('../helpers/tableServerPro')

const { getIdProveedor, getIdDocumento, getIdProducto, getIdProductoDocumentos, getIdCertificado, getIdColada, getIdProductoColadas, SetColada } = require('../helpers/helpersCertificados');

const storageOptions = require('../helpers/uploadFiles');







controller.certificadosQuery = async (req, res) => {


    const sTable = 'producto_coladas as pc';

    const aColumns = [
        "pd.idProductoDocumentos as ID",
        'DATE_FORMAT(pc.fecha,"%Y-%m-%d") as Alta',
        "doc.entrada as Entrada",
        "doc.orden as Orden",
        "prov.nombre as Proveedor",
        "GROUP_CONCAT( col.colada,' ' ) as coladas"
    ];

    const sjoin = `
        join coladas col on col.idColada = pc.idColada
        join productos_documentos pd on pd.idProductoDocumentos = pc.idProductoDocumentos
        join documentos doc on doc.idDocumento = pd.idDocumento
        join proveedores prov on prov.idProveedor = doc.idProveedor
        Group By doc.entrada
    `;


    let resp = await table(sTable, aColumns, sjoin, '', 'Tuvansa', req);

    res.status(200).send(resp)

}

controller.certificadosVentas = async (req, res) => {

    const sTable = 'producto_coladas as pc';

    const aColumns = [
        "pc.idProductoColadas as ID",
        'prod.codigo as Codigo',
        "prod.iean as EAN",
        "prod.descripcion as Descripcion",
        'DATE_FORMAT(doc.fecha,"%Y-%m-%d") as Fecha',
        "prod.cantidad as Cantidad",
        'col.colada as Colada',
        'cer.descripcion as Certificado'
    ];

    const sjoin = `
        join coladas col on col.idColada = pc.idColada
        join certificados cer on cer.idCertificado = pc.idCertificado
        join productos_documentos pd on pd.idProductoDocumentos = pc.idProductoDocumentos
        join producto prod on prod.idProducto = pd.idProducto
        join documentos doc on doc.idDocumento = pd.idDocumento
        join proveedores prov on prov.idProveedor = doc.idProveedor
    `;

    let resp = await table(sTable, aColumns, sjoin, '', 'Tuvansa', req);

    res.status(200).send(resp)

}

controller.uploadData = async (req, res) => {


    try {

        const upload = util.promisify(storageOptions)

        await upload(req, res);

        let certificados = req.files;
        let coladas = req.body.coladas;


        let certiCol = certificados.map((cer, index) =>
        ({
            colada: typeof coladas === 'string' ? coladas : coladas[index],
            certificado: cer
        })
        )

        let data = JSON.parse(req.body.data);

        for (let colada of coladas) {
            if (colada === '') {
                return res.status(400).json({
                    ok: false,
                    message: 'Las coladas son necesarias'
                })
            }
        }


        let { status, resp } = await asincrinos(certiCol, data)

        res.status(status).json({ ...resp })



    } catch (err) {

        console.log(err)
        return res.status(500).json({
            ok: false,
            status: 500,
            message: err.message
        })
    }



}



async function asincrinos(certiCol, data) {

    const { PRVCOD } = data;


    try {





        const idProveedor = await getIdProveedor(PRVCOD);


        const idDocumento = await getIdDocumento(idProveedor, data);


        const idProducto = await getIdProducto(data);

        const idProductoDocumentos = await getIdProductoDocumentos(idProducto, idDocumento);


        for (const { colada, certificado } of certiCol) {

            try {

                const idCertificado = await getIdCertificado(certificado);

                const idColada = await getIdColada(colada)

                const idProductoColadas = await getIdProductoColadas(idColada, idCertificado, idProductoDocumentos);



            } catch (error) {

                console.error(error)

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

        if (tabla === 'coladas') {

            let { codigo } = body;

            let coladas = await query(`select 

            pc.idProductoColadas as ID,
           
            prod.codigo as Codigo,
            prod.iean as EAN,
            prod.descripcion as Descripcion,
            col.colada as Colada,
            DATE_FORMAT(doc.fecha,"%Y-%m-%d") as Fecha,
            cer.descripcion as Certificado,
            prod.cantidad as Cantidad
        
            from producto_coladas pc
            join coladas col on col.idColada = pc.idColada
            join certificados cer on cer.idCertificado = pc.idCertificado
            join productos_documentos pd on pd.idProductoDocumentos = pc.idProductoDocumentos
            join producto prod on prod.idProducto = pd.idProducto
            join documentos doc on doc.idDocumento = pd.idDocumento
            join proveedores prov on prov.idProveedor = doc.idProveedor
            Where doc.entrada = '${codigo}'

        `)

            return ({
                status: 200,
                payload: {
                    ok: true,
                    data: coladas
                }

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
                SELECT p.codigo FROM producto_coladas as pc
                JOIN productos_documentos as pd on pd.idProductoDocumentos = pc.idProductoDocumentos
                JOIN producto as p on p.idProducto = pd.idProducto
                JOIN documentos d on d.idDocumento = pd.idDocumento
                WHERE d.entrada = '${codigo}'
            `);



            // if (productosDBTuvansa.length > 0) {

            //     productosDBTuvansa.forEach(({ codigo }) =>
            //         productos = productos.filter(({ ICOD }) => ICOD !== codigo)
            //     )

            // }


            return ({
                status: 200,
                payload: {
                    ok: true,
                    data: productos
                }

            })
        }

    } catch (error) {

        console.log(error)

        return ({
            status: 500,
            payload: {
                ok: false,
                message: 'Revisar Logs'
            }

        })

    }

}


controller.edit = async (req, res) => {

    try {
        const upload = util.promisify(storageOptions)

        await upload(req, res);


        const { id } = req.body



        if (req.files[0]) {

            const { originalname, path } = req.files[0];

            const updateCertificados = await query(`
            update certificados 
            inner join producto_coladas on certificados.idCertificado = producto_coladas.idCertificado
            set certificados.descripcion = '${originalname}', ruta = '${path}' 
            where producto_coladas.idProductoColadas = ${id}
        `)

            if (updateCertificados.affectedRows === 0) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Error al Actualizar'
                })
            }
        }

        if (req.body.coladas) {

            const { coladas } = req.body;

            const updateColada = await query(` 
                update coladas
                inner join producto_coladas on producto_coladas.idColada = coladas.idColada
                set colada = '${coladas}' 
                where producto_coladas.idProductoColadas = ${id}`
            )

            if (updateColada.affectedRows === 0) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Error al Actualizar'
                })
            }



        }



        return res.json({
            ok: true,
            message: 'Actualizado correctamente'
        })





    } catch (error) {
        console.log(error);

        res.status(500).json({
            ok: false,
            message: 'Error revisar logs'
        })
    }


}









module.exports = controller;