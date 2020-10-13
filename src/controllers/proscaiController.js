const controller = {}

const mysql = require('mysql');
const util = require('util');
const moment = require('moment');



controller.inventarios = async () => {

    const inventarios = await query(`
        SELECT FINV.ISEQ,ICOD,IEAN,I2DESCR,IALTA,ALMCANT FROM FINV
        LEFT JOIN FALM ON FALM.ISEQ=FINV.ISEQ
        LEFT JOIN FINV2 ON FINV2.I2KEY=FINV.ISEQ
        WHERE mid(ICOD,1,2)='01'
        
    `);



    return inventarios;
}

controller.buscaRegistrosNuevos = async () => {

    const currentDay = moment().format('D')
    const currentMonth = moment().format('M')
    const currentYear = moment().format('Y')


    const connection = mysql.createConnection({
        host: 'tuvansa.dyndns.org',
        user: 'consultas',
        password: 'consultas',
        database: 'tuvansa'
    });

    const query = util.promisify(connection.query).bind(connection);

  

    const registrosNuevos = await query(`
    SELECT FINV.ISEQ,ICOD,IEAN,I2DESCR,DATE_FORMAT(IALTA,"%Y-%m-%d" ) AS IALTA,ALMCANT FROM FINV
    LEFT JOIN FALM ON FALM.ISEQ=FINV.ISEQ
    LEFT JOIN FINV2 ON FINV2.I2KEY=FINV.ISEQ
    WHERE mid(ICOD,1,2)='01' and  DAY(IALTA) = ${currentDay} AND  MONTH(IALTA)=${currentMonth}  AND YEAR(IALTA)= ${currentYear}`);

    connection.end();

    return registrosNuevos;
}


module.exports = controller;

