const mysql = require('mysql');
const util = require('util');

const connection = mysql.createConnection({
    host: 'tuvansa.dyndns.org',
    user: 'consultas',
    password: 'consultas',
    database: 'tuvansa'
});

connection.connect( err => {

    if( err){
        console.log(err.stack)

        return;
    }
})

const query = util.promisify(connection.query).bind(connection);


module.exports = query;