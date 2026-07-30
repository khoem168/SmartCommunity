const assert = require("node:assert/strict");
const db = require("../config/db");
const { signToken } = require("../utils/auth");

const API_URL = process.env.TEST_API_URL || "http://127.0.0.1:4000/api";
const stamp = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const email = `course-test-${stamp}@example.test`;
const created = {};

const request = async (
  route,
  { token, method = "GET", body, allowError = false } = {},
) => {
  const response = await fetch(`${API_URL}${route}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok && !allowError) {
    throw new Error(`${method} ${route}: ${payload.error || response.statusText}`);
  }
  return { status: response.status, payload };
};

const run = async () => {
  const courses = await request("/courses");
  assert.ok(courses.payload.courses.length >= 3);
  const course = courses.payload.courses[0];
  assert.ok(course.price > 0);
  assert.ok(course.previewCount >= 1);

  const detail = await request(`/courses/${course.slug}`);
  const preview = detail.payload.course.lessons.find((lesson) => lesson.isPreview);
  const premium = detail.payload.course.lessons.find((lesson) => !lesson.isPreview);
  assert.ok(preview);
  assert.ok(premium);
  assert.equal(premium.isLocked, true);

  const previewResponse = await request(
    `/courses/${course.slug}/lessons/${preview.id}`,
  );
  assert.ok(previewResponse.payload.lesson.videoUrl);
  assert.ok(previewResponse.payload.lesson.pdfUrl);

  const publicPremium = await request(
    `/courses/${course.slug}/lessons/${premium.id}`,
    { allowError: true },
  );
  assert.equal(publicPremium.status, 402);
  assert.equal(publicPremium.payload.code, "COURSE_PAYMENT_REQUIRED");

  const [userResult] = await db.query(
    `INSERT INTO users
       (email, password_hash, full_name, role, is_verified, is_active)
     VALUES (?, 'course-test-not-used', 'Course Module Test', 'student', 1, 1)`,
    [email],
  );
  created.userId = userResult.insertId;
  const token = signToken({ id: created.userId, email, role: "student" });

  const lockedPremium = await request(
    `/courses/${course.slug}/lessons/${premium.id}`,
    { token, allowError: true },
  );
  assert.equal(lockedPremium.status, 402);

  const paymentResponse = await request(
    `/courses/${course.id}/payments/khqr`,
    {
      token,
      method: "POST",
      body: { amount: 0.01, currency: "KHR" },
    },
  );
  const payment = paymentResponse.payload.payment;
  created.paymentId = payment.id;
  assert.equal(payment.status, "pending");
  assert.equal(payment.amount, course.price);
  assert.equal(payment.currency, course.currency);
  assert.ok(payment.qrCode);
  assert.ok(payment.qrMd5);

  await db.query(
    `UPDATE course_payments
     SET status = 'paid', paid_at = NOW(), transaction_id = ?
     WHERE id = ?`,
    [`course-test-${stamp}`, created.paymentId],
  );
  const [enrollmentResult] = await db.query(
    `INSERT INTO course_enrollments (user_id, course_id, payment_id)
     VALUES (?, ?, ?)`,
    [created.userId, course.id, created.paymentId],
  );
  created.enrollmentId = enrollmentResult.insertId;

  const unlocked = await request(
    `/courses/${course.slug}/lessons/${premium.id}`,
    { token },
  );
  assert.ok(unlocked.payload.lesson.videoUrl);
  assert.ok(unlocked.payload.lesson.pdfUrl);

  console.log(
    "Course E2E passed: live catalog, free preview, premium lock, server-controlled KHQR amount, and paid enrollment access.",
  );
};

run()
  .catch((error) => {
    console.error("Course E2E failed:", error.stack || error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (created.enrollmentId) {
      await db.query("DELETE FROM course_enrollments WHERE id = ?", [
        created.enrollmentId,
      ]);
    }
    if (created.paymentId) {
      await db.query("DELETE FROM course_payments WHERE id = ?", [
        created.paymentId,
      ]);
    }
    if (created.userId) {
      await db.query("DELETE FROM users WHERE id = ?", [created.userId]);
    }
    await db.end();
  });
