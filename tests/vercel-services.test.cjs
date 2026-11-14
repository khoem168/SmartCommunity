const assert = require("node:assert/strict");
const { once } = require("node:events");
const { after, before, test } = require("node:test");
const { createRequire } = require("node:module");

// These smoke tests do not query a database or send external notifications.
process.env.NODE_ENV = "test";
process.env.TELEGRAM_BOT_TOKEN = "";
process.env.TELEGRAM_CHAT_ID = "";

const backend = require("../backend/src/server");
const telegram = require("../telegram_bot/server");
const db = require("../backend/src/config/db");
const frontendRequire = createRequire(require.resolve("../frontend_user/package.json"));
const { io } = frontendRequire("socket.io-client");
let telegramServer;
let apiOrigin;
let telegramOrigin;

before(async () => {
  assert.equal(backend.listening, false, "Import must not start a standalone listener");
  backend.listen(0, "127.0.0.1");
  await once(backend, "listening");
  apiOrigin = `http://127.0.0.1:${backend.address().port}`;
  telegramServer = telegram.listen(0, "127.0.0.1");
  await once(telegramServer, "listening");
  telegramOrigin = `http://127.0.0.1:${telegramServer.address().port}`;
});

after(async () => {
  backend.closeAllConnections();
  telegramServer?.closeAllConnections();
  await Promise.all([
    new Promise((resolve) => backend.close(resolve)),
    new Promise((resolve) => telegramServer ? telegramServer.close(resolve) : resolve()),
    db.end(),
  ]);
});

test("backend serves health from the exported HTTP server", async () => {
  const response = await fetch(`${apiOrigin}/health`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).service, "smart-community-api");
});

test("API keeps its public prefix and rejects unauthenticated requests", async () => {
  const response = await fetch(`${apiOrigin}/api/auth/me`);
  assert.equal(response.status, 401);
  assert.match(response.headers.get("content-type"), /application\/json/);
});

test("unknown API paths return JSON 404 instead of the website", async () => {
  const response = await fetch(`${apiOrigin}/api/route-that-does-not-exist`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error, "Route not found.");
});

test("exported server handles Socket.IO upgrades and enforces authentication", async () => {
  const socket = io(apiOrigin, {
    transports: ["websocket"],
    reconnection: false,
    autoConnect: false,
  });
  try {
    const error = new Promise((resolve, reject) => {
      socket.once("connect_error", resolve);
      socket.once("connect", () => reject(new Error("Unauthenticated socket connected")));
    });
    socket.connect();
    const result = await error;
    assert.equal(result.message, "Authentication required.");
  } finally {
    socket.disconnect();
  }
});

test("unused Telegram service starts without secrets and cannot send alerts", async () => {
  const health = await fetch(telegramOrigin);
  assert.equal(health.status, 200);
  const response = await fetch(`${telegramOrigin}/alert/payment-success`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: "12.00", orderId: "smoke-test" }),
  });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "Telegram alerts are not configured");
});
