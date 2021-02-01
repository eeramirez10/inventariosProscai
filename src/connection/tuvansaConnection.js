const mysql = require('mysql');
const util = require('util');

let connection = mysql.createConnection({
    host: 'tuvansa-server.dyndns.org',
    user: 'erick',
    password: 'Ag7348pp**',
    database: 'tuvansa'
});

let query = util.promisify(connection.query).bind(connection);

module.exports = query;