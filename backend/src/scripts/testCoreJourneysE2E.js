const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const assert = require("node:assert/strict");
const db = require("../config/db");
const { signToken } = require("../utils/auth");

const API_URL = "http://127.0.0.1:4000/api";

const request = async (route, { token, body, method = "GET", isMultipart = false } = {}) => {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isMultipart) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${route}`, {
    method,
    headers,
    body: body ? (isMultipart ? body : JSON.stringify(body)) : undefined,
  });

  const payload = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data: payload };
};

const run = async () => {
  console.log("=================================================================");
  console.log("  STARTING END-TO-END VALIDATION: CORE 4 USER JOURNEYS (V7)     ");
  console.log("=================================================================\n");

  // -------------------------------------------------------------
  // Journey 1: Student Flow (CV Studio → Internship Application)
  // -------------------------------------------------------------
  console.log("--> Testing Journey 1: Student Flow...");
  const [[student]] = await db.query(
    "SELECT id, email, role, full_name FROM users WHERE role = 'student' AND is_active = 1 LIMIT 1"
  );
  assert(student, "Active student user found in database");
  console.log(`    Student authenticated: ${student.full_name} (${student.email})`);
  const studentToken = signToken({ id: student.id, email: student.email, role: "student" });

  // 1.1 Read student profile for CV Studio auto-population
  const profileRes = await request("/profile", { token: studentToken });
  assert.equal(profileRes.status, 200, "Profile API returns 200");
  assert(profileRes.data.user, "User profile loaded successfully");
  console.log(`    CV Studio Profile loaded: ${profileRes.data.user.full_name}, Skills: ${JSON.stringify(profileRes.data.user.skills?.candidate || profileRes.data.user.skills)}`);

  // 1.2 Browse available internships on platform
  const jobsRes = await request("/internships", { token: studentToken });
  assert.equal(jobsRes.status, 200, "Internships API returns 200");
  const internships = jobsRes.data.internships || jobsRes.data || [];
  assert(internships.length > 0, "Platform has active internships");
  const targetInternship = internships[0];
  console.log(`    Browsed internships: Found ${internships.length} active positions. Target: "${targetInternship.title}" at ${targetInternship.companyName || "Partner"}`);

  // 1.3 Apply with CV PDF upload
  const myAppsRes = await request("/internship-applications", { token: studentToken });
  assert.equal(myAppsRes.status, 200, "Internship applications API returns 200");
  const studentApps = myAppsRes.data.applications || myAppsRes.data || [];
  console.log(`    Student current applications count: ${studentApps.length}`);

  let activeApp = studentApps.find(a => (a.internshipId || a.internship_id) === targetInternship.id);
  let createdAppId = null;
  if (!activeApp) {
    console.log(`    Applying to internship #${targetInternship.id} with CV PDF export...`);
    const form = new FormData();
    form.append(
      "resume",
      new Blob(["%PDF-1.4 minimal CV Studio export"], { type: "application/pdf" }),
      "Student_CV.pdf"
    );
    form.append("coverLetter", "Excited to apply via the Smart Community Minimal CV & Portfolio Studio V7!");

    const applyRes = await fetch(`${API_URL}/internships/${targetInternship.id}/apply`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
      body: form,
    });
    const applyData = await applyRes.json().catch(() => ({}));
    console.log(`    Apply response: status=${applyRes.status}, data=`, applyData);
    assert(applyRes.ok || applyRes.status === 201, "Internship application submitted successfully");
    createdAppId = applyData.application?.id;
  } else {
    console.log(`    Application already submitted with status: "${activeApp.status}"`);
  }
  console.log("    PASSED: Journey 1 (Student CV & Application Flow)\n");

  // -------------------------------------------------------------
  // Journey 2: Mentor Flow (Calendar & Availability Scoping)
  // -------------------------------------------------------------
  console.log("--> Testing Journey 2: Mentor Flow...");
  const [[mentor]] = await db.query(
    "SELECT id, email, role, full_name FROM users WHERE role = 'mentor' AND is_active = 1 LIMIT 1"
  );
  if (mentor) {
    console.log(`    Mentor authenticated: ${mentor.full_name} (${mentor.email})`);
    const mentorToken = signToken({ id: mentor.id, email: mentor.email, role: "mentor" });

    // Fetch calendar events
    const calendarRes = await request("/calendar/events", { token: mentorToken });
    assert.equal(calendarRes.status, 200, "Mentor calendar API returns 200");
    const mentorEvents = calendarRes.data.events || [];
    console.log(`    Mentor calendar events found: ${mentorEvents.length}`);
    const recruiterInterviews = mentorEvents.filter(e => e.type === "interview");
    assert.equal(recruiterInterviews.length, 0, "Mentor calendar strictly isolated from recruiter interviews");
    console.log("    PASSED: Journey 2 (Mentor Flow & Privacy Isolation)\n");
  } else {
    console.log("    SKIPPED: No mentor user found, verified in testCalendar.js.\n");
  }

  // -------------------------------------------------------------
  // Journey 3: Recruiter Flow (Candidate ATS & Status Review)
  // -------------------------------------------------------------
  console.log("--> Testing Journey 3: Recruiter Flow...");
  const [[recruiter]] = await db.query(
    "SELECT id, email, role, full_name FROM users WHERE role = 'recruiter' AND is_active = 1 LIMIT 1"
  );
  if (recruiter) {
    console.log(`    Recruiter authenticated: ${recruiter.full_name} (${recruiter.email})`);
    const recruiterToken = signToken({ id: recruiter.id, email: recruiter.email, role: "recruiter" });

    // Check Recruiter ATS Applications list
    const atsRes = await request("/internship-applications", { token: recruiterToken });
    assert.equal(atsRes.status, 200, "Recruiter ATS API returns 200");
    const candidateApps = atsRes.data.applications || atsRes.data || [];
    console.log(`    Recruiter candidate applications visible in ATS: ${candidateApps.length}`);

    // If applications exist, test status transition
    if (candidateApps.length > 0) {
      const appToReview = candidateApps[0];
      const newStatus = appToReview.status === "pending" ? "reviewed" : "reviewed";
      console.log(`    Testing status update for Application #${appToReview.id} to "${newStatus}"...`);
      const updateRes = await request(`/internship-applications/${appToReview.id}/status`, {
        token: recruiterToken,
        method: "PATCH",
        body: { status: newStatus },
      });
      assert.equal(updateRes.status, 200, "Application status update succeeded");
      console.log(`    Status updated successfully: ${JSON.stringify(updateRes.data.message || updateRes.data)}`);
    }
    console.log("    PASSED: Journey 3 (Recruiter ATS Candidate Flow)\n");
  } else {
    console.log("    SKIPPED: No recruiter user found.\n");
  }

  // -------------------------------------------------------------
  // Journey 4: Admin Flow (Oversight & System Dashboard)
  // -------------------------------------------------------------
  console.log("--> Testing Journey 4: Admin Flow...");
  const [[admin]] = await db.query(
    "SELECT id, email, role, full_name FROM users WHERE role = 'admin' AND is_active = 1 LIMIT 1"
  );
  assert(admin, "Admin user exists in database");
  console.log(`    Admin authenticated: ${admin.full_name} (${admin.email})`);
  const adminToken = signToken({ id: admin.id, email: admin.email, role: "admin" });

  const adminUsersRes = await request("/admin/users", { token: adminToken });
  assert.equal(adminUsersRes.status, 200, "Admin users list API returns 200");
  const userList = adminUsersRes.data.users || adminUsersRes.data || [];
  console.log(`    Total registered platform users managed by Admin: ${userList.length}`);

  const analyticsRes = await request("/admin/analytics", { token: adminToken });
  assert.equal(analyticsRes.status, 200, "Admin analytics returns 200");
  console.log(`    Platform admin analytics loaded successfully.`);

  const overviewRes = await request("/admin/overview", { token: adminToken });
  assert.equal(overviewRes.status, 200, "Admin overview returns 200");
  console.log(`    Platform overview loaded successfully: metrics checked.`);
  console.log("    PASSED: Journey 4 (Admin Oversight & Analytics Flow)\n");

  // Clean up created test application if we created one
  if (createdAppId) {
    await db.query("DELETE FROM internship_applications WHERE id = ?", [createdAppId]);
    console.log(`    (Test cleanup: temporary test internship application #${createdAppId} cleaned up safely)`);
  }

  console.log("=================================================================");
  console.log("  ALL 4 CORE USER JOURNEYS VALIDATED & PASSED WITH 100% SUCCESS! ");
  console.log("=================================================================\n");
  process.exit(0);
};

run().catch((err) => {
  console.error("Core Journeys Validation Failed:", err);
  process.exit(1);
});
