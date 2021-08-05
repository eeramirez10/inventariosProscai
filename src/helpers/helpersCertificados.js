const helper = {};

const query = require('../connection/tuvansaConnection');


helper.getIdProveedor = async (PRVCOD) => {
    
    return ( !PRVCOD )
    ? 4499
    : await query('SELECT idProveedor From proveedores where codigo = ?', [PRVCOD])
    .then(([resp]) => resp.idProveedor)
}



helper.getIdDocumento = async (idProveedor, { DNUM, DFECHA, DREFERELLOS, DREFER }) =>{

    let idDocumento    = await query(`SELECT idDocumento FROM documentos WHERE entrada = '${DNUM}'`)
                                        .then( ([ resp ]) =>  resp && resp.idDocumento  ) 

    

    return idDocumento
    ? idDocumento
    : await query(`
        INSERT INTO documentos 
        SET entrada = '${DNUM}', fecha = '${DFECHA}',factura = '${DREFERELLOS}',orden  = '${DREFER}', idProveedor = ${idProveedor}`)
        .then( resp => resp.insertId)
    

}

helper.getIdProducto = async ({ ICOD, I2DESCR, AICANTF, IUM,  IEAN}) =>{

    let idProducto = await query(`SELECT idProducto FROM producto WHERE codigo = '${ICOD}'`).then( ([resp]) => resp && resp.idProducto ) 

   

    return idProducto
    ? idProducto
    : await query(`
        INSERT INTO producto 
        SET codigo = '${ICOD}',  descripcion  = '${I2DESCR}', cantidad = '${AICANTF}' ,  unidad  = '${IUM}', iean = '${IEAN}' `)
        .then( resp => resp.insertId)

}

helper.getIdProductoDocumentos = async (idProducto, idDocumento) =>{

    let idProductoDocumentos  = await query(`
        SELECT idProductoDocumentos 
        FROM productos_documentos 
        WHERE idProducto = ${idProducto} && idDocumento = ${idDocumento}`).then( ([resp]) => resp && resp.idProductoDocumentos);

      

    return idProductoDocumentos
    ? idProductoDocumentos
    :  await query(`
        INSERT INTO productos_documentos 
        SET idProducto = ${idProducto},  idDocumento  = ${idDocumento}`)
            .then( resp => resp.insertId)
}



helper.getIdCertificado = async ({originalname, path }) =>{

    let idCertificado = await query(`SELECT idCertificado FROM certificados WHERE descripcion = '${originalname}'`).then( ([resp]) => resp && resp.idCertificado);

    if(!idCertificado){

        return await query(` INSERT INTO certificados SET descripcion = '${originalname}',  ruta  = '${path}'`).then( resp => resp.insertId)
    }

    return idCertificado;
   
}

helper.getIdColada = async ( colada ) =>{

    let idColada = await query('SELECT idColada from coladas where colada = ?  limit 1', [colada]).then( ([resp]) => resp && resp.idColada);

    if(!idColada){
        return await query(` INSERT INTO coladas SET colada = '${colada}'`).then( resp => resp.insertId)
    }

    return idColada;

}






helper.SetColada = async ( colada, idCertificado ) =>  
    await query(` INSERT INTO coladas SET colada = '${colada}',  idCertificado  = '${idCertificado}'`).then(resp => resp.insertId)







helper.getIdProductoColadas = async (idColada,idCertificado, idProductoDocumentos) =>{

    const idProductoColadas = await 
        query(`
            SELECT idProductoColadas FROM  producto_coladas 
            WHERE  idColada = ${idColada} AND  idProductoDocumentos = ${idProductoDocumentos} AND  idCertificado = ${idCertificado}`).then( ([resp]) =>  resp && resp.idProductoColadas );

       

    if(!idProductoColadas){

       return  await query(`INSERT INTO producto_coladas SET idColada = ${idColada}, idProductoDocumentos = ${idProductoDocumentos}, idCertificado = ${idCertificado}`).then(resp => resp.insertId)
    }

   

    return idProductoColadas;
}




module.exports = helper;