const mysql = require('mysql');
const util = require('util');

const dotenv = require('dotenv').config()

let connection = mysql.createConnection({
    host: process.env.DATABASE_URL ,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DB,

});

//connection.changeUser({database: 'pruebas'});



connection.connect( err => {

    if( err){
        console.log(err.stack)

        return;
    }
})



let query = util.promisify(connection.query).bind(connection);

module.exports = query;