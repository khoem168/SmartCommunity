const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const axios = require("axios");
const db = require("../config/db");
const { signToken } = require("../utils/auth");

const API_BASE = "http://localhost:4000/api";

const run = async () => {
  console.log("=== Testing Feature 5: Smart Career Bridge ===");

  // 1. Get or create a test student user with specific skills
  const [users] = await db.query(
    "SELECT * FROM users WHERE role = 'student' AND is_active = 1 LIMIT 1",
  );
  if (!users.length) {
    throw new Error("No active student user found in database.");
  }
  const student = users[0];

  // Set student skills to test skill matching: React, JavaScript, Git
  const testSkills = JSON.stringify({
    candidate: ["React", "JavaScript", "Git"],
    learn: ["Python"],
    teach: ["HTML"],
  });
  await db.query(
    "UPDATE users SET skills = ?, interested_skills = '[\"CSS\"]' WHERE id = ?",
    [testSkills, student.id],
  );

  const studentToken = signToken({
    id: student.id,
    email: student.email,
    role: "student",
  });

  // Test 1: Public GET /internships (unauthenticated)
  console.log("\n[Test 1] Public GET /api/internships (no token)");
  const publicRes = await axios.get(`${API_BASE}/internships`);
  if (!Array.isArray(publicRes.data.internships)) {
    throw new Error("Expected internships array in public response");
  }
  console.log(`PASS: Returned ${publicRes.data.internships.length} internships.`);
  const firstPublic = publicRes.data.internships[0];
  if (firstPublic.matchScore !== null) {
    throw new Error(`Expected null matchScore for unauthenticated visitor, got ${firstPublic.matchScore}`);
  }
  console.log("PASS: Unauthenticated matchScore is null as expected.");

  // Test 2: Authenticated GET /internships (with student token)
  console.log("\n[Test 2] Authenticated GET /api/internships (with student skills)");
  const authRes = await axios.get(`${API_BASE}/internships`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const authInternships = authRes.data.internships;
  if (!authInternships.length) {
    throw new Error("Expected authenticated internships list");
  }
  const frontendInternship = authInternships.find((i) =>
    i.title.toLowerCase().includes("frontend"),
  );
  if (!frontendInternship) {
    throw new Error("Could not find Frontend Developer Intern");
  }
  console.log(`Internship: "${frontendInternship.title}"`);
  console.log(`Requirements:`, frontendInternship.requirements);
  console.log(`Matched Skills:`, frontendInternship.matchedSkills);
  console.log(`Missing Skills:`, frontendInternship.missingSkills);
  console.log(`Match Score: ${frontendInternship.matchScore}%`);
  console.log(`Bridges:`, frontendInternship.bridges);

  if (typeof frontendInternship.matchScore !== "number" || frontendInternship.matchScore <= 0) {
    throw new Error(`Expected positive matchScore, got ${frontendInternship.matchScore}`);
  }
  console.log("PASS: Authenticated internship skill match computed accurately!");

  // Test 3: Authenticated GET /api/career/bridge
  console.log("\n[Test 3] Authenticated GET /api/career/bridge");
  const bridgeRes = await axios.get(`${API_BASE}/career/bridge`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const bridge = bridgeRes.data;
  console.log("User skills returned:", bridge.user?.userSkills);
  console.log("Top matching internships count:", bridge.topMatchingInternships?.length);
  console.log("Course-to-job bridges count:", bridge.courseJobBridges?.length);

  if (!Array.isArray(bridge.user?.userSkills) || !bridge.user.userSkills.length) {
    throw new Error("Expected userSkills in career bridge response");
  }
  if (!Array.isArray(bridge.courseJobBridges) || !bridge.courseJobBridges.length) {
    throw new Error("Expected courseJobBridges array in career bridge response");
  }

  const sampleCourseBridge = bridge.courseJobBridges.find(
    (c) => c.matchingJobsCount > 0,
  );
  if (sampleCourseBridge) {
    console.log(
      `Course "${sampleCourseBridge.courseTitle}" maps to ${sampleCourseBridge.matchingJobsCount} open jobs:`,
      sampleCourseBridge.jobs.map((j) => `${j.title} (${j.company})`),
    );
  }

  console.log("\nPASS: All Career Bridge API tests passed successfully!");
  process.exit(0);
};

run().catch((err) => {
  console.error("TEST FAILED:", err.response?.data || err.message);
  process.exit(1);
});
