require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port : process.env.DB_PORT
});


console.log(process.env.DB_HOST, process.env.DB_USER, process.env.DB_PASSWORD, process.env.DB_DATABASE, process.env.DB_PORT);
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to the database: ", err);
    return;
  }
  console.log("Successfully connected to the database");
  connection.release();
});

module.exports = pool;
