// database.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // Assuming 'root' is your MySQL user
    password: 'Localdbpass1!', // Localdbpass1! for PC mysql   
    database: 'maindb', //maindb on  pc
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
