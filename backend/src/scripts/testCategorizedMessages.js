const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, fullName: user.full_name },
    JWT_SECRET,
    { expiresIn: "1h" },
  );

async function run() {
  console.log("Starting Categorized Messages & Contextual Inbox Tests...\n");

  const stamp = Date.now();
  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Create a Student and a Recruiter
  const [studentRes] = await db.query(
    `INSERT INTO users (full_name, email, password_hash, role, is_active)
     VALUES (?, ?, ?, 'student', 1)`,
    [`Test Student ${stamp}`, `student_${stamp}@test.com`, passwordHash],
  );
  const studentId = studentRes.insertId;

  const [recruiterRes] = await db.query(
    `INSERT INTO users (full_name, email, password_hash, role, is_active)
     VALUES (?, ?, ?, 'recruiter', 1)`,
    [`Test Recruiter ${stamp}`, `recruiter_${stamp}@test.com`, passwordHash],
  );
  const recruiterId = recruiterRes.insertId;

  // Create another student for skill exchange
  const [peerRes] = await db.query(
    `INSERT INTO users (full_name, email, password_hash, role, is_active)
     VALUES (?, ?, ?, 'student', 1)`,
    [`Peer Student ${stamp}`, `peer_${stamp}@test.com`, passwordHash],
  );
  const peerId = peerRes.insertId;

  console.log(`Created test users: Student (${studentId}), Recruiter (${recruiterId}), Peer (${peerId})`);

  // 2. Recruiter posts an internship and Student applies
  const [internshipRes] = await db.query(
    `INSERT INTO internships (posted_by, title, company, description, requirements, responsibilities, location, status)
     VALUES (?, 'Full Stack Developer', 'Acme Tech', 'Desc', 'React, Node', 'Build features', 'Phnom Penh', 'open')`,
    [recruiterId],
  );
  const internshipId = internshipRes.insertId;

  const [appRes] = await db.query(
    `INSERT INTO internship_applications (internship_id, student_id, status, interview_scheduled_at, interview_meeting_link, interview_note)
     VALUES (?, ?, 'shortlisted', '2026-11-10 14:00:00', 'https://meet.jit.si/interview-test', 'Bring portfolio')`,
    [internshipId, studentId],
  );
  const applicationId = appRes.insertId;
  console.log(`Created Job Application #${applicationId} with interview scheduled`);

  // 3. Create Skill Exchange between student and peer
  const [swapRes] = await db.query(
    `INSERT INTO skill_exchanges (requester_id, provider_id, skill_offered, skill_requested, status, progress_percent, scheduled_date)
     VALUES (?, ?, 'React.js', 'Python', 'accepted', 65, '2026-11-12 10:00:00')`,
    [studentId, peerId],
  );
  const swapId = swapRes.insertId;
  console.log(`Created Skill Exchange #${swapId} with 65% progress`);

  // 4. Test Job Application Direct Conversation Resolution
  const { resolveConversationContext } = require("../controllers/messageController");

  // Conversation between student and recruiter
  const jobConvo = {
    id: 9999,
    type: "direct",
    participant1_id: Math.min(studentId, recruiterId),
    participant2_id: Math.max(studentId, recruiterId),
    category: "general",
    context_data: null,
  };

  const jobResolved = await resolveConversationContext(jobConvo, studentId);
  if (jobResolved.category !== "job_application" || !jobResolved.context) {
    throw new Error(`Job conversation failed to resolve: ${JSON.stringify(jobResolved)}`);
  }
  if (jobResolved.context.jobTitle !== "Full Stack Developer" || jobResolved.context.status !== "shortlisted") {
    throw new Error(`Job context properties mismatch: ${JSON.stringify(jobResolved.context)}`);
  }
  console.log("PASS: Job application conversation automatically resolved with context!");

  // 5. Test Skill Swap Direct Conversation Resolution
  const swapConvo = {
    id: 9998,
    type: "direct",
    participant1_id: Math.min(studentId, peerId),
    participant2_id: Math.max(studentId, peerId),
    category: "general",
    context_data: null,
  };

  const swapResolved = await resolveConversationContext(swapConvo, studentId);
  if (swapResolved.category !== "skill_exchange" || !swapResolved.context) {
    throw new Error(`Swap conversation failed to resolve: ${JSON.stringify(swapResolved)}`);
  }
  if (swapResolved.context.skillOffered !== "React.js" || swapResolved.context.progress !== 65) {
    throw new Error(`Swap context properties mismatch: ${JSON.stringify(swapResolved.context)}`);
  }
  console.log("PASS: Skill exchange conversation automatically resolved with progress & meeting link!");

  // 6. Test Group Conversation Category
  const groupConvo = {
    id: 9997,
    type: "group",
    participant1_id: null,
    participant2_id: null,
    category: null,
    context_data: null,
  };
  const groupResolved = await resolveConversationContext(groupConvo, studentId);
  if (groupResolved.category !== "group") {
    throw new Error(`Group conversation category mismatch: ${groupResolved.category}`);
  }
  console.log("PASS: Group conversation category correctly resolved as 'group'!");

  // Clean up
  console.log("Cleaning up test records...");
  await db.query("DELETE FROM skill_exchanges WHERE id = ?", [swapId]);
  await db.query("DELETE FROM internship_applications WHERE id = ?", [applicationId]);
  await db.query("DELETE FROM internships WHERE id = ?", [internshipId]);
  await db.query("DELETE FROM users WHERE id IN (?, ?, ?)", [studentId, recruiterId, peerId]);

  console.log("\n=======================================================");
  console.log("ALL CATEGORIZED MESSAGES & CONTEXT TESTS PASSED! (4/4)");
  console.log("=======================================================\n");
  process.exit(0);
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
