const assert = require("node:assert/strict");
const db = require("../config/db");

const API_URL = process.env.TEST_API_URL || "http://127.0.0.1:4000/api";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "TestUser1234*";

const login = async (email) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: TEST_PASSWORD }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login failed for ${email}: ${data.error}`);
  return data.token;
};

const getCalendar = async (token) => {
  const res = await fetch(`${API_URL}/calendar/events`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  return { status: res.status, data };
};

const run = async () => {
  console.log("Starting Unified Activity Calendar Security & Aggregation Tests...");

  // 1. Unauthenticated request should be blocked (401)
  console.log("1. Verifying unauthenticated access is denied (401)...");
  const unauthRes = await fetch(`${API_URL}/calendar/events`);
  assert.equal(unauthRes.status, 401, "Calendar endpoint must require authentication");
  console.log("   -> Passed: 401 Unauthorized returned.");

  // 2. Student Role Calendar
  console.log("2. Verifying Student calendar scoping (test.student@smartcommunity.local)...");
  const studentToken = await login("test.student@smartcommunity.local");
  const studentCal = await getCalendar(studentToken);
  assert.equal(studentCal.status, 200, "Student calendar fetch should return 200");
  assert.ok(Array.isArray(studentCal.data.events), "Events must be an array");
  assert.equal(studentCal.data.timezone, "Asia/Phnom_Penh", "Timezone must be Asia/Phnom_Penh");
  
  // Verify student events belong to student
  const studentEventTypes = new Set(studentCal.data.events.map((e) => e.sourceType));
  console.log(`   -> Student has ${studentCal.data.total} events covering types:`, Array.from(studentEventTypes));
  assert.ok(studentEventTypes.has("mentorship"), "Student should have mentorship events");
  assert.ok(studentEventTypes.has("learning_session"), "Student should have live class events");
  assert.ok(studentEventTypes.has("interview"), "Student should have interview event");

  // 3. Mentor Role Calendar
  console.log("3. Verifying Mentor calendar scoping (test.mentor@smartcommunity.local)...");
  const mentorToken = await login("test.mentor@smartcommunity.local");
  const mentorCal = await getCalendar(mentorToken);
  assert.equal(mentorCal.status, 200, "Mentor calendar fetch should return 200");
  assert.equal(mentorCal.data.timezone, "Asia/Phnom_Penh");
  
  // Verify mentor cannot see recruiter's candidate interviews
  const mentorInterviewEvents = mentorCal.data.events.filter((e) => e.sourceType === "interview");
  assert.equal(mentorInterviewEvents.length, 0, "Mentor must NOT see private recruiter interviews");
  console.log("   -> Passed: Mentor isolated from recruiter interviews.");

  // 4. Recruiter Role Calendar
  console.log("4. Verifying Recruiter calendar scoping (test.recruiter@smartcommunity.local)...");
  const recruiterToken = await login("test.recruiter@smartcommunity.local");
  const recruiterCal = await getCalendar(recruiterToken);
  assert.equal(recruiterCal.status, 200, "Recruiter calendar fetch should return 200");
  
  // Recruiter only sees interviews for their own jobs
  assert.ok(
    recruiterCal.data.events.every((e) => e.sourceType === "interview"),
    "Recruiter should only see interviews scoped to their listings"
  );
  console.log("   -> Passed: Recruiter strictly scoped to company candidate interviews.");

  // 5. Deduplication verification
  console.log("5. Testing deduplication: creating second session for same mentorship booking...");
  const [[studentUser]] = await db.query("SELECT id FROM users WHERE email = 'test.student@smartcommunity.local'");
  const [[mentorUser]] = await db.query("SELECT id FROM users WHERE email = 'test.mentor@smartcommunity.local'");
  const [[mentorship]] = await db.query(
    "SELECT id FROM mentorships WHERE mentor_id = ? AND student_id = ? ORDER BY id ASC LIMIT 1",
    [mentorUser.id, studentUser.id]
  );

  // Insert a second session for this same mentorship booking
  const [insertExtra] = await db.query(
    `INSERT INTO mentorship_sessions (mentorship_id, scheduled_time, duration_minutes, meeting_link, topic, status)
     VALUES (?, DATE_ADD(NOW(), INTERVAL 10 DAY), 45, 'https://meet.jit.si/extra-test-session', 'Follow-up Session', 'scheduled')`,
    [mentorship.id]
  );
  const extraSessionId = insertExtra.insertId;

  // Re-fetch mentor calendar
  const mentorCal2 = await getCalendar(mentorToken);
  // Verify all distinct scheduled session occurrences for the booking appear on the calendar
  const bookingEvents = mentorCal2.data.events.filter((e) => e.sourceId === mentorship.id);
  assert.equal(bookingEvents.length, 2, "Mentorship booking with 2 distinct sessions must return both scheduled occurrences");
  const sessionIds = bookingEvents.map((e) => e.sessionId);
  assert.equal(new Set(sessionIds).size, 2, "Session occurrences must have unique session IDs without duplicates");
  console.log("   -> Passed: Multi-occurrence verified. Both distinct sessions appear with unique session IDs.");

  // Clean up extra session
  await db.query("DELETE FROM mentorship_sessions WHERE id = ?", [extraSessionId]);

  console.log("\nAll Unified Activity Calendar tests PASSED successfully!");
};

run()
  .catch((err) => {
    console.error("Calendar test suite failed:", err);
    process.exitCode = 1;
  })
  .finally(() => db.end());
