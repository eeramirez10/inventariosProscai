





const table = async (sTable, aColumns, sjoin, sWhere, DB, req) => {

    const request = req.query;

    let query = DB === 'Tuvansa' ? require('../connection/tuvansaConnection') : require('../connection/proscaiConnection');


    //Paging
    let sLimit = "";
    if (request['length'] && request['length'] != -1) {
        sLimit = ` LIMIT ${request['start']} , ${request['length']}`;
    }

    //Ordering
    let sOrder = "";

    if (request['order']) {
        sOrder = `ORDER BY ${aColumns[request['order'][0]['column']].split(" ")[0]} ${request['order']['0']['dir']}`;
    }
    //Filtering



    if (request['search']['value'] && request['search']['value']) {

        sWhere += sWhere ? ` AND (` : `HAVING (`;

        let busqueda = request['search']['value'].toUpperCase();
        
        for (var i = 0; i < aColumns.length; i++) {
            
            let columnas = aColumns[i].split(" ");
            
            sWhere += `${columnas[columnas.length - 1]} LIKE '%${busqueda}%' OR `;

        }

        sWhere = sWhere.substring(0, sWhere.length - 4);

        sWhere += `)`;

    }

    let sQuery = ` SELECT SQL_CALC_FOUND_ROWS  ${aColumns.join(',')} FROM ${sTable} ${sjoin} ${sWhere} ${sOrder}  ${sLimit} `;


    let rResult = {};
    let rResultFilterTotal = {};
    let aResultFilterTotal = {};
    let iFilteredTotal = {};
    let iTotal = {};

 
    let results = await query(sQuery)
    .catch(err => console.error(err))

    if (!results) return;
    

    rResult = results;

    //Data set length after filtering 

    rResultFilterTotal = await query("SELECT FOUND_ROWS()");
    aResultFilterTotal = rResultFilterTotal;
    iFilteredTotal = aResultFilterTotal[0]['FOUND_ROWS()'];

    //Total data set length 
    sQuery = `SELECT COUNT('*') FROM   ${sTable}`;

    results = await query(sQuery);

  
    iTotal = results[0][`COUNT('*')`];

    //Output
    let output = {};
    let temp = [];

    output.sEcho = parseInt(request['sEcho']);
    output.iTotalRecords = iTotal;
    output.iTotalDisplayRecords = iFilteredTotal;
    output.aaData = [];

    let aRow = rResult;

    for (let i in aRow) {
        for (Field in aRow[i]) {
            if (!aRow[i].hasOwnProperty(Field)) continue;
            temp.push(aRow[i][Field]);
        }
        output.aaData.push(temp);
        temp = [];
    }

    return JSON.stringify(output);




}



module.exports = { table }