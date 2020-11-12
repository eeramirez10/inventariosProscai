const controller = {}

const mysql = require('mysql');
const util = require('util');
const moment = require('moment-timezone');

const momentTZMexico = moment().tz('America/Mexico_City');

const connection = mysql.createConnection({
    host: 'tuvansa.dyndns.org',
    user: 'consultas',
    password: 'consultas',
    database: 'tuvansa'
});

const query = util.promisify(connection.query).bind(connection);

controller.inventarios = async () => {

    const inventarios = await query(`
        SELECT FINV.ISEQ,ICOD,IEAN,I2DESCR,IALTA,SUM(ALMCANT) as ALMCANT, SUM(ALMASIGNADO) AS ALMASIGNADO  FROM FINV
        LEFT JOIN FALM ON FALM.ISEQ=FINV.ISEQ
        LEFT JOIN FINV2 ON FINV2.I2KEY=FINV.ISEQ
        WHERE mid(ICOD,1,2)='01' AND ALMNUM = '01'
        GROUP BY ICOD
        ORDER BY ISEQ
        
    `);



    return inventarios;
}


controller.unidad = async ()=>{

    const ium = await query(`
    
    SELECT FINV.ISEQ,IUM FROM FINV
    LEFT JOIN FALM ON FALM.ISEQ=FINV.ISEQ
    LEFT JOIN FINV2 ON FINV2.I2KEY=FINV.ISEQ
    WHERE mid(ICOD,1,2)='01' AND ALMNUM = '01'
    GROUP BY ICOD
    ORDER BY ISEQ;
    `)

    return ium;
}


controller.traeAlmcantAlmasigandoAlmacenesMexicoMonterreyVeracruz = async () => {

    const almacenMexico = await query(`
    SELECT FINV.ISEQ,SUM(ALMCANT) as ALMCANT,IUM, SUM(ALMASIGNADO) AS ALMASIGNADO  FROM FINV
    LEFT JOIN FALM ON FALM.ISEQ=FINV.ISEQ
    LEFT JOIN FINV2 ON FINV2.I2KEY=FINV.ISEQ
    WHERE mid(ICOD,1,2)='01' AND ALMNUM = '01' 
    GROUP BY ICOD
    ORDER BY ISEQ;
    
    `);

    const almacenMonterrey = await query(`
    SELECT FINV.ISEQ,SUM(ALMCANT) as ALMCANT FROM FINV
    LEFT JOIN FALM ON FALM.ISEQ=FINV.ISEQ
    LEFT JOIN FINV2 ON FINV2.I2KEY=FINV.ISEQ
    WHERE mid(ICOD,1,2)='01' AND ALMNUM = '12' AND ALMCANT <> 0
    GROUP BY ICOD
    ORDER BY ISEQ;
    `)

    const almacenVeracruz = await query(`
    SELECT FINV.ISEQ,SUM(ALMCANT) as ALMCANT FROM FINV
    LEFT JOIN FALM ON FALM.ISEQ=FINV.ISEQ
    LEFT JOIN FINV2 ON FINV2.I2KEY=FINV.ISEQ
    WHERE mid(ICOD,1,2)='01' AND ALMNUM = '13' AND ALMCANT <> 0
    GROUP BY ICOD
    ORDER BY ISEQ;
    `)

    return {
        almacenMexico,
        almacenMonterrey,
        almacenVeracruz
    };
}



controller.buscaRegistrosNuevos = async () => {

    const currentDay = moment().tz('America/Mexico_City').format('D')
    const currentMonth = moment().tz('America/Mexico_City').format('M')
    const currentYear = moment().tz('America/Mexico_City').format('Y')


    const registrosNuevos = await query(`
    SELECT FINV.ISEQ,ICOD,IEAN,I2DESCR,DATE_FORMAT(IALTA,"%Y-%m-%d" ) AS IALTA, SUM(ALMCANT) as ALMCANT, IUM, SUM(ALMASIGNADO) AS ALMASIGNADO FROM FINV
    LEFT JOIN FALM ON FALM.ISEQ=FINV.ISEQ
    LEFT JOIN FINV2 ON FINV2.I2KEY=FINV.ISEQ
    LEFT JOIN FFAM AS FAM2 ON FAM2.FAMTNUM = FINV.IFAM2
    WHERE mid(ICOD,1,2)='01' AND ALMNUM = '01' and  DAY(IALTA) = ${currentDay} AND  MONTH(IALTA)=${currentMonth}  AND YEAR(IALTA)= ${currentYear}
    GROUP BY ICOD
    ORDER BY ISEQ
    `);


    return registrosNuevos;
}


module.exports = controller;

