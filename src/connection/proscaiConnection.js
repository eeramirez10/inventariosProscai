const mysql = require('mysql2');
const util = require('util');


const connection = mysql.createConnection({
    host: process.env.DATABASE_URL2,
    user: process.env.USER2,
    password: process.env.PASSWORD2,
    database: process.env.DB2,
});

connection.connect( err => {

    if( err){
        console.log(err.stack)

        return;
    }
})

const query = util.promisify(connection.query).bind(connection);


module.exports = query;