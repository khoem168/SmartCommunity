const assert = require("node:assert/strict");
const db = require("../config/db");

const API_URL = process.env.TEST_API_URL || "http://127.0.0.1:4000/api";
const password = "SessionTest123*";
const stamp = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const accounts = [
  { fullName: "Session Test Host", email: `session-host-${stamp}@example.test` },
  { fullName: "Session Test Student", email: `session-student-${stamp}@example.test` },
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

const localDateTime = (date) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

const run = async () => {
  const [host, student] = await Promise.all(accounts.map(createAccount));
  await db.query("UPDATE users SET role = 'mentor' WHERE id = ?", [host.id]);

  const scheduledTime = localDateTime(new Date(Date.now() + 10 * 60 * 1000));
  const registrationDeadline = localDateTime(
    new Date(Date.now() + 5 * 60 * 1000),
  );
  const created = await request("/learning-sessions", {
    method: "POST",
    token: host.token,
    body: {
      title: "Module 9 Integration Workshop",
      description: "Temporary Jitsi and attendance validation.",
      category: "Programming",
      level: "beginner",
      scheduledTime,
      registrationDeadline,
      durationMinutes: 60,
      maxParticipants: 20,
      materials: [
        { label: "Workshop notes", url: "https://example.com/session-notes" },
      ],
    },
  });
  assert.ok(created.sessionId);

  const upcoming = await request("/learning-sessions?scope=upcoming", {
    token: student.token,
  });
  const listed = upcoming.sessions.find(
    (session) => session.id === created.sessionId,
  );
  assert.equal(listed.meetingProvider, "jitsi");
  assert.equal(listed.isRegistered, false);

  await request(`/learning-sessions/${created.sessionId}/register`, {
    method: "POST",
    token: student.token,
  });
  const mySessions = await request("/learning-sessions?scope=my", {
    token: student.token,
  });
  assert.ok(
    mySessions.sessions.some(
      (session) => session.id === created.sessionId && session.isRegistered,
    ),
  );

  let attendance = await request(
    `/learning-sessions/${created.sessionId}/participants`,
    { token: host.token },
  );
  assert.equal(attendance.participants[0].attendanceStatus, "registered");

  const studentJoin = await request(
    `/learning-sessions/${created.sessionId}/attendance/join`,
    { method: "POST", token: student.token },
  );
  assert.match(studentJoin.meetingLink, /^https:\/\/meet\.jit\.si\//);
  assert.equal(studentJoin.provider, "jitsi");
  await request(`/learning-sessions/${created.sessionId}/attendance/join`, {
    method: "POST",
    token: host.token,
  });
  await request(`/learning-sessions/${created.sessionId}/attendance/leave`, {
    method: "POST",
    token: student.token,
  });

  await request(`/learning-sessions/${created.sessionId}/status`, {
    method: "PATCH",
    token: host.token,
    body: { status: "completed" },
  });
  await request(`/learning-sessions/${created.sessionId}/feedback`, {
    method: "POST",
    token: student.token,
    body: { rating: 5, feedback: "Clear and useful workshop." },
  });

  attendance = await request(
    `/learning-sessions/${created.sessionId}/participants`,
    { token: host.token },
  );
  assert.equal(attendance.participants[0].attendanceStatus, "attended");
  assert.equal(attendance.participants[0].rating, 5);

  const notifications = await request("/notifications", { token: host.token });
  assert.ok(
    notifications.notifications.some(
      (notification) => notification.type === "session",
    ),
  );
  console.log(
    "Learning session E2E passed: scheduling, registration, Jitsi joining, attendance, completion, feedback, and notifications.",
  );
};

run()
  .catch((error) => {
    console.error("Learning session E2E failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.query(
      `DELETE FROM users WHERE email IN (${accounts.map(() => "?").join(",")})`,
      accounts.map((account) => account.email),
    );
    await db.end();
  });
