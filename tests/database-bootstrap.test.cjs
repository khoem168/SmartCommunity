const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const { schemaStatements, initializeEmptyDatabase, targetOptions } = require("../backend/src/scripts/bootstrapDb");
const { connectionOptions } = require("../backend/src/config/dbOptions");

const railway = { DB_HOST: "example.proxy.rlwy.net", DB_PORT: "15140", DB_USER: "root", DB_PASSWORD: "fixture", DB_NAME: "railway" };

test("encrypt only when asked, and verify the certificate when a CA is supplied", () => {
  assert.equal(connectionOptions(railway).ssl, undefined);
  assert.equal(connectionOptions({ ...railway, DB_SSL: "false" }).ssl, undefined);
  assert.deepEqual(connectionOptions({ ...railway, DB_SSL: "true" }).ssl, { rejectUnauthorized: false });
  assert.deepEqual(connectionOptions({ ...railway, DB_SSL: "true", DB_SSL_CA: "line1\\nline2" }).ssl, { ca: "line1\nline2", rejectUnauthorized: true });
  assert.deepEqual(connectionOptions({}), { host: "127.0.0.1", user: "root", password: "", database: "final_pro", port: 3306 });
});

test("reject an incomplete target or Railway's private host before connecting", () => {
  assert.equal(targetOptions(railway).port, 15140);
  assert.throws(() => targetOptions({ ...railway, DB_PASSWORD: " " }), /DB_PASSWORD is required/);
  assert.throws(() => targetOptions({ ...railway, DB_HOST: "mysql.railway.internal" }), /private address/);
});

test("extract the full base schema without importing the SQL dump's user data", () => {
  const sql = fs.readFileSync(path.join(__dirname, "../final_pro.sql"), "utf8");
  const statements = schemaStatements(sql);
  const tables = [...sql.matchAll(/^CREATE TABLE `([^`]+)`/gm)].map((match) => match[1]);
  assert.ok(tables.includes("users"));
  assert.ok(tables.includes("skills"));
  for (const table of tables) assert.equal(statements.filter((s) => s.startsWith(`CREATE TABLE \`${table}\``)).length, 1);
  assert.equal(statements.length, (sql.match(/^(?:CREATE TABLE|ALTER TABLE) /gm) || []).length);
  assert.ok(statements.every((s) => !/\b(?:INSERT INTO|DROP TABLE|CREATE DATABASE|GRANT)\b/.test(s)));
});

test("refuse a nonempty database without running any DDL", async () => {
  const queries = [];
  const connection = { query: async (sql) => { queries.push(sql); return [[{ table: "users" }]]; } };
  await assert.rejects(initializeEmptyDatabase(connection, ["CREATE TABLE users (id int)"]), /Database is not empty/);
  assert.deepEqual(queries, ["SHOW FULL TABLES"]);
});

test("stop after an import failure without dropping tables or continuing", async () => {
  const queries = [];
  const connection = { query: async (sql) => {
    queries.push(sql);
    if (sql === "ALTER TABLE users invalid") throw new Error("DDL failed");
    return [[]];
  } };
  await assert.rejects(initializeEmptyDatabase(connection, ["CREATE TABLE users (id int)", "ALTER TABLE users invalid", "CREATE TABLE skipped (id int)"]), /DDL failed/);
  assert.deepEqual(queries, ["SHOW FULL TABLES", "CREATE TABLE users (id int)", "ALTER TABLE users invalid"]);
});
