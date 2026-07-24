const assert = require("node:assert/strict");
const db = require("../config/db");

const API_URL = process.env.TEST_API_URL || "http://127.0.0.1:4000/api";
const password = "AdminModuleTest123*";
const stamp = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const accounts = {
  admin: {
    fullName: "Module Admin Test",
    email: `module-admin-${stamp}@example.test`,
    role: "student",
  },
  member: {
    fullName: "Module Member Test",
    email: `module-member-${stamp}@example.test`,
    role: "student",
  },
};
const created = {};

const request = async (
  route,
  { token, body, method = "GET", allowError = false, text = false } = {},
) => {
  const response = await fetch(`${API_URL}${route}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = text
    ? await response.text()
    : await response.json().catch(() => ({}));
  if (!response.ok && !allowError) {
    throw new Error(
      `${method} ${route}: ${payload.error || payload || response.statusText}`,
    );
  }
  return { status: response.status, payload, headers: response.headers };
};

const registerAndLogin = async (account) => {
  const registration = await request("/auth/register", {
    method: "POST",
    body: { ...account, password },
  });
  const verificationToken = new URL(
    registration.payload.devVerificationUrl,
  ).searchParams.get("token");
  await request("/auth/verify-email", {
    method: "POST",
    body: { token: verificationToken },
  });
  const login = await request("/auth/login", {
    method: "POST",
    body: { email: account.email, password },
  });
  return login.payload;
};

const run = async () => {
  const adminLogin = await registerAndLogin(accounts.admin);
  const memberLogin = await registerAndLogin(accounts.member);
  created.adminId = adminLogin.user.id;
  created.memberId = memberLogin.user.id;

  const forbidden = await request("/admin/dashboard", {
    token: memberLogin.token,
    allowError: true,
  });
  assert.equal(forbidden.status, 403);

  await db.query("UPDATE users SET role = 'admin' WHERE id = ?", [created.adminId]);
  const dashboard = await request("/admin/dashboard", { token: adminLogin.token });
  assert.ok(dashboard.payload.summary.users >= 2);
  assert.ok(Array.isArray(dashboard.payload.recentActions));

  const listed = await request(
    `/admin/users?q=${encodeURIComponent(accounts.member.email)}`,
    { token: adminLogin.token },
  );
  assert.equal(listed.payload.users.length, 1);
  assert.equal(listed.payload.users[0].id, created.memberId);

  await request(`/admin/users/${created.memberId}`, {
    method: "PATCH",
    token: adminLogin.token,
    body: {
      isActive: false,
      suspensionReason: "Automated administrator module validation.",
    },
  });
  const suspendedAccess = await request("/auth/me", {
    token: memberLogin.token,
    allowError: true,
  });
  assert.equal(suspendedAccess.status, 401);
  await request(`/admin/users/${created.memberId}`, {
    method: "PATCH",
    token: adminLogin.token,
    body: { isActive: true },
  });

  const selfSuspend = await request(`/admin/users/${created.adminId}`, {
    method: "PATCH",
    token: adminLogin.token,
    body: { isActive: false, suspensionReason: "Must be rejected." },
    allowError: true,
  });
  assert.equal(selfSuspend.status, 400);

  const [mentorResult] = await db.query(
    `INSERT INTO mentor_applications
       (user_id, professional_title, company, expertise, experience_years,
        motivation, availability)
     VALUES (?, 'Frontend Mentor', 'Test Studio', 'React, JavaScript', 4,
             'I want to support new developers.', 'Weekends')`,
    [created.memberId],
  );
  created.mentorApplicationId = mentorResult.insertId;
  await request(`/admin/mentor-applications/${created.mentorApplicationId}`, {
    method: "PATCH",
    token: adminLogin.token,
    body: { status: "approved" },
  });
  const [[approvedMentor]] = await db.query(
    `SELECT ma.status, u.role
     FROM mentor_applications ma JOIN users u ON u.id = ma.user_id
     WHERE ma.id = ?`,
    [created.mentorApplicationId],
  );
  assert.equal(approvedMentor.status, "approved");
  assert.equal(approvedMentor.role, "mentor");

  const [companyResult] = await db.query(
    `INSERT INTO company_profiles
       (owner_id, name, industry, contact_email, location)
     VALUES (?, ?, 'Technology', ?, 'Phnom Penh')`,
    [created.memberId, `Admin Test Company ${stamp}`, accounts.member.email],
  );
  created.companyId = companyResult.insertId;
  await request(`/admin/companies/${created.companyId}`, {
    method: "PATCH",
    token: adminLogin.token,
    body: { status: "verified" },
  });
  const [[verifiedCompany]] = await db.query(
    "SELECT verification_status, is_verified FROM company_profiles WHERE id = ?",
    [created.companyId],
  );
  assert.equal(verifiedCompany.verification_status, "verified");
  assert.equal(verifiedCompany.is_verified, 1);

  const [internshipResult] = await db.query(
    `INSERT INTO internships
       (company_profile_id, title, category, company, description, location,
        posted_by, application_deadline, status)
     VALUES (?, 'Admin Module Internship', 'Software', ?, 'Test posting',
             'Remote', ?, DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'open')`,
    [created.companyId, `Admin Test Company ${stamp}`, created.memberId],
  );
  created.internshipId = internshipResult.insertId;
  await request(`/admin/internships/${created.internshipId}`, {
    method: "PATCH",
    token: adminLogin.token,
    body: { status: "closed" },
  });
  const [[closedInternship]] = await db.query(
    "SELECT status FROM internships WHERE id = ?",
    [created.internshipId],
  );
  assert.equal(closedInternship.status, "closed");

  const mentors = await request("/admin/mentor-applications?status=approved", {
    token: adminLogin.token,
  });
  assert.ok(
    mentors.payload.applications.some(
      (application) => application.id === created.mentorApplicationId,
    ),
  );
  const companies = await request(
    `/admin/companies?q=${encodeURIComponent(`Admin Test Company ${stamp}`)}`,
    { token: adminLogin.token },
  );
  assert.equal(companies.payload.companies[0].verificationStatus, "verified");
  const internships = await request(
    "/admin/internships?q=Admin%20Module%20Internship",
    { token: adminLogin.token },
  );
  assert.equal(internships.payload.internships[0].status, "closed");

  const userReport = await request("/admin/reports/users.csv", {
    token: adminLogin.token,
    text: true,
  });
  assert.match(userReport.headers.get("content-type"), /text\/csv/);
  assert.match(userReport.payload, new RegExp(accounts.member.email));

  const audit = await request("/admin/audit-logs?limit=100", {
    token: adminLogin.token,
  });
  const testActions = audit.payload.logs.filter(
    (entry) => entry.adminEmail === accounts.admin.email,
  );
  assert.ok(testActions.length >= 6);
  assert.ok(testActions.some((entry) => entry.action === "admin.user.update"));
  assert.ok(testActions.some((entry) => entry.action === "admin.mentor.approved"));
  assert.ok(testActions.some((entry) => entry.action === "admin.company.verified"));
  assert.ok(testActions.some((entry) => entry.action === "admin.report.export"));

  console.log(
    "Admin E2E passed: role protection, dashboard, user suspension/restoration, self-protection, mentor and company approval, internship moderation, CSV reporting, and audit logging.",
  );
};

run()
  .catch((error) => {
    console.error("Admin E2E failed:", error.stack || error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (created.internshipId) {
      await db.query("DELETE FROM internships WHERE id = ?", [created.internshipId]);
    }
    if (created.companyId) {
      await db.query("DELETE FROM company_profiles WHERE id = ?", [created.companyId]);
    }
    if (created.mentorApplicationId) {
      await db.query("DELETE FROM mentor_applications WHERE id = ?", [
        created.mentorApplicationId,
      ]);
    }
    await db.query("DELETE FROM users WHERE email IN (?, ?)", [
      accounts.admin.email,
      accounts.member.email,
    ]);
    await db.end();
  });
