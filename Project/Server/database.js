// database.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'admin', // Assuming 'root' is your MySQL user
    password: 'alphabrainsdb', // alphabrainsdb for PC 
    database: 'samplegenerator',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
