const controller = {}


const query = require('../connection/proscaiConnection');


const indexByKey = (arr, key) => new Promise (resolve => resolve(arr.reduce((acc,el) => ({ ...acc, [el[key]]: el  }),{})))  





controller.AlmacenesMtyVer = async () => {

    
    const almacenMonterrey = await query(`
    SELECT FINV.ISEQ,SUM(ALMCANT) as ALMCANTMTY FROM FINV
    LEFT JOIN FALM ON FALM.ISEQ=FINV.ISEQ
    LEFT JOIN FINV2 ON FINV2.I2KEY=FINV.ISEQ
    WHERE mid(ICOD,1,2)='01' AND ALMNUM = '12' AND ALMCANT <> 0
    GROUP BY ICOD
    ORDER BY ISEQ;
    `)
   
    
    const almacenVeracruz = await query(`
    SELECT FINV.ISEQ,SUM(ALMCANT) as ALMCANTVER FROM FINV
    LEFT JOIN FALM ON FALM.ISEQ=FINV.ISEQ
    LEFT JOIN FINV2 ON FINV2.I2KEY=FINV.ISEQ
    WHERE mid(ICOD,1,2)='01' AND ALMNUM = '13' AND ALMCANT <> 0
    GROUP BY ICOD
    ORDER BY ISEQ;
    `)
    

    return [ almacenMonterrey, almacenVeracruz ]
       
    

}



controller.inventarios = async () =>
(await query(`
    SELECT FINV.ISEQ,ICOD,IEAN,I2DESCR,DATE_FORMAT(IALTA,"%Y-%m-%d" ) AS IALTA, SUM(ALMCANT) as ALMCANT, IUM, SUM(ALMASIGNADO) AS ALMASIGNADO FROM FINV
    LEFT JOIN FALM ON FALM.ISEQ=FINV.ISEQ
    LEFT JOIN FINV2 ON FINV2.I2KEY=FINV.ISEQ
    LEFT JOIN FFAM AS FAM2 ON FAM2.FAMTNUM = FINV.IFAM2
    WHERE mid(ICOD,1,2)='01' AND ALMNUM = '01'
    GROUP BY ICOD
    ORDER BY ISEQ`
))





controller.getProveedores = async () => await query('SELECT prvcod, prvnom,prvrfc, DATE_FORMAT(prvalta, "%Y-%m-%d") as prvalta  from fprv');


// controller.getLastProveedores = async () => await query('SELECT MAX( DATE_FORMAT(prvalta,"%Y-%m-%d" )) as ultimaFecha FROM FPRV');


module.exports = controller;

