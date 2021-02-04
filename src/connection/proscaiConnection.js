const mysql = require('mysql');
const util = require('util');

const connection = mysql.createConnection({
    host: 'tuvansa.dyndns.org',
    user: 'consultas',
    password: 'consultas',
    database: 'tuvansa'
});

const query = util.promisify(connection.query).bind(connection);


module.exports = query;