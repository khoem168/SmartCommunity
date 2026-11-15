const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const { connectionOptions } = require("../config/dbOptions");

const projectRoot = path.resolve(__dirname, "../../..");

// The checked-in dump uses one CREATE/ALTER statement per semicolon-terminated
// block. Copy only its DDL; never import demo users, passwords or activity rows.
const schemaStatements = (sql) => {
  const statements = sql.match(/^(?:CREATE TABLE|ALTER TABLE) `[^`]+`[^;]*;/gm) || [];
  const expected = (sql.match(/^(?:CREATE TABLE|ALTER TABLE) /gm) || []).length;
  if (!statements.length || statements.length !== expected) {
    throw new Error("The base SQL layout changed; review the schema before importing.");
  }
  return statements;
};

const initializeEmptyDatabase = async (connection, statements) => {
  const [tables] = await connection.query("SHOW FULL TABLES");
  if (tables.length) {
    throw new Error("Database is not empty. No changes made; use migrations for an existing database.");
  }
  // DDL commits individually in MySQL. On failure, inspect the partial schema
  // rather than deleting it automatically or retrying against existing tables.
  for (const statement of statements) await connection.query(statement);
};

const targetOptions = (target) => {
  for (const key of ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"]) {
    if (!target[key]?.trim()) throw new Error(`${key} is required in the target environment file.`);
  }
  // Railway's MYSQLHOST resolves only inside Railway; this script and Vercel
  // must go through the public TCP proxy instead.
  if (/\.railway\.internal$/i.test(target.DB_HOST.trim())) {
    throw new Error("DB_HOST is Railway's private address. Use the host and port from MYSQL_PUBLIC_URL.");
  }
  return { ...connectionOptions(target), connectTimeout: 15000 };
};

const run = async (args = process.argv.slice(2)) => {
  const statements = schemaStatements(fs.readFileSync(path.join(projectRoot, "final_pro.sql"), "utf8"));
  if (!args.includes("--apply")) {
    console.log(`Preview: ${statements.length} schema statements; no demo accounts or data will be imported.`);
    console.log("To initialize a new empty database: node backend/src/scripts/bootstrapDb.js --env-file backend/.env.railway --apply");
    return;
  }
  const envIndex = args.indexOf("--env-file");
  if (envIndex < 0 || !args[envIndex + 1] || args[envIndex + 1].startsWith("--")) {
    throw new Error("An explicit --env-file is required; local backend/.env is never used as the target.");
  }
  const target = dotenv.parse(fs.readFileSync(path.resolve(args[envIndex + 1])));
  const connection = await mysql.createConnection(targetOptions(target));
  try {
    const [[server]] = await connection.query("SELECT VERSION() AS version");
    const [[tls]] = await connection.query("SHOW SESSION STATUS LIKE 'Ssl_cipher'");
    console.log(`Connected to ${server.version}; connection encrypted: ${tls?.Value ? "yes" : "no"}.`);
    await initializeEmptyDatabase(connection, statements);
    console.log("Base schema initialized. Applying current migrations and course catalog...");
  } finally {
    await connection.end();
  }
  const result = spawnSync(process.execPath, [path.join(__dirname, "migrateDb.js")], {
    cwd: path.join(projectRoot, "backend"),
    // Blank values still count as set, so the child's dotenv cannot fill the
    // TLS settings in from the local backend/.env.
    env: { ...process.env, ...target, DB_SSL: target.DB_SSL || "", DB_SSL_CA: target.DB_SSL_CA || "" },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error("Migration failed. Inspect the database before retrying; it will not be reset automatically.");
  console.log("Hosted database initialization completed.");
};

if (require.main === module) {
  run().catch((error) => {
    console.error("Database initialization failed:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { schemaStatements, initializeEmptyDatabase, targetOptions };
