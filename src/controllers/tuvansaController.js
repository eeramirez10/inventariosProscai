const controller = {};

const mysql = require('mysql');
const util = require('util');
const moment = require('moment');
const requestDB = require('request');
const { Console } = require('console');

let sIndexColumn = '*';
let sTable = 'FINV';
var request = {};
var aColumns = [
    'ISEQ', 'ICOD', 'IEAN', 'I2DESCR', ' DATE_FORMAT(IALTA,"%Y-%m-%d")', 'ALMCANT', 'ALMASIGNADO', '(ALMCANT - ALMASIGNADO) ', 'ALMCANTREAL',
    ' u.nombre'];

const connection = mysql.createConnection({
    host: 'tuvansa-server.dyndns.org',
    user: 'erick',
    password: 'Ag7348pp**',
    database: 'tuvansa'
});

const query = util.promisify(connection.query).bind(connection);

// Se corre una sola vez por que inserta la base de datos en proscai a la base de tuvansa en el server 192.168.1.205
controller.insertaABdTuvansa = async (inventarios) => {

    for (inventario of inventarios) {
        if (inventario.ALMCANT === null ) {
            inventario.ALMCANT = 0;
        }
        if(inventario.ALMASIGNADO === null){
            inventario.ALMASIGNADO = 0;
        }
        connection.query(` INSERT INTO FINV SET ? `, inventario, (err, result) => {
            if (err) throw err;
            console.log(result);
        })
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

        //console.log('buscaIseq', buscaIseq)

        if (buscaIseq.length > 0) {


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

        }


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

controller.actualizaAlmcantAlmasignado = async (inventarioProscai) =>{

    const inventarios = inventarioProscai;
    let almcantCambios = []
    let almasignadoCambios = [];
    for (let inventario of inventarios){

        const buscaAlmcant = await query('Select ISEQ, ALMCANT FROM FINV WHERE ISEQ = ? AND ALMCANT != ?', [inventario.ISEQ,inventario.ALMCANT ])

        if (buscaAlmcant.length > 0){
            await query('UPDATE FINV SET ALMCANT = ? WHERE ISEQ = ?', [inventario.ALMCANT, inventario.ISEQ])
            almcantCambios.push(inventario);
        }

        const buscaAlmsignado = await query('Select ISEQ, ALMCANT FROM FINV WHERE ISEQ = ? AND ALMASIGNADO != ?', [inventario.ISEQ,inventario.ALMASIGNADO ])

        if(buscaAlmsignado.length > 0){
            await query ('UPDATE FINV SET ALMASIGNADO = ? WHERE ISEQ = ?', [inventario.ALMASIGNADO, inventario.ISEQ]) 
            almasignadoCambios.push(inventario)
        }
        
      
    }

    if(almcantCambios.length == 0 && almasignadoCambios.length == 0){
        return {
            ok: true,
            message: 'No hay cambios'
        }
    }

    return {
        ok:true,
        message:'Registros actualizados',
        almcantCambios,
        almasignadoCambios
    }
}


controller.cargaDataTable = (req, res) => {
    console.log('GET request to /server');
    request = req.query;

    //console.log(req.user)
    server(res);
}

controller.inserta = (req, res) => {

    
    
    
    if (isNaN(req.body.value) || req.body.value ==='') {
        return
    }

    let datos = {...req.body, ...req.user}
    console.log(datos)
    const fechaActual = moment().format('YYYY-MM-DD');

    
    


    (async () => {
        
       
        if (await query(`UPDATE FINV SET idUsuario= ?, IALTAREAL = ?, ALMCANTREAL = ? WHERE ISEQ = ? `, [datos.idUsuario,fechaActual, datos.value, datos.iseq])) {

            return {
                ok: true,
                message: 'Registros actualizados'
            }
        }

        return

    })()
        .then(resp => console.log(resp))
        .catch(err => console.log(err));




}


controller.creaColumnaAFinDeMes = async () => {

    const mes = String(moment().format('M'))
    const anio = String(moment().format('Y'))
    //let ultimoDiaMes = moment().endOf('month').format('D');
    let elementosActualizados = 0;

    console.log(moment().format('D h:mm a'))
    //console.log(`la siquiente actualizacion sera el dia  ${ultimoDiaMes} de ${mes} de ${anio} a las 10:00 pm`)


    let buscaColumna = await query(
        ` SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'tuvansa' 
            AND TABLE_NAME = 'FINV' AND COLUMN_NAME = 'ALMCANTREAL0${mes}${anio}' `
    )



    if (buscaColumna.length > 0) {
        console.log('Ya existe la columna')
        return{
            ok:false,
            message:` ya existen las columna ALMCANTREAL0${mes}${anio}`
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


//------------------------- Functions

function server(res) {
    //Paging
    var sLimit = "";
    if (request['iDisplayStart'] && request['iDisplayLength'] != -1) {
        sLimit = 'LIMIT ' + request['iDisplayStart'] + ', ' + request['iDisplayLength']
    }

    //Ordering
    var sOrder = "";
    if (request['iSortCol_0']) {
        sOrder = 'ORDER BY ';

        for (var i = 0; i < request['iSortingCols']; i++) {
            if (request['bSortable_' + parseInt(request['iSortCol_' + i])] == "true") {
                sOrder += aColumns[parseInt(request['iSortCol_' + i])] + " " + request['sSortDir_' + i] + ", ";
            }
        }

        sOrder = sOrder.substring(0, sOrder.length - 2)
        if (sOrder == 'ORDER BY') {
            console.log("sOrder == ORDER BY");
            sOrder = "";
        }
    }

    //Filtering
    var sWhere = "";
    if (request['sSearch'] && request['sSearch'] != "") {
        let busqueda = request['sSearch'].toUpperCase();
        sWhere = "WHERE (";
        for (var i = 0; i < aColumns.length; i++) {
            sWhere += aColumns[i] + " LIKE " + "\'%" + busqueda + "%\'" + " OR ";
        }

        sWhere = sWhere.substring(0, sWhere.length - 4);
        sWhere += ')';
    }

    //Individual column filtering
    for (var i = 0; i < aColumns.length; i++) {
        if (request['bSearchable_' + i] && request['bSearchable_' + i] == "true" && request['sSearch_' + i] != '') {
            if (sWhere == "") {
                sWhere = "WHERE ";
            }
            else {
                sWhere += " AND ";
            }
            sWhere += " " + aColumns[i] + " LIKE " + request['sSearch_' + i] + " ";
        }
    }

    //Queries
    //var sQuery = "SELECT SQL_CALC_FOUND_ROWS " +aColumns.join(',')+ " FROM " +sTable+" "+sWhere+" "+sOrder+" "+sLimit +" limit 10";

    
    var sQuery = `SELECT SQL_CALC_FOUND_ROWS  ${aColumns.join(',')} FROM ${sTable} left join usuario as u on finv.IdUsuario = u.id  ${sWhere} ${sOrder} ${sLimit} `;

    var rResult = {};
    var rResultFilterTotal = {};
    var aResultFilterTotal = {};
    var iFilteredTotal = {};
    var iTotal = {};
    var rResultTotal = {};
    var aResultTotal = {};

    (async () => {

        let results = await query(sQuery);
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





    })();

}

function sendJSON(res, httpCode, body) {
    var response = JSON.stringify(body);
    res.status(httpCode).send(response)

}


module.exports = controller;


