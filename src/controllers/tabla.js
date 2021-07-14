let controller = {};



let { table } = require('../helpers/tableServerPro')


controller.dataTableOrdenes = async (req, res) => {


    let consulta = `
    SELECT  PRVCOD,IF(PRVNOM IS NULL,'TRASPASO',PRVNOM),PRVRFC,DNUM,DATE_FORMAT(DFECHA,"%Y-%m-%d") as DFECHA,DREFERELLOS,DREFER FROM FDOC
    LEFT JOIN FPRV ON FPRV.PRVSEQ=FDOC.PRVSEQ
    WHERE (mid(DNUM,1,2)='RA' OR mid(DNUM,1,2)='1B' OR mid(DNUM,1,2)='1C' OR mid(DNUM,1,2)='1D' OR mid(DNUM,1,2)='1E'  OR mid(DNUM,1,2)='1F'  ) AND DCANCELADA=0 AND mid(DREFER,1,5)<>'CANCE'
    `


    let sTable = 'FDOC';

    let aColumns = [
        `IF(PRVNOM  IS NULL,'TRASP',PRVNOM) as PRVCOD`,
        `IF(PRVNOM  IS NULL,'TRASPASO',PRVNOM) as PRVNOM`,
        `IF(PRVNOM  IS NULL,'TRASPASO',PRVNOM) as PRVRFC`,
        'DNUM',
        'DATE_FORMAT(DFECHA,"%Y-%m-%d") as DFECHA',
        'DREFERELLOS',
        'DREFER'
    ];

    let sjoin = `LEFT JOIN FPRV ON FPRV.PRVSEQ=FDOC.PRVSEQ`;

    let sWhere = `WHERE (mid(DNUM,1,2)='RA' OR mid(DNUM,1,2)='1B' OR mid(DNUM,1,2)='1C' OR mid(DNUM,1,2)='1D' OR mid(DNUM,1,2)='1E'  OR mid(DNUM,1,2)='1F')   AND  (DCANCELADA=0 AND mid(DREFER,1,5)<>'CANCE') `;


    let resp = await table(sTable, aColumns, sjoin,sWhere,'Proscai', req)
        .catch ( console.log());

    res.status(200).send(resp);

}


module.exports = controller;