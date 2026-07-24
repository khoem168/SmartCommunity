const assert = require("node:assert/strict");
const db = require("../config/db");

const API_URL = process.env.TEST_API_URL || "http://127.0.0.1:4000/api";
const password = "NotifyTest123*";
const stamp = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const accounts = [
  { fullName: "Notification Sender", email: `notify-sender-${stamp}@example.test` },
  { fullName: "Notification Receiver", email: `notify-receiver-${stamp}@example.test` },
];

const request = async (route, { token, body, method = "GET" } = {}) => {
  const response = await fetch(`${API_URL}${route}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`${method} ${route}: ${payload.error || response.statusText}`);
  }
  return payload;
};

const createAccount = async (account) => {
  const registration = await request("/auth/register", {
    method: "POST",
    body: { ...account, password, role: "student" },
  });
  const verificationToken = new URL(
    registration.devVerificationUrl,
  ).searchParams.get("token");
  await request("/auth/verify-email", {
    method: "POST",
    body: { token: verificationToken },
  });
  const login = await request("/auth/login", {
    method: "POST",
    body: { email: account.email, password },
  });
  return { ...account, id: login.user.id, token: login.token };
};

const createSkillRequest = (sender, receiver) =>
  request("/skill-exchanges", {
    method: "POST",
    token: sender.token,
    body: {
      providerId: receiver.id,
      skillOffered: "React",
      skillRequested: "UI Design",
      message: "Notification integration test",
    },
  });

const run = async () => {
  const [sender, receiver] = await Promise.all(accounts.map(createAccount));

  const initialPreferences = await request("/notification-preferences", {
    token: receiver.token,
  });
  assert.equal(initialPreferences.preferences.skillExchange, true);
  assert.equal(initialPreferences.preferences.pushEnabled, false);

  const disabled = await request("/notification-preferences", {
    method: "PATCH",
    token: receiver.token,
    body: { skillExchange: false },
  });
  assert.equal(disabled.preferences.skillExchange, false);
  await createSkillRequest(sender, receiver);

  let center = await request("/notifications?type=skill_exchange", {
    token: receiver.token,
  });
  assert.equal(center.notifications.length, 0);
  await db.query(
    "DELETE FROM skill_exchanges WHERE requester_id = ? AND provider_id = ?",
    [sender.id, receiver.id],
  );

  await request("/notification-preferences", {
    method: "PATCH",
    token: receiver.token,
    body: { skillExchange: true },
  });
  const exchange = await createSkillRequest(sender, receiver);
  center = await request("/notifications?type=skill_exchange&unreadOnly=true", {
    token: receiver.token,
  });
  assert.equal(center.notifications.length, 1);
  assert.equal(center.stats.unread, 1);
  assert.equal(center.notifications[0].metadata.exchangeId, exchange.exchange.id);

  await request(`/notifications/${center.notifications[0].id}/read`, {
    method: "PATCH",
    token: receiver.token,
  });
  center = await request("/notifications?type=skill_exchange", {
    token: receiver.token,
  });
  assert.equal(center.stats.unread, 0);

  const fakePushToken = `firebase-test-token-${stamp}-0123456789`;
  await request("/notification-push-token", {
    method: "POST",
    token: receiver.token,
    body: { token: fakePushToken },
  });
  let preferences = await request("/notification-preferences", {
    token: receiver.token,
  });
  assert.equal(preferences.preferences.pushEnabled, true);
  await request("/notification-push-token", {
    method: "DELETE",
    token: receiver.token,
    body: { token: fakePushToken },
  });
  preferences = await request("/notification-preferences", {
    token: receiver.token,
  });
  assert.equal(preferences.preferences.pushEnabled, false);

  const cleared = await request("/notifications/read", {
    method: "DELETE",
    token: receiver.token,
  });
  assert.equal(cleared.deleted, 1);
  console.log(
    "Notification E2E passed: preferences, event delivery, category filtering, unread stats, read/delete actions, and Firebase token registration.",
  );
};

run()
  .catch((error) => {
    console.error("Notification E2E failed:", error.stack || error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.query(
      `DELETE FROM users WHERE email IN (${accounts.map(() => "?").join(",")})`,
      accounts.map((account) => account.email),
    );
    await db.end();
  });
