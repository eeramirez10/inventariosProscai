let controller = {};



let { table } = require('../helpers/tableServerPro')


controller.dataTableOrdenes = async (req, res) => {

    try {

        let sTable = 'FDOC';

        let aColumns = [
            `IF(PRVNOM  IS NULL,'TRASP',PRVCOD) as PRVCOD`,
            `IF(PRVNOM  IS NULL,'TRASPASO',PRVNOM) as PRVNOM`,
            `IF(PRVNOM  IS NULL,'TRASPASO',PRVRFC) as PRVRFC`,
            'DNUM',
            'DATE_FORMAT(DFECHA,"%Y-%m-%d") as DFECHA',
            'DREFERELLOS',
            'DREFER',
            'DATE_FORMAT(PRVALTA, "%Y-%m-%d") AS PRVALTA'
        ];
    
        let sjoin = `LEFT JOIN FPRV ON FPRV.PRVSEQ=FDOC.PRVSEQ`;
    
        let sWhere = `
            WHERE 
            ( 
                mid(DNUM,1,2)='RA' OR 
                mid(DNUM,1,2)='1B' OR 
                mid(DNUM,1,2)='1C' OR 
                mid(DNUM,1,2)='1D' OR 
                mid(DNUM,1,2)='1E'  OR 
                mid(DNUM,1,2)='1F'
                
            )  AND  
                (DCANCELADA=0 AND mid(DREFER,1,5)<>'CANCE') 

          
            `;
    
    
        let resp = await table(sTable, aColumns, sjoin,sWhere,'Proscai', req, false)

        
    
        res.status(200).send(resp);
        
    } catch (error) {
        console.log(error)

        res.status(500).json({ 
            ok: false,
            msg:'Revisar logs'
        })
    }




}

controller.productosEntradas = async  (req , res) =>{

    try {

        let sTable = 'FAXINV';

        let aColumns = [
            'ICOD', 
            'IEAN', 
            'I2DESCR', 
            'AICANT as AICANTF',
            'DNUM', 
            'if(PRVNOM is NULL,"TRASPASO", PRVNOM) AS PRVNOM', 
            'DREFER', 
            'DATE_FORMAT(DFECHA,"%Y-%m-%d") as DFECHA'
        ];
    
        let sjoin = `
        LEFT JOIN FDOC ON FDOC.DSEQ=FAXINV.DSEQ
        LEFT JOIN FINV ON FINV.ISEQ=FAXINV.ISEQ
        LEFT JOIN FINV2 ON FINV2.I2KEY=FINV.ISEQ
        LEFT JOIN FPRV ON FPRV.PRVSEQ=FDOC.PRVSEQ`;
    
        let sWhere = ` 
            WHERE
            (mid(DNUM,1,2)='RA' OR mid(DNUM,1,2)='1B' OR 
            mid(DNUM,1,2)='1C' OR mid(DNUM,1,2)='1D' OR 
            mid(DNUM,1,2)='1E' OR mid(DNUM,1,2)='1F'  ) AND 
            DCANCELADA=0 AND mid(DREFER,1,5)<>'CANCE'`;
    
    
        let resp = await table(sTable, aColumns, sjoin,sWhere,'Proscai', req, false)
    
        res.status(200).send(resp);
        
    } catch (error) {

        console.log(error)

        res.status(500).json({ 
            ok: false,
            msg:'Revisar logs'
        })
        
    }




}


module.exports = controller;