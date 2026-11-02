const mysql = require("mysql2/promise");
require("dotenv").config();

const {
  DB_HOST = "127.0.0.1",
  DB_USER = "root",
  DB_PASSWORD = "",
  DB_PORT = "3306",
  DB_SOURCE = "final_pro",
  DB_TARGET = "final_pro_test",
} = process.env;

async function initTestDatabase() {
  console.log(`Cloning schema from ${DB_SOURCE} to ${DB_TARGET}...`);
  const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: Number(DB_PORT),
    multipleStatements: true,
  });

  try {
    // 1. Ensure target test database exists
    await pool.query(`CREATE DATABASE IF NOT EXISTS \`${DB_TARGET}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);

    // 2. Disable foreign key checks
    await pool.query("SET FOREIGN_KEY_CHECKS = 0;");

    // 3. Get all tables from source
    const [tables] = await pool.query(`SHOW TABLES IN \`${DB_SOURCE}\`;`);
    console.log(`Found ${tables.length} tables in ${DB_SOURCE}.`);

    for (const row of tables) {
      const tableName = Object.values(row)[0];
      const [[createRow]] = await pool.query(`SHOW CREATE TABLE \`${DB_SOURCE}\`.\`${tableName}\``);
      const createSql = createRow["Create Table"];

      // Drop in test database and recreate
      await pool.query(`DROP TABLE IF EXISTS \`${DB_TARGET}\`.\`${tableName}\`;`);
      await pool.query(`USE \`${DB_TARGET}\`;\n${createSql};`);
    }

    // 4. Re-enable foreign key checks
    await pool.query("SET FOREIGN_KEY_CHECKS = 1;");

    const [testTables] = await pool.query(`SHOW TABLES IN \`${DB_TARGET}\`;`);
    console.log(`Successfully created ${testTables.length} tables in ${DB_TARGET}!`);
    console.log("Dedicated test database is ready and isolated.");
  } catch (err) {
    console.error("Failed to initialize test database:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initTestDatabase();
