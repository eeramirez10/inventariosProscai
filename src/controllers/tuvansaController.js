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




const indexedByKey = (arr, key) => 
    new Promise( resolve => resolve( arr.reduce((acc, el) => ({ ...acc, [el[key]]: el }), {}) ) )



const nuevosInventarios = (indexed, inventarios) =>
    new Promise(resolve => resolve( inventarios.filter(({ ISEQ }) => !indexed[ISEQ])));

const registrosActualizados = (indexed, array, key, value) =>
    new Promise(resolve => resolve( array.filter(  item  => indexed[item[key]][value] !== item[value]) ) );






//Inserta o actualiza los datos desde proscai a la BD Tuvansa
controller.insertaActualiza = async (inventariosProscai, [almMty, almVer]) => {


    try {

        console.time(1)

        const invMexico = await query(`Select ISEQ, ALMASIGNADO, ALMCANT, ALMCANTVER, ALMCANTMTY, I2DESCR, IUM FROM FINV `);

        let indexedInvMexico = await indexedByKey(invMexico, 'ISEQ');

        const nuevos = await nuevosInventarios(indexedInvMexico, inventariosProscai);

        if (nuevos.length > 0) {

            for (let inv of nuevos) {

                await query(`INSERT INTO FINV SET ?`, [inv])
            }

            console.log('insertados correctamente', nuevos)

            const indexedNuevos = await indexedByKey(nuevos, 'ISEQ');

            indexedInvMexico = { ...indexedInvMexico, ...indexedNuevos }



        }


        const AlmMtyResult = await registrosActualizados(indexedInvMexico, almMty,'ISEQ','ALMCANTMTY');

        console.log(AlmMtyResult)

        const AlmVerResult = await registrosActualizados(indexedInvMexico, almVer,'ISEQ','ALMCANTVER');

        const almasignadoResutl = await registrosActualizados(indexedInvMexico, inventariosProscai,'ISEQ','ALMASIGNADO');

        const almcantResult = await await registrosActualizados(indexedInvMexico, inventariosProscai,'ISEQ','ALMCANT')

        const nuevoIum = await registrosActualizados(indexedInvMexico, inventariosProscai,'ISEQ','IUM')

        const nuevoDescr = await await registrosActualizados(indexedInvMexico, inventariosProscai,'ISEQ','I2DESCR')


        if (nuevoDescr.length > 0) {

            for (const { ISEQ, I2DESCR } of nuevoDescr) {

                await query('UPDATE  FINV SET I2DESCR = ? WHERE ISEQ = ?', [I2DESCR, ISEQ])

                console.log('I2DESCR Actualizado')
            }

        }


        if (nuevoIum.length > 0) {



            for (const { ISEQ, IUM } of nuevoIum) {

                await query('UPDATE  FINV SET IUM = ? WHERE ISEQ = ?', [IUM, ISEQ])

                console.log('IUM Actualizado')
            }

        }

        if (AlmMtyResult.length > 0) {



            for (const { ISEQ, ALMCANTMTY } of AlmMtyResult) {

                await query('UPDATE  FINV SET ALMCANTMTY = ? WHERE ISEQ = ?', [ALMCANTMTY, ISEQ])

                console.log('Actualizando Almacen mty')
            }

        }

        if (AlmVerResult.length > 0) {

            for (const { ISEQ, ALMCANTVER } of AlmVerResult) {

                await query('UPDATE  FINV SET ALMCANTVER = ? WHERE ISEQ = ?', [ALMCANTVER, ISEQ])

                console.log('Actualizando Almacen VER')
            }

        }

        if (almasignadoResutl.length > 0) {

            for (const { ISEQ, ALMASIGNADO } of almasignadoResutl) {

                await query('UPDATE FINV SET ALMASIGNADO = ? WHERE ISEQ = ?', [ALMASIGNADO, ISEQ])

            }

            console.log('Almasignado Actualizado', almasignadoResutl)

        }

        if (almcantResult.length > 0) {



            for (const { ALMCANT, ISEQ } of almcantResult) {
                await query('UPDATE FINV SET ALMCANT = ? WHERE ISEQ = ?', [ALMCANT, ISEQ])
            }

            console.log('Almcant actualizado', almcantResult);


        }


        console.timeEnd(1)





    } catch (error) {
        console.log(error)
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

            return res.status(400).json({ ok: false, message: 'No hay usuario' })

        }


        if (datos.action !== 'edit') {
            return;
        }


        if (isNaN(datos.ALMCANTREAL) || datos.ALMCANTREAL === '') {
            return res.status(400).json({ ok: false, message: 'Solo datos numericos' })

        }



        console.log(datos);


        await query(`UPDATE FINV SET USUARIO= ?, IALTAREAL = ?, ALMCANTREAL = ?, COMENTARIOS = ? WHERE ISEQ = ? `, [datos.idUsuario, fechaActual, datos.ALMCANTREAL, datos.COMENTARIOS, datos.ISEQ])

        await query(`insert into usuariofinv set idFinv = (select id from finv where iseq = ${datos.ISEQ}), idUsuario = ${datos.idUsuario}`);


        return res.json({
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

controller.insertaProveedores = async (proveedoresProscai) => {


    try {

        const [fecha] = await query('SELECT MAX( DATE_FORMAT(fecha_alta,"%Y-%m-%d" )) as ultimaAlta FROM proveedores');

        const proveedores = proveedoresProscai.filter(proveedores => proveedores.prvalta > fecha.ultimaAlta);

        if (proveedores.length === 0) {
            console.log('No hay proveedores nuevos')
            return;
        }

        console.log(proveedores)

        proveedores.map(async ({ prvcod, prvnom, prvrfc, prvalta }) => {

            await query('Insert into proveedores set codigo = ?, nombre = ?, rfc = ?, fecha_alta = ?', [prvcod, prvnom, prvrfc, prvalta]);

        })

        console.log('insertados correctamente')

    } catch (error) {
        console.log(error)
    }


}

module.exports = controller;


