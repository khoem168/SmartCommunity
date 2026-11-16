// Copies every table (structure and rows) from one hosted database to a new,
// empty one, for example when moving Railway to a region closer to users.
//
//   node backend/src/scripts/copyDb.js --from backend/.env.railway --to backend/.env.railway-sea          (preview)
//   node backend/src/scripts/copyDb.js --from backend/.env.railway --to backend/.env.railway-sea --apply
//
// The source is only read. The target must contain no tables; nothing is
// dropped or overwritten. Row counts are compared at the end.
const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const { targetOptions } = require("./bootstrapDb");

const BATCH = 500;

const argValue = (args, flag) => {
  const index = args.indexOf(flag);
  const value = index >= 0 ? args[index + 1] : "";
  if (!value || value.startsWith("--")) throw new Error(`${flag} <env file> is required.`);
  return value;
};

const readTarget = (file) => targetOptions(dotenv.parse(fs.readFileSync(path.resolve(file))));

const sameServer = (a, b) =>
  a.host === b.host && Number(a.port) === Number(b.port) && a.database === b.database;

const listTables = async (connection) => {
  const [rows] = await connection.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
  return rows.map((row) => Object.values(row)[0]);
};

const copyTable = async (source, target, table) => {
  const [[create]] = await source.query(`SHOW CREATE TABLE \`${table}\``);
  await target.query(create["Create Table"]);
  let copied = 0;
  for (let offset = 0; ; offset += BATCH) {
    const [rows] = await source.query(`SELECT * FROM \`${table}\` LIMIT ? OFFSET ?`, [BATCH, offset]);
    if (!rows.length) break;
    const columns = Object.keys(rows[0]);
    await target.query(
      `INSERT INTO \`${table}\` (${columns.map((c) => `\`${c}\``).join(", ")}) VALUES ?`,
      [rows.map((row) => columns.map((c) => row[c]))],
    );
    copied += rows.length;
    if (rows.length < BATCH) break;
  }
  return copied;
};

const run = async (args = process.argv.slice(2)) => {
  const fromOptions = readTarget(argValue(args, "--from"));
  const toOptions = readTarget(argValue(args, "--to"));
  if (sameServer(fromOptions, toOptions)) throw new Error("--from and --to point to the same database.");

  const source = await mysql.createConnection(fromOptions);
  const target = await mysql.createConnection(toOptions);
  try {
    const tables = await listTables(source);
    const existing = await listTables(target);
    if (existing.length) {
      throw new Error(`Target already has ${existing.length} tables. No changes made; use a new, empty database.`);
    }
    if (!args.includes("--apply")) {
      console.log(`Preview: would copy ${tables.length} tables from ${fromOptions.host} to ${toOptions.host}. Add --apply to copy.`);
      return;
    }

    // Tables reference each other; check the keys once, after every row is in.
    await target.query("SET FOREIGN_KEY_CHECKS = 0");
    await target.query("SET SESSION sql_mode = 'NO_AUTO_VALUE_ON_ZERO'");
    const counts = {};
    for (const table of tables) {
      counts[table] = await copyTable(source, target, table);
      console.log(`  ${table}: ${counts[table]} rows`);
    }
    await target.query("SET FOREIGN_KEY_CHECKS = 1");

    const mismatched = [];
    for (const table of tables) {
      const [[s]] = await source.query(`SELECT COUNT(*) AS n FROM \`${table}\``);
      const [[t]] = await target.query(`SELECT COUNT(*) AS n FROM \`${table}\``);
      if (Number(s.n) !== Number(t.n)) mismatched.push(`${table} (${s.n} vs ${t.n})`);
    }
    if (mismatched.length) throw new Error(`Row counts differ: ${mismatched.join(", ")}`);
    console.log(`Copied ${tables.length} tables; every row count matches the source.`);
  } finally {
    await source.end();
    await target.end();
  }
};

if (require.main === module) {
  run().catch((error) => {
    console.error("Database copy failed:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { sameServer, listTables };
