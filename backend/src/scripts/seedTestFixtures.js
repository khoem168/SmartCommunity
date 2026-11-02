const db = require("../config/db");
const { hashPassword } = require("../utils/auth");

const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "TestUser1234*";

const run = async () => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    console.log("Seeding isolated test fixtures for V5...");

    const passwordHash = await hashPassword(TEST_PASSWORD);

    // 1. Seed Student: test.student@smartcommunity.local
    await connection.query(
      `INSERT INTO users (email, password_hash, full_name, role, is_verified, is_active, auth_provider, profession, skills, interested_skills)
       VALUES (?, ?, ?, 'student', 1, 1, 'local', 'Computer Science Student',
               JSON_OBJECT('teach', JSON_ARRAY('HTML', 'CSS'), 'learn', JSON_ARRAY('React', 'Node.js')),
               JSON_ARRAY('React', 'Cloud', 'System Design'))
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         role = 'student',
         is_verified = 1,
         is_active = 1`,
      ["test.student@smartcommunity.local", passwordHash, "Sopheap Chan"]
    );
    const [[studentUser]] = await connection.query(
      "SELECT id FROM users WHERE email = 'test.student@smartcommunity.local'"
    );
    const studentId = studentUser.id;

    // 2. Seed Mentor: test.mentor@smartcommunity.local
    await connection.query(
      `INSERT INTO users (email, password_hash, full_name, role, is_verified, is_active, auth_provider, profession, company, experience_years, bio)
       VALUES (?, ?, ?, 'mentor', 1, 1, 'local', 'Senior Cloud Architect', 'CloudScale Asia', 7, 'Passionate mentor helping young engineers master full-stack and cloud architecture.')
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         role = 'mentor',
         is_verified = 1,
         is_active = 1`,
      ["test.mentor@smartcommunity.local", passwordHash, "Vannak Seng"]
    );
    const [[mentorUser]] = await connection.query(
      "SELECT id FROM users WHERE email = 'test.mentor@smartcommunity.local'"
    );
    const mentorId = mentorUser.id;

    // Approved Mentor Application
    await connection.query(
      `INSERT INTO mentor_applications (user_id, professional_title, company, expertise, experience_years, motivation, availability, status)
       VALUES (?, 'Senior Cloud Architect', 'CloudScale Asia', '["Cloud Architecture", "React", "Node.js"]', 7, 'Helping Cambodian students grow tech careers', 'Mon-Fri 2:00 PM - 6:00 PM ICT', 'approved')
       ON DUPLICATE KEY UPDATE status = 'approved'`,
      [mentorId]
    );

    // 3. Seed Recruiter: test.recruiter@smartcommunity.local
    await connection.query(
      `INSERT INTO users (email, password_hash, full_name, role, is_verified, is_active, auth_provider, profession, company)
       VALUES (?, ?, ?, 'recruiter', 1, 1, 'local', 'Technical Talent Lead', 'Angkor Tech Ventures')
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         role = 'recruiter',
         is_verified = 1,
         is_active = 1`,
      ["test.recruiter@smartcommunity.local", passwordHash, "Bopha Pich"]
    );
    const [[recruiterUser]] = await connection.query(
      "SELECT id FROM users WHERE email = 'test.recruiter@smartcommunity.local'"
    );
    const recruiterId = recruiterUser.id;

    // Verified Company Profile
    await connection.query(
      `INSERT INTO company_profiles (owner_id, name, description, industry, website, contact_email, location, is_verified, verification_status)
       VALUES (?, 'Angkor Tech Ventures', 'Fast growing digital venture builder based in Phnom Penh.', 'Information Technology', 'https://angkortech.example.com', 'careers@angkortech.example.com', 'Phnom Penh, Cambodia', 1, 'verified')
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         is_verified = 1,
         verification_status = 'verified'`,
      [recruiterId]
    );
    const [[companyRow]] = await connection.query(
      "SELECT id FROM company_profiles WHERE owner_id = ?",
      [recruiterId]
    );
    const companyId = companyRow.id;

    // Active Internship
    await connection.query(
      `INSERT INTO internships (posted_by, title, company_profile_id, company, category, location, internship_type, description, requirements, openings, status, application_deadline)
       VALUES (?, 'Full-Stack Developer Intern', ?, 'Angkor Tech Ventures', 'web', 'Phnom Penh (Hybrid)', 'full_time',
               'Join our core product engineering squad to build responsive React and Node.js solutions.',
               JSON_ARRAY('JavaScript', 'React', 'REST APIs', 'Git'), 2, 'open', DATE_ADD(NOW(), INTERVAL 30 DAY))
       ON DUPLICATE KEY UPDATE status = 'open'`,
      [recruiterId, companyId]
    );
    const [[internshipRow]] = await connection.query(
      "SELECT id FROM internships WHERE posted_by = ? ORDER BY id DESC LIMIT 1",
      [recruiterId]
    );
    const internshipId = internshipRow.id;

    // 4. Seed Calendar Activities (Connected between isolated test accounts):
    
    // A. Confirmed Mentorship Booking & Session
    await connection.query(
      `INSERT INTO mentorships (mentor_id, student_id, topic, description, requested_time, duration_minutes, status)
       VALUES (?, ?, 'Cloud Architecture & Microservices', 'Deep dive into scalable backend deployment', DATE_ADD(NOW(), INTERVAL 2 DAY), 60, 'active')
       ON DUPLICATE KEY UPDATE status = 'active'`,
      [mentorId, studentId]
    );
    const [[mentorshipRow]] = await connection.query(
      "SELECT id FROM mentorships WHERE mentor_id = ? AND student_id = ? ORDER BY id DESC LIMIT 1",
      [mentorId, studentId]
    );
    
    // Mentorship Session with meeting link
    const [existingSessions] = await connection.query(
      "SELECT id FROM mentorship_sessions WHERE mentorship_id = ?",
      [mentorshipRow.id]
    );
    if (!existingSessions.length) {
      await connection.query(
        `INSERT INTO mentorship_sessions (mentorship_id, scheduled_time, duration_minutes, meeting_link, topic, status)
         VALUES (?, DATE_ADD(NOW(), INTERVAL 2 DAY), 60, 'https://meet.jit.si/smart-comm-cloud-session', 'Cloud Architecture & Microservices', 'scheduled')`,
        [mentorshipRow.id]
      );
    }

    // B. Pending Mentorship Booking Request
    await connection.query(
      `INSERT INTO mentorships (mentor_id, student_id, topic, description, requested_time, duration_minutes, status)
       VALUES (?, ?, 'Frontend Performance Optimization', 'Review React render cycles and state management', DATE_ADD(NOW(), INTERVAL 4 DAY), 45, 'pending')
       ON DUPLICATE KEY UPDATE status = 'pending'`,
      [mentorId, studentId]
    );

    // C. Live Learning Session hosted by Mentor
    const [existingClasses] = await connection.query(
      "SELECT id FROM learning_sessions WHERE mentor_id = ? AND title LIKE '%Building Resilient Node.js APIs%'",
      [mentorId]
    );
    let classId;
    if (!existingClasses.length) {
      const [insertClass] = await connection.query(
        `INSERT INTO learning_sessions (title, description, category, level, mentor_id, scheduled_time, duration_minutes, max_participants, meeting_link, status)
         VALUES ('Building Resilient Node.js APIs', 'Hands-on live class covering database pooling, error handling, and rate limiting.', 'Backend', 'intermediate', ?, DATE_ADD(NOW(), INTERVAL 3 DAY), 90, 30, 'https://meet.jit.si/smart-comm-live-backend-api', 'scheduled')`,
        [mentorId]
      );
      classId = insertClass.insertId;
    } else {
      classId = existingClasses[0].id;
    }

    // Register student in the live session
    await connection.query(
      `INSERT IGNORE INTO session_participants (session_id, user_id, joined_at, attendance_status)
       VALUES (?, ?, NOW(), 'registered')`,
      [classId, studentId]
    );

    // D. Recruiter Interview with Student
    const [existingApps] = await connection.query(
      "SELECT id FROM internship_applications WHERE internship_id = ? AND student_id = ?",
      [internshipId, studentId]
    );
    if (!existingApps.length) {
      await connection.query(
        `INSERT INTO internship_applications (internship_id, student_id, cover_letter, status, interview_scheduled_at, interview_meeting_link, interview_note, applied_at)
         VALUES (?, ?, 'I am eager to contribute my full-stack skills to Angkor Tech Ventures.', 'shortlisted', DATE_ADD(NOW(), INTERVAL 5 DAY), 'https://meet.jit.si/angkor-tech-interview-sopheap', 'Technical discussion with engineering team', NOW())`,
        [internshipId, studentId]
      );
    } else {
      await connection.query(
        `UPDATE internship_applications
         SET interview_scheduled_at = DATE_ADD(NOW(), INTERVAL 5 DAY),
             interview_meeting_link = 'https://meet.jit.si/angkor-tech-interview-sopheap',
             status = 'shortlisted'
         WHERE id = ?`,
        [existingApps[0].id]
      );
    }

    await connection.commit();
    console.log("Successfully seeded isolated test fixtures:");
    console.log("- Student: test.student@smartcommunity.local (ID: %d)", studentId);
    console.log("- Mentor: test.mentor@smartcommunity.local (ID: %d)", mentorId);
    console.log("- Recruiter: test.recruiter@smartcommunity.local (ID: %d)", recruiterId);
    console.log("All sample activities seeded with real scheduled timestamps and Jitsi links.");
  } catch (err) {
    await connection.rollback();
    console.error("Failed to seed test fixtures:", err);
    process.exitCode = 1;
  } finally {
    connection.release();
    await db.end();
  }
};

run();
