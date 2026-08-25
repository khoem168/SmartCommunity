const mysql = require("mysql2/promise");
require("dotenv").config();

const {
  DB_HOST = "127.0.0.1",
  DB_USER = "root",
  DB_PASSWORD = "",
  DB_NAME = "final_pro",
  DB_PORT = "3306",
  DB_SSL_CA = "",
} = process.env;

// Hosted databases such as Aiven expose a TLS-only endpoint. Keep SSL
// optional so the same configuration continues to work with local Docker.
const sslCa = String(DB_SSL_CA).replace(/\\n/g, "\n").trim();

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: Number(DB_PORT),
  ...(sslCa
    ? {
        ssl: {
          ca: sslCa,
          rejectUnauthorized: true,
        },
      }
    : {}),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
