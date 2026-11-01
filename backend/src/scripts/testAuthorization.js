const assert = require("node:assert/strict");
const db = require("../config/db");

const API_URL = process.env.TEST_API_URL || "http://127.0.0.1:4000/api";
const password = "SecTest1236*";
const stamp = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const request = async (
  route,
  { token, body, method = "GET", allowError = false } = {},
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
    throw new Error(
      `${method} ${route} returned ${response.status}: ${payload.error || response.statusText}`,
    );
  }
  return { status: response.status, payload };
};

const run = async () => {
  console.log("Starting Authorization & Security Tests...");

  // 1. Create a Student User
  const studentEmail = `student-${stamp}@test.local`;
  const studentReg = await request("/auth/register", {
    method: "POST",
    body: {
      fullName: "Test Student",
      email: studentEmail,
      password,
      role: "student",
    },
  });
  assert.equal(studentReg.status, 201, "Student registration should succeed");

  // Activate directly if needed
  await db.query("UPDATE users SET is_verified = 1 WHERE email = ?", [studentEmail]);
  const studentLogin = await request("/auth/login", {
    method: "POST",
    body: { email: studentEmail, password },
  });
  const studentToken = studentLogin.payload.token;
  assert.ok(studentToken, "Student login token must exist");

  // 2. Test: Student cannot post an internship (Must return 403)
  console.log("Checking Student -> POST /internships...");
  const studentPostJob = await request("/internships", {
    method: "POST",
    token: studentToken,
    body: { title: "Malicious Job", description: "Hacking", requirements: ["Skill"] },
    allowError: true,
  });
  assert.equal(studentPostJob.status, 403, "Student must be forbidden from posting internships");
  console.log("PASS: Student blocked from POST /internships (403)");

  // 3. Test: Student cannot create a learning session (Must return 403)
  console.log("Checking Student -> POST /learning-sessions...");
  const studentCreateSession = await request("/learning-sessions", {
    method: "POST",
    token: studentToken,
    body: { title: "Malicious Class", scheduledTime: new Date(Date.now() + 86400000).toISOString() },
    allowError: true,
  });
  assert.equal(studentCreateSession.status, 403, "Student must be forbidden from creating learning sessions");
  console.log("PASS: Student blocked from POST /learning-sessions (403)");

  // 4. Test: Recruiter Registration auto-creates pending company profile
  console.log("Checking Recruiter Registration & Company Profile auto-creation...");
  const recruiterEmail = `recruiter-${stamp}@test.local`;
  const recruiterReg = await request("/auth/register", {
    method: "POST",
    body: {
      fullName: "Test Recruiter",
      email: recruiterEmail,
      password,
      role: "recruiter",
      recruiterCompany: "Acme Cybernetics",
      jobTitle: "Talent Acquisition",
    },
  });
  assert.equal(recruiterReg.status, 201, "Recruiter registration should succeed");

  await db.query("UPDATE users SET is_verified = 1 WHERE email = ?", [recruiterEmail]);
  const recruiterLogin = await request("/auth/login", {
    method: "POST",
    body: { email: recruiterEmail, password },
  });
  const recruiterToken = recruiterLogin.payload.token;
  assert.ok(recruiterToken, "Recruiter login token must exist");

  const [companyRows] = await db.query(
    "SELECT * FROM company_profiles WHERE owner_id = ?",
    [recruiterLogin.payload.user.id],
  );
  assert.equal(companyRows.length, 1, "Company profile must be auto-created");
  assert.equal(companyRows[0].name, "Acme Cybernetics");
  assert.equal(companyRows[0].verification_status, "pending");
  assert.equal(companyRows[0].is_verified, 0);
  console.log("PASS: Recruiter company profile initialized with verification_status = 'pending'");

  // 5. Test: Unverified Recruiter cannot post internship (Must return 403 COMPANY_NOT_VERIFIED)
  console.log("Checking Unverified Recruiter -> POST /internships...");
  const unverifiedPostJob = await request("/internships", {
    method: "POST",
    token: recruiterToken,
    body: {
      title: "Junior Security Analyst",
      description: "Great opportunity to grow in cybersecurity",
      requirements: ["Linux", "Networking"],
      internshipType: "full_time",
    },
    allowError: true,
  });
  assert.equal(unverifiedPostJob.status, 403, "Unverified recruiter must receive 403");
  assert.equal(unverifiedPostJob.payload.code, "COMPANY_NOT_VERIFIED");
  console.log("PASS: Unverified recruiter blocked from posting internships (403 COMPANY_NOT_VERIFIED)");

  // 6. Test: Once company is verified by Admin, Recruiter CAN post internship
  console.log("Verifying company and checking POST /internships...");
  await db.query(
    "UPDATE company_profiles SET verification_status = 'verified', is_verified = 1 WHERE owner_id = ?",
    [recruiterLogin.payload.user.id],
  );

  const verifiedPostJob = await request("/internships", {
    method: "POST",
    token: recruiterToken,
    body: {
      title: "Junior Security Analyst",
      description: "Great opportunity to grow in cybersecurity",
      requirements: ["Linux", "Networking"],
      internshipType: "full_time",
    },
  });
  assert.equal(verifiedPostJob.status, 201, "Verified recruiter should successfully post internship");
  const createdInternshipId = verifiedPostJob.payload.internship.id;
  assert.ok(createdInternshipId, "Internship ID must be returned");
  console.log("PASS: Verified recruiter successfully published internship #", createdInternshipId);

  // 7. Test: Role-Adaptive Dashboard
  console.log("Testing Role-Adaptive /api/dashboard payload...");
  const studentDash = await request("/dashboard", { token: studentToken });
  assert.equal(studentDash.payload.role, "student", "Student dashboard must identify as student");
  assert.ok(Array.isArray(studentDash.payload.courses), "Student dashboard must contain courses array");

  const recruiterDash = await request("/dashboard", { token: recruiterToken });
  assert.equal(recruiterDash.payload.role, "recruiter", "Recruiter dashboard must identify as recruiter");
  assert.ok(recruiterDash.payload.company, "Recruiter dashboard must contain company data");
  assert.equal(recruiterDash.payload.company.isVerified, true);
  assert.ok(Array.isArray(recruiterDash.payload.myInternships), "Recruiter dashboard must contain myInternships array");
  console.log("PASS: Role-adaptive dashboard verified for Student and Recruiter!");

  // 8. Test: Student Application Privacy (Private recruiter notes must NEVER be exposed to student)
  console.log("Testing Student Application Data Sanitization & Privacy...");
  const [appInsert] = await db.query(
    `INSERT INTO internship_applications 
     (internship_id, student_id, cover_letter, resume_url, status, admin_notes)
     VALUES (?, ?, 'Cover letter test', 'http://cv.test/cv.pdf', 'pending', 'SECRET INTERNAL RECRUITER NOTE: Candidate needs test')`,
    [createdInternshipId, studentLogin.payload.user.id],
  );
  const applicationId = appInsert.insertId;

  const studentApps = await request("/internship-applications", { token: studentToken });
  assert.equal(studentApps.payload.view, "student");
  const studentAppItem = studentApps.payload.applications.find((a) => a.id === applicationId);
  assert.ok(studentAppItem, "Student must see own application");
  assert.equal(
    studentAppItem.recruiterNotes,
    undefined,
    "CRITICAL PRIVACY: Student MUST NOT receive internal recruiter notes",
  );
  console.log("PASS: Internal recruiter notes successfully stripped from student response!");

  // 9. Test: Recruiter updates status & schedules interview
  console.log("Testing Recruiter updates status & schedules interview...");
  const interviewTime = new Date(Date.now() + 172800000).toISOString();
  const updateResp = await request(`/internship-applications/${applicationId}/status`, {
    method: "PATCH",
    token: recruiterToken,
    body: {
      status: "shortlisted",
      recruiterNotes: "Candidate shortlisted for technical round",
      interviewScheduledAt: interviewTime,
      interviewMeetingLink: "https://meet.jit.si/interview-smart-community",
    },
  });
  assert.equal(updateResp.status, 200, "Recruiter must be able to update application status");

  const studentUpdatedApps = await request("/internship-applications", { token: studentToken });
  const updatedItem = studentUpdatedApps.payload.applications.find((a) => a.id === applicationId);
  assert.equal(updatedItem.status, "shortlisted", "Status must update to shortlisted");
  assert.ok(updatedItem.interviewScheduledAt, "Student must receive interview date");
  assert.equal(updatedItem.recruiterNotes, undefined, "Recruiter note must remain strictly confidential");
  console.log("PASS: Recruiter scheduled interview and status updated securely!");

  // 10. Test: Recruiter B cannot update or access Recruiter A's candidate applications
  console.log("Testing Object-Level Access: Recruiter B cannot update Recruiter A's application...");
  const recruiterBEmail = `recruiterB-${stamp}@test.local`;
  await request("/auth/register", {
    method: "POST",
    body: { fullName: "Recruiter B", email: recruiterBEmail, password, role: "recruiter" },
  });
  await db.query("UPDATE users SET is_verified = 1 WHERE email = ?", [recruiterBEmail]);
  const recruiterBLogin = await request("/auth/login", {
    method: "POST",
    body: { email: recruiterBEmail, password },
  });
  const recruiterBToken = recruiterBLogin.payload.token;

  const unauthorizedUpdate = await request(`/internship-applications/${applicationId}/status`, {
    method: "PATCH",
    token: recruiterBToken,
    body: { status: "rejected" },
    allowError: true,
  });
  assert.equal(
    unauthorizedUpdate.status,
    404,
    "Recruiter B must receive 404/Forbidden when trying to update another company's applicant",
  );
  console.log("PASS: Recruiter B blocked by Object-Level Authorization (404/Forbidden)!");

  // Cleanup test records
  console.log("Cleaning up test accounts...");
  await db.query("DELETE FROM internship_applications WHERE internship_id = ?", [createdInternshipId]);
  await db.query("DELETE FROM internships WHERE id = ?", [createdInternshipId]);
  await db.query("DELETE FROM company_profiles WHERE owner_id IN (?, ?)", [
    recruiterLogin.payload.user.id,
    recruiterBLogin.payload.user.id,
  ]);
  await db.query("DELETE FROM users WHERE id IN (?, ?, ?)", [
    studentLogin.payload.user.id,
    recruiterLogin.payload.user.id,
    recruiterBLogin.payload.user.id,
  ]);

  console.log("ALL 10 AUTHORIZATION, PRIVACY & SECURITY TESTS PASSED SUCCESSFULLY! (10/10)");

};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("TEST FAILED:", err);
    process.exit(1);
  });
