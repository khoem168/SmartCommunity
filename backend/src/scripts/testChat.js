const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const db = require("../config/db");

const API_URL = process.env.TEST_API_URL || "http://127.0.0.1:4000/api";
const password = "ChatTest123*";
const stamp = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const accounts = [
  { fullName: "Chat Test Alice", email: `chat-alice-${stamp}@example.test` },
  { fullName: "Chat Test Bob", email: `chat-bob-${stamp}@example.test` },
  { fullName: "Chat Test Cara", email: `chat-cara-${stamp}@example.test` },
];
let uploadedFilePath = null;

const request = async (route, { token, body, form, method = "GET" } = {}) => {
  const response = await fetch(`${API_URL}${route}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(form ? {} : { "Content-Type": "application/json" }),
    },
    body: form || (body ? JSON.stringify(body) : undefined),
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
  assert.ok(verificationToken, "Development verification token was not returned.");
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

const run = async () => {
  const [alice, bob, cara] = await Promise.all(accounts.map(createAccount));

  const direct = await request("/messages/conversations", {
    method: "POST",
    token: alice.token,
    body: { userId: bob.id },
  });
  const directForm = new FormData();
  directForm.append("message", "Hello Bob from the Module 8 test.");
  await request(`/messages/conversations/${direct.conversationId}/messages`, {
    method: "POST",
    token: alice.token,
    form: directForm,
  });

  const bobInbox = await request("/messages/conversations", { token: bob.token });
  const bobDirect = bobInbox.conversations.find(
    (conversation) => conversation.id === direct.conversationId,
  );
  assert.ok(bobDirect, "Direct conversation was not listed for the receiver.");
  assert.equal(Number(bobDirect.unreadCount), 1);
  const directMessages = await request(
    `/messages/conversations/${direct.conversationId}`,
    { token: bob.token },
  );
  assert.equal(directMessages.messages[0].text, "Hello Bob from the Module 8 test.");

  const group = await request("/messages/conversations/groups", {
    method: "POST",
    token: alice.token,
    body: {
      name: "Module 8 Test Group",
      description: "Temporary integration test group",
      memberIds: [bob.id, cara.id],
    },
  });
  assert.equal(group.memberCount, 3);

  const groupForm = new FormData();
  groupForm.append("message", "Group document attached.");
  groupForm.append(
    "file",
    new Blob(["Module 8 file sharing test"], { type: "text/plain" }),
    "module-8-test.txt",
  );
  const sent = await request(
    `/messages/conversations/${group.conversationId}/messages`,
    { method: "POST", token: alice.token, form: groupForm },
  );
  assert.equal(sent.message.messageType, "document");
  assert.equal(sent.message.attachmentName, "module-8-test.txt");
  if (sent.message.attachmentUrl?.includes("/uploads/messages/")) {
    const fileName = new URL(sent.message.attachmentUrl).pathname.split("/").pop();
    uploadedFilePath = path.join(__dirname, "..", "..", "uploads", "messages", fileName);
  }

  const caraInbox = await request("/messages/conversations", { token: cara.token });
  const caraGroup = caraInbox.conversations.find(
    (conversation) => conversation.id === group.conversationId,
  );
  assert.equal(caraGroup.type, "group");
  assert.equal(Number(caraGroup.unreadCount), 1);
  const groupMessages = await request(
    `/messages/conversations/${group.conversationId}`,
    { token: cara.token },
  );
  assert.equal(groupMessages.messages[0].attachmentName, "module-8-test.txt");

  const notifications = await request("/notifications", { token: cara.token });
  assert.ok(
    notifications.notifications.some(
      (notification) => notification.type === "message",
    ),
    "Message notification was not created.",
  );

  console.log(
    "Chat E2E passed: direct message, unread tracking, group chat, file sharing, and notifications.",
  );
};

run()
  .catch((error) => {
    console.error("Chat E2E failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.query(
      `DELETE FROM users WHERE email IN (${accounts.map(() => "?").join(",")})`,
      accounts.map((account) => account.email),
    );
    if (uploadedFilePath) {
      await fs.unlink(uploadedFilePath).catch(() => {});
    }
    await db.end();
  });
