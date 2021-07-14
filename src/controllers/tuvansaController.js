const controller = {};

const moment = require('moment-timezone');

const query = require('../connection/tuvansaConnection');

let { table } = require('../helpers/tableServerPro')



let sjoin = " left join usuario as u on finv.usuario = u.id ";
let sTable = 'FINV';
let aColumns = [
    'ISEQ', 'ICOD', 'IEAN', 'I2DESCR', 'DATE_FORMAT(IALTA,"%Y-%m-%d") as IALTA', 'ALMCANT', 'IUM', 'ALMCANTMTY', 'ALMCANTVER', 'ALMASIGNADO', '(ALMCANT-ALMASIGNADO) as DIF', 'ALMCANTREAL',
    'U.user', 'COMENTARIOS'];


// Se corre una sola vez por que inserta la base de datos en proscai a la base de tuvansa en el server 192.168.1.205
controller.insertaABdTuvansa = async (inventarios) => {



    for (inventario of inventarios) {
        if (inventario.ALMCANT === null) {
            inventario.ALMCANT = 0;
        }
        if (inventario.ALMASIGNADO === null) {
            inventario.ALMASIGNADO = 0;
        }




        await query(` INSERT INTO FINV SET ? `, [inventario]);
    }

    return {
        ok: true,
        message: 'insertados correctamente'
    }
}

//Inserta o actualiza los datos desde proscai a la BD Tuvansa
controller.insertaActualiza = async (inventarios) => {

    let actualizados = [];
    let insertados = [];


    if (!inventarios.length > 0) { // si no hay inventarios en porscai en la fecha actual
        return {
            ok: false,
            message: 'No hay inventarios que insertar o actualizar'
        }
    }

    //console.log('DE PROSCAI', inventarios);

    for (const inventario of inventarios) {

        if (inventario.ALMCANT === null) {
            inventario.ALMCANT = 0;
        }

        const buscaIseq = await query(`Select * FROM FINV WHERE ISEQ = ?  `, [inventario.ISEQ]);

        if (buscaIseq.length === 0) {
            let inserta = await query(`INSERT INTO FINV SET ?`, inventario);
            insertados.push(inventario);
        }


        /*         if (buscaIseq.length > 0) {
        
        
                    //console.log(`el iseq ${buscaIseq[0].ISEQ} se encuentra en la bd tuvansa `)
                    const buscaAlmcant = await query(`SELECT * FROM FINV WHERE ISEQ = ? AND ALMCANT != ?  `, [inventario.ISEQ, inventario.ALMCANT])
        
                    if (buscaAlmcant.length > 0) {
        
                        const actualiza = await query(`UPDATE FINV  SET ALMCANT = ${inventario.ALMCANT} WHERE ISEQ = ?`, [inventario.ISEQ])
        
                        if (actualiza) {
                            actualizados.push(buscaAlmcant[0])
                            //console.log(`el iseq ${inventario.ISEQ} tiene diferente valor PROSCAI ALMCANT= ${inventario.ALMCANT} TUVANSA ALMCANT = ${buscaIseq[0].ALMCANT}`)
                        }
        
                    } else {
                        // console.log(`el iseq ${buscaIseq[0].ISEQ} esta en la bd tuvansa pero los valores son iguales PROSCAI ALMCANT= ${inventario.ALMCANT} TUVANSA ALMCANT = ${buscaIseq[0].ALMCANT} `)
                    }
        
                } else {
        
                    let inserta = await query(`INSERT INTO FINV SET ?`, inventario);
                    insertados.push(inventario);
                    // console.log(`el iseq ${inventario.ISEQ} es nuevo  `)
        
                } */


    }


    if (actualizados.length > 0) {
        return {
            ok: true,
            message: 'Registros actualizados',
            data: actualizados
        };
    }

    if (insertados.length > 0) {
        return {
            ok: true,
            message: 'Registros insertados',
            data: insertados
        };
    }

    return {
        ok: false,
        message: 'No hay nada que hacer',
    }

}

controller.insertaIum = async (ium) => {

    for (let unidad of ium) {

        console.log(unidad)

        if (await query(`UPDATE FINV SET IUM = ? WHERE ISEQ = ?`, [unidad.IUM, unidad.ISEQ])) {

            console.log('ok')
        }
    }


    return {
        ok: true,
        message: 'Unidad de medida insertado correctamente'
    }



}

controller.actualizaAlmcantAlmasignado = async (inventarioProscai) => {


    for (let inventario of inventarioProscai) {

        await query('UPDATE FINV SET ALMCANT = ? WHERE ISEQ = ?', [inventario.ALMCANT, inventario.ISEQ])


        await query('UPDATE FINV SET ALMASIGNADO = ? WHERE ISEQ = ?', [inventario.ALMASIGNADO, inventario.ISEQ])

    }


    return {
        ok: true,
        message: `Actualizado cambios en inventario y asignados ${moment().tz('America/Mexico_City').format()} `,
    }
}


controller.actualizaAlmacenesMexicoMonterreyVeracruz = async (inventarios) => {

    const mexico = inventarios.almacenMexico
    const monterrey = inventarios.almacenMonterrey
    const veracruz = inventarios.almacenVeracruz

    if (mexico.length > 0) {
        console.log('Buscando cambios en almacen Mexico')
        for (let inventario of mexico) {
            await query(`UPDATE FINV SET ALMCANT = ?, ALMASIGNADO = ?, IUM = ? WHERE ISEQ = ?`, [inventario.ALMCANT, inventario.ALMASIGNADO, inventario.IUM, inventario.ISEQ]);
        }
    }

    if (monterrey.length > 0) {
        console.log('Buscando cambios en almacen Mexico/Monterrey')
        for (let inventario of monterrey) {
            await query(`UPDATE FINV SET ALMCANTMTY = ? WHERE ISEQ = ?`, [inventario.ALMCANT, inventario.ISEQ]);
        }
    }

    if (veracruz.length > 0) {
        console.log('Buscando cambios en almacen Mexico/Veracruz')
        for (let inventario of veracruz) {
            await query(`UPDATE FINV SET ALMCANTVER = ? WHERE ISEQ = ?`, [inventario.ALMCANT, inventario.ISEQ]);
        }
    }



    return {
        ok: true,
        message: 'Almacenes actualizados'
    }

}


controller.cargaDataTable = async (req, res) => {
    let resp = await table(sTable, aColumns, sjoin, '', 'Tuvansa', req);
    res.status(200).send(resp)
}

controller.inserta = async (req, res) => {

    const fechaActual = moment().format('YYYY-MM-DD');

    try {

        let datos = { ...req.body, ...req.user };

        if (req.user === undefined) {

            return res.status(400).json({ ok:false,  message: 'No hay usuario' })
            
        }


        if (datos.action !== 'edit') {
            return;
        }


        if (isNaN(datos.ALMCANTREAL) || datos.ALMCANTREAL === '') {
            return res.status(400).json({ ok:false, message: 'Solo datos numericos' })
            
        }



        console.log(datos);


        await query(`UPDATE FINV SET USUARIO= ?, IALTAREAL = ?, ALMCANTREAL = ?, COMENTARIOS = ? WHERE ISEQ = ? `, [datos.idUsuario, fechaActual, datos.ALMCANTREAL, datos.COMENTARIOS, datos.ISEQ])

        await query(`insert into usuariofinv set idFinv = (select id from finv where iseq = ${datos.ISEQ}), idUsuario = ${datos.idUsuario}`);


        return res.json( {
            ok: true,
            message: 'Registros actualizados'
        })






    } catch (error) {

        console.log(error)

        return res.status(500).json({
            ok: false,
            message: 'Hubo un error, revisar logs'
        })

    }







}


controller.creaColumnaAFinDeMes = async () => {

    const mes = String(moment().tz('America/Mexico_City').format('M'))
    const anio = String(moment().tz('America/Mexico_City').format('Y'))
    //let ultimoDiaMes = moment().endOf('month').format('D');
    let elementosActualizados = 0;

    console.log(moment().tz('America/Mexico_City').format('D h:mm a'))
    //console.log(`la siquiente actualizacion sera el dia  ${ultimoDiaMes} de ${mes} de ${anio} a las 10:00 pm`)


    let buscaColumna = await query(
        ` SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'tuvansa' 
            AND TABLE_NAME = 'FINV' AND COLUMN_NAME = 'ALMCANTREAL0${mes}${anio}' `
    )



    if (buscaColumna.length > 0) {
        console.log('Ya existe la columna')
        return {
            ok: false,
            message: ` ya existen las columna ALMCANTREAL0${mes}${anio}`
        }
    }


    let crearColumna = await query(
        `ALTER TABLE FINV
        ADD COLUMN ALMCANT0${mes}${anio} DECIMAL(18,3),
        ADD COLUMN ALMCANTREAL0${mes}${anio} DECIMAL(18,3), 
        ADD COLUMN IALTAREAL0${mes}${anio} date`
    );

    let inventarios = await query(`
            SELECT ISEQ, ALMCANT,DATE_FORMAT(IALTAREAL,"%Y-%m-%d")  AS IALTAREAL ,ALMCANTREAL 
            FROM FINV `);


    console.log('Procesando ....');
    for (const inventario of inventarios) {
        let data = {}
        data.iseq = inventario.ISEQ;
        data.almcant = inventario.ALMCANT;
        data.ialtareal = inventario.IALTAREAL == null ? null : ` '${inventario.IALTAREAL}' `;
        data.almcantreal = inventario.ALMCANTREAL != null ? inventario.ALMCANTREAL : 0;



        let queryInv = `
                UPDATE FINV 
                SET  
                ALMCANT0${mes}${anio} = ${data.almcant},
                ALMCANTREAL0${mes}${anio} = ${data.almcantreal},
                IALTAREAL0${mes}${anio} = ${data.ialtareal} 
                WHERE ISEQ = ${data.iseq}
            `;


        let insertado = await query(queryInv);

        elementosActualizados++;

    }

    return {
        ok: true,
        message: `Registros actualizados ${elementosActualizados}`
    }


}

controller.insertaProveedores = async (proveedoresProscai)=>{


    try {

        const [fecha] = await query('SELECT MAX( DATE_FORMAT(fecha_alta,"%Y-%m-%d" )) as ultimaAlta FROM proveedores');

        const proveedores = proveedoresProscai.filter( proveedores => proveedores.prvalta > fecha.ultimaAlta );
    
        if( proveedores.length === 0){
            console.log('No hay proveedores nuevos')
            return;
        }

        console.log(proveedores)

        proveedores.map( async ({prvcod, prvnom, prvrfc, prvalta}) =>{
        
            await query('Insert into proveedores set codigo = ?, nombre = ?, rfc = ?, fecha_alta = ?', [prvcod, prvnom, prvrfc, prvalta]);
    
        })

        console.log('insertados correctamente')
        
    } catch (error) {
        console.log(error)
    }


}

module.exports = controller;


