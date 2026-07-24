const assert = require("node:assert/strict");
const db = require("../config/db");

const API_URL = process.env.TEST_API_URL || "http://127.0.0.1:4000/api";
const password = "AnalyticsTest123*";
const stamp = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const account = {
  fullName: "Analytics Test Admin",
  email: `analytics-admin-${stamp}@example.test`,
};

const request = async (route, { token, body, method = "GET", allowError } = {}) => {
  const response = await fetch(`${API_URL}${route}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok && !allowError) {
    throw new Error(`${method} ${route}: ${payload.error || response.statusText}`);
  }
  return { status: response.status, ...payload };
};

const run = async () => {
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

  const forbidden = await request("/admin/analytics?range=30d", {
    token: login.token,
    allowError: true,
  });
  assert.equal(forbidden.status, 403);

  await db.query("UPDATE users SET role = 'admin' WHERE id = ?", [login.user.id]);
  const expectedBuckets = { "7d": 7, "30d": 30, "90d": 90, "12m": 12 };
  for (const [range, bucketCount] of Object.entries(expectedBuckets)) {
    const analytics = await request(`/admin/analytics?range=${range}`, {
      token: login.token,
    });
    assert.equal(analytics.range.key, range);
    assert.equal(analytics.charts.growth.length, bucketCount);
    assert.ok(analytics.summary.totalUsers >= 1);
    assert.ok(Array.isArray(analytics.charts.roles));
    assert.ok(Array.isArray(analytics.charts.popularSkills));
    assert.ok(Array.isArray(analytics.tables.topInternships));
    assert.ok(Array.isArray(analytics.tables.mentorPerformance));
    for (const value of Object.values(analytics.rates)) {
      assert.ok(Number(value) >= 0 && Number(value) <= 100);
    }
  }
  const fallback = await request("/admin/analytics?range=invalid", {
    token: login.token,
  });
  assert.equal(fallback.range.key, "30d");
  console.log(
    "Analytics E2E passed: role authorization, all date ranges, summary metrics, growth buckets, distributions, popular skills, performance tables, and conversion rates.",
  );
};

run()
  .catch((error) => {
    console.error("Analytics E2E failed:", error.stack || error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.query("DELETE FROM users WHERE email = ?", [account.email]);
    await db.end();
  });
