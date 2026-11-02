const db = require("../config/db");
const { createNotification } = require("../services/notificationDeliveryService");

const parseSkills = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const countTable = async (table, where = "1 = 1") => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS total FROM ${table} WHERE ${where}`,
  );
  return rows[0].total;
};

const getMeetingLink = (exchangeId) =>
  `https://meet.jit.si/smart-community-skill-exchange-${exchangeId}`;

const createConversationForUsers = async (leftUserId, rightUserId, context = null) => {
  const participant1 = Math.min(leftUserId, rightUserId);
  const participant2 = Math.max(leftUserId, rightUserId);

  const contextData = context ? JSON.stringify(context) : null;
  const contextId = context?.exchangeId ? Number(context.exchangeId) : null;

  const [result] = await db.query(
    `INSERT INTO conversations (type, participant1_id, participant2_id, category, context_id, context_data, last_message, last_message_time)
     VALUES ('direct', ?, ?, 'skill_exchange', ?, ?, 'Skill exchange accepted. Chat and meeting are ready.', CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE
       id = LAST_INSERT_ID(id),
       category = 'skill_exchange',
       context_id = COALESCE(VALUES(context_id), context_id),
       context_data = COALESCE(VALUES(context_data), context_data),
       last_message = VALUES(last_message),
       last_message_time = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP`,
    [participant1, participant2, contextId, contextData],
  );

  await db.query(
    `INSERT IGNORE INTO conversation_members (conversation_id, user_id, role)
     VALUES (?, ?, 'member'), (?, ?, 'member')`,
    [result.insertId, participant1, result.insertId, participant2],
  );

  return result.insertId;
};

const toMysqlDateTime = (value) => {
  if (!value) return null;
  const localDateTime = String(value).match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?$/,
  );
  if (localDateTime) {
    return `${localDateTime[1]} ${localDateTime[2]}:${localDateTime[3] || "00"}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 19).replace("T", " ");
};

const getStats = async (req, res, next) => {
  try {
    const [users, mentors, courses, internships, exchanges] = await Promise.all([
      countTable("users", "is_active = 1"),
      countTable("users", "role = 'mentor' AND is_active = 1"),
      countTable("courses", "is_published = 1"),
      countTable("internships", "status = 'open'"),
      countTable("skill_exchanges", "status IN ('pending', 'accepted')"),
    ]);

    return res.json({
      users,
      mentors,
      courses,
      jobs: internships,
      skillExchanges: exchanges,
    });
  } catch (err) {
    return next(err);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role || "student";

    // 1. Recruiter Workspace Data
    if (role === "recruiter") {
      const [
        [companies],
        [myInternships],
        [pipelineRows],
        [recentApplicants],
        [notifications],
      ] = await Promise.all([
        db.query("SELECT * FROM company_profiles WHERE owner_id = ?", [userId]),
        db.query(
          `SELECT i.id, i.title, i.category, i.status, i.openings,
                  i.application_deadline, i.created_at,
                  COUNT(ia.id) AS applicants_count
           FROM internships i
           LEFT JOIN internship_applications ia ON ia.internship_id = i.id
           WHERE i.posted_by = ?
           GROUP BY i.id
           ORDER BY i.created_at DESC LIMIT 5`,
          [userId],
        ),
        db.query(
          `SELECT ia.status, COUNT(*) AS count
           FROM internship_applications ia
           JOIN internships i ON i.id = ia.internship_id
           WHERE i.posted_by = ?
           GROUP BY ia.status`,
          [userId],
        ),
        db.query(
          `SELECT ia.id, ia.status, ia.applied_at, ia.resume_url,
                  i.title AS internship_title,
                  student.full_name AS student_name, student.email AS student_email,
                  student.avatar_url AS student_avatar
           FROM internship_applications ia
           JOIN internships i ON i.id = ia.internship_id
           JOIN users student ON student.id = ia.student_id
           WHERE i.posted_by = ?
           ORDER BY ia.applied_at DESC LIMIT 6`,
          [userId],
        ),
        db.query(
          `SELECT id, type, title, message, link, is_read, created_at
           FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`,
          [userId],
        ),
      ]);

      const company = companies[0] || null;
      const pipeline = {
        pending: 0,
        reviewed: 0,
        shortlisted: 0,
        approved: 0,
        rejected: 0,
      };
      let totalApplicants = 0;
      pipelineRows.forEach((r) => {
        const s = r.status === "accepted" ? "approved" : r.status;
        if (pipeline[s] !== undefined) pipeline[s] = Number(r.count || 0);
        totalApplicants += Number(r.count || 0);
      });

      const activeInternships = myInternships.filter((item) => item.status === "open").length;
      const [unreadRows] = await db.query(
        "SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = 0",
        [userId],
      );

      return res.json({
        role: "recruiter",
        profile: req.user,
        company: company ? {
          id: company.id,
          name: company.name,
          description: company.description,
          industry: company.industry,
          website: company.website,
          contactEmail: company.contact_email,
          location: company.location,
          isVerified: Boolean(company.is_verified) || company.verification_status === "verified",
          verificationStatus: company.verification_status || "pending",
          logoUrl: company.logo_url,
        } : null,
        widgets: {
          activeInternships,
          totalApplicants,
          pendingApplicants: pipeline.pending,
          shortlistedApplicants: pipeline.shortlisted,
          unreadNotifications: Number(unreadRows[0]?.total || 0),
        },
        pipeline,
        myInternships,
        recentApplicants,
        notifications,
      });
    }

    // 2. Mentor Workspace Data
    if (role === "mentor") {
      const [
        [mentorApps],
        [bookings],
        [hostedSessions],
        [notifications],
        [mentorStats],
      ] = await Promise.all([
        db.query(
          "SELECT status, professional_title, availability FROM mentor_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
          [userId],
        ),
        db.query(
          `SELECT m.id, m.topic, m.description, m.requested_time, m.duration_minutes,
                  m.status, COALESCE(ms.meeting_link, '') AS meeting_link,
                  student.id AS student_id, student.full_name AS student_name,
                  student.avatar_url AS student_avatar, student.email AS student_email
           FROM mentorships m
           JOIN users student ON student.id = m.student_id
           LEFT JOIN mentorship_sessions ms ON ms.id = (
             SELECT id FROM mentorship_sessions
             WHERE mentorship_id = m.id
             ORDER BY scheduled_time DESC LIMIT 1
           )
           WHERE m.mentor_id = ?
           ORDER BY m.requested_time DESC LIMIT 6`,
          [userId],
        ),
        db.query(
          `SELECT ls.id, ls.title, ls.scheduled_time, ls.duration_minutes, ls.status, ls.meeting_link
           FROM learning_sessions ls
           WHERE ls.mentor_id = ? AND ls.status IN ('scheduled', 'ongoing')
           ORDER BY ls.scheduled_time ASC LIMIT 4`,
          [userId],
        ),
        db.query(
          "SELECT id, type, title, message, link, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5",
          [userId],
        ),
        db.query(
          `SELECT
            (SELECT COUNT(*) FROM mentorships WHERE mentor_id = ? AND status = 'pending') AS pendingBookings,
            (SELECT COUNT(DISTINCT student_id) FROM mentorships WHERE mentor_id = ? AND status = 'active') AS activeMentees,
            (SELECT COUNT(*) FROM mentorships WHERE mentor_id = ? AND status = 'completed') AS completedSessions,
            (SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0) AS unreadNotifications`,
          [userId, userId, userId, userId],
        ),
      ]);

      const counts = mentorStats[0] || {};
      const mentorApplication = mentorApps[0] || { status: "approved" };

      return res.json({
        role: "mentor",
        profile: req.user,
        mentorApplication,
        widgets: {
          pendingBookings: Number(counts.pendingBookings || 0),
          activeMentees: Number(counts.activeMentees || 0),
          completedSessions: Number(counts.completedSessions || 0),
          hostedSessions: hostedSessions.length,
          unreadNotifications: Number(counts.unreadNotifications || 0),
        },
        bookings,
        upcomingEvents: hostedSessions,
        notifications,
      });
    }

    // 3. Admin Overview Dashboard
    if (role === "admin") {
      const [
        [[summary]],
        [pendingMentorList],
        [pendingCompanyList],
        [notifications],
      ] = await Promise.all([
        db.query(
          `SELECT
            (SELECT COUNT(*) FROM users) AS users,
            (SELECT COUNT(*) FROM mentor_applications WHERE status = 'pending') AS pendingMentors,
            (SELECT COUNT(*) FROM company_profiles WHERE verification_status = 'pending') AS pendingCompanies,
            (SELECT COUNT(*) FROM internships WHERE status = 'open') AS openInternships,
            (SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0) AS unreadNotifications`,
          [userId],
        ),
        db.query(
          `SELECT ma.id, ma.professional_title, ma.company, u.full_name AS user_name, ma.created_at
           FROM mentor_applications ma
           JOIN users u ON u.id = ma.user_id
           WHERE ma.status = 'pending' ORDER BY ma.created_at DESC LIMIT 5`,
        ),
        db.query(
          `SELECT cp.id, cp.name, cp.industry, u.full_name AS owner_name, cp.created_at
           FROM company_profiles cp
           JOIN users u ON u.id = cp.owner_id
           WHERE cp.verification_status = 'pending' ORDER BY cp.created_at DESC LIMIT 5`,
        ),
        db.query(
          "SELECT id, type, title, message, link, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5",
          [userId],
        ),
      ]);

      return res.json({
        role: "admin",
        profile: req.user,
        widgets: {
          totalUsers: Number(summary?.users || 0),
          pendingMentors: Number(summary?.pendingMentors || 0),
          pendingCompanies: Number(summary?.pendingCompanies || 0),
          openInternships: Number(summary?.openInternships || 0),
          unreadNotifications: Number(summary?.unreadNotifications || 0),
        },
        pendingMentors: pendingMentorList,
        pendingCompanies: pendingCompanyList,
        notifications,
      });
    }

    // 4. Default / Student Dashboard (100% backward compatible)
    const [[applications], [sessions], [notifications], [opportunities], [exchanges], [courses], [counts], [roadmaps]] = await Promise.all([
      db.query(`SELECT ia.id, ia.status, ia.applied_at, i.title, i.company
        FROM internship_applications ia JOIN internships i ON i.id = ia.internship_id
        WHERE ia.student_id = ? ORDER BY ia.applied_at DESC LIMIT 6`, [userId]),
      db.query(`SELECT ls.id, ls.title, ls.scheduled_time, ls.duration_minutes, ls.status,
        u.full_name AS mentor_name FROM learning_sessions ls JOIN users u ON u.id = ls.mentor_id
        WHERE ls.status IN ('scheduled', 'ongoing')
        AND DATE_ADD(ls.scheduled_time, INTERVAL ls.duration_minutes MINUTE) >= NOW()
        AND (ls.mentor_id = ? OR EXISTS (SELECT 1 FROM session_participants sp
          WHERE sp.session_id = ls.id AND sp.user_id = ? AND sp.attendance_status <> 'cancelled'))
        ORDER BY ls.scheduled_time ASC LIMIT 4`, [userId, userId]),
      db.query(`SELECT id, type, title, message, link, is_read, created_at FROM notifications
        WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`, [userId]),
      db.query(`SELECT id, title, company, location, internship_type, stipend FROM internships
        WHERE status = 'open' AND (application_deadline IS NULL OR application_deadline >= CURDATE())
        ORDER BY created_at DESC LIMIT 4`),
      db.query(`SELECT se.id, se.skill_offered, se.skill_requested, se.status,
        requester.full_name AS requester_name, provider.full_name AS provider_name
        FROM skill_exchanges se JOIN users requester ON requester.id = se.requester_id
        LEFT JOIN users provider ON provider.id = se.provider_id
        WHERE se.requester_id = ? OR se.provider_id = ? ORDER BY se.created_at DESC LIMIT 4`, [userId, userId]),
      db.query(`SELECT c.id, c.slug, c.title, c.category, c.thumbnail_url AS thumbnailUrl,
        e.progress_percent AS progress FROM course_enrollments e JOIN courses c ON c.id = e.course_id
        WHERE e.user_id = ? AND c.is_published = 1 ORDER BY e.id DESC LIMIT 4`, [userId]),
      db.query(`SELECT
        (SELECT COUNT(*) FROM course_enrollments e JOIN courses c ON c.id=e.course_id WHERE e.user_id=? AND c.is_published=1) AS enrolledCourses,
        (SELECT COUNT(*) FROM skill_exchanges WHERE (requester_id=? OR provider_id=?) AND status='accepted') AS activeExchanges,
        (SELECT COUNT(*) FROM internship_applications ia JOIN internships i ON i.id=ia.internship_id
          WHERE ia.student_id=?) AS applications,
        (SELECT COUNT(*) FROM notifications WHERE user_id=? AND is_read=0) AS unreadNotifications`, [userId, userId, userId, userId, userId]),
      db.query(`SELECT r.id, p.title,
        (SELECT COUNT(*) FROM career_path_steps s WHERE s.path_id=p.id) AS totalSteps,
        (SELECT COUNT(*) FROM user_roadmap_steps done JOIN career_path_steps s ON s.id=done.step_id
          WHERE done.roadmap_id=r.id AND s.path_id=p.id) AS completedSteps
        FROM user_career_roadmaps r JOIN career_paths p ON p.id=r.path_id
        WHERE r.user_id=? AND r.is_current=1 ORDER BY r.started_at DESC LIMIT 1`, [userId]),
    ]);
    return res.json({
      role: "student",
      profile: req.user,
      widgets: Object.fromEntries(Object.entries(counts[0]).map(([key, value]) => [key, Number(value)])),
      applications,
      exchanges,
      opportunities,
      notifications,
      upcomingEvents: sessions,
      courses,
      roadmap: roadmaps[0] || null,
    });
  } catch (err) { return next(err); }
};

const getMentors = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, bio, skills, profession, company, experience_years,
              location, avatar_url
       FROM users
       WHERE role = 'mentor' AND is_active = 1
       ORDER BY experience_years DESC, full_name ASC`,
    );

    return res.json({
      mentors: rows.map((row) => ({
        id: row.id,
        name: row.full_name,
        title: row.profession || "Community mentor",
        company: row.company,
        bio: row.bio,
        skills: parseSkills(row.skills)?.teach || [
          "Mentorship",
          "Career guidance",
        ],
        experienceYears: row.experience_years,
        location: row.location || "Online",
        avatarUrl: row.avatar_url,
        rating: 4.8,
        sessions: Math.max(12, row.experience_years * 14),
      })),
    });
  } catch (err) {
    return next(err);
  }
};

const getMembers = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, role, bio, skills, profession, company, location, avatar_url
       FROM users
       WHERE is_active = 1 AND role <> 'admin'
       ORDER BY full_name ASC`,
    );

    return res.json({
      members: rows.map((row) => ({
        id: row.id,
        name: row.full_name,
        role: row.role,
        bio: row.bio,
        title: row.profession || "Community member",
        company: row.company,
        location: row.location || "Online",
        avatarUrl: row.avatar_url,
        skills: parseSkills(row.skills) || {},
      })),
    });
  } catch (err) {
    return next(err);
  }
};

const createMentorship = async (req, res, next) => {
  try {
    const {
      mentorId,
      topic,
      description,
      meetingFrequency = "weekly",
    } = req.body;

    if (!mentorId || !topic) {
      return res.status(400).json({ error: "Mentor and topic are required." });
    }

    const [result] = await db.query(
      `INSERT INTO mentorships
       (mentor_id, student_id, topic, description, meeting_frequency)
       VALUES (?, ?, ?, ?, ?)`,
      [mentorId, req.user.id, topic, description || null, meetingFrequency],
    );

    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'mentorship', 'New mentorship request', ?, ?)`,
      [
        mentorId,
        `${req.user.fullName} requested mentorship for ${topic}.`,
        "/mentorship",
      ],
    );

    return res.status(201).json({
      mentorship: {
        id: result.insertId,
        mentorId,
        studentId: req.user.id,
        topic,
        status: "pending",
      },
    });
  } catch (err) {
    return next(err);
  }
};

const getInternships = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, title, company, company_logo, description, requirements,
              location, is_remote, internship_type, duration_weeks, stipend,
              openings, application_deadline, start_date, status, created_at
       FROM internships
       ORDER BY created_at DESC`,
    );

    return res.json({ internships: rows });
  } catch (err) {
    return next(err);
  }
};

const createInternship = async (req, res, next) => {
  try {
    const {
      companyName,
      jobTitle,
      jobType,
      location,
      salaryRange,
      description,
      candidateSkills = [],
      applicationDeadline,
    } = req.body;

    if (!companyName || !jobTitle || !description) {
      return res
        .status(400)
        .json({ error: "Company, title, and description are required." });
    }

    const typeMap = {
      "Full-time": "full_time",
      "Part-time": "part_time",
      Internship: "full_time",
      Contract: "virtual",
      Freelance: "virtual",
    };

    const [result] = await db.query(
      `INSERT INTO internships
       (title, company, description, requirements, location, is_remote,
        internship_type, stipend, posted_by, application_deadline, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
      [
        jobTitle,
        companyName,
        description,
        candidateSkills.join(", "),
        location || "Remote",
        location === "Remote" ? 1 : 0,
        typeMap[jobType] || "full_time",
        salaryRange || null,
        req.user.id,
        applicationDeadline || null,
      ],
    );

    return res.status(201).json({
      internship: {
        id: result.insertId,
        title: jobTitle,
        company: companyName,
        status: "open",
      },
    });
  } catch (err) {
    return next(err);
  }
};

const applyInternship = async (req, res, next) => {
  try {
    const { internshipId } = req.params;
    const { coverLetter, resumeUrl, portfolioUrl } = req.body;

    await db.query(
      `INSERT INTO internship_applications
       (internship_id, student_id, cover_letter, resume_url, portfolio_url)
       VALUES (?, ?, ?, ?, ?)`,
      [
        internshipId,
        req.user.id,
        coverLetter || null,
        resumeUrl || null,
        portfolioUrl || null,
      ],
    );

    return res.status(201).json({ message: "Application submitted." });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "You already applied to this opportunity." });
    }

    return next(err);
  }
};

const getSkillExchanges = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT se.id, se.skill_offered, se.skill_requested, se.message,
              se.rejection_reason, se.status,
              se.scheduled_date, se.progress_percent,
              se.requester_completed_at, se.provider_completed_at,
              se.completed_at, se.created_at,
              requester.id AS requester_id, requester.full_name AS requester_name,
              requester.avatar_url AS requester_avatar,
              provider.id AS provider_id, provider.full_name AS provider_name,
              provider.avatar_url AS provider_avatar,
              c.id AS conversation_id
       FROM skill_exchanges se
       JOIN users requester ON requester.id = se.requester_id
       LEFT JOIN users provider ON provider.id = se.provider_id
       LEFT JOIN conversations c
         ON c.participant1_id = LEAST(se.requester_id, se.provider_id)
        AND c.participant2_id = GREATEST(se.requester_id, se.provider_id)
       WHERE se.requester_id = ? OR se.provider_id = ?
       ORDER BY se.created_at DESC`,
      [req.user.id, req.user.id],
    );

    return res.json({
      exchanges: rows.map((row) => ({
        id: row.id,
        title: `${row.skill_offered || "Skill"} for ${row.skill_requested || "learning"}`,
        offeredBy: row.requester_name,
        offeredByAvatar: row.requester_avatar,
        requesterId: row.requester_id,
        providerId: row.provider_id,
        providerName: row.provider_name,
        providerAvatar: row.provider_avatar,
        offeredSkill: row.skill_offered,
        requestedSkill: row.skill_requested,
        details: row.message,
        rejectionReason: row.rejection_reason,
        status: row.status,
        scheduledDate: row.scheduled_date,
        progressPercent: row.progress_percent || 0,
        requesterCompleted: Boolean(row.requester_completed_at),
        providerCompleted: Boolean(row.provider_completed_at),
        completedAt: row.completed_at,
        meetingLink:
          ["accepted", "completed"].includes(row.status)
            ? getMeetingLink(row.id)
            : null,
        conversationId: row.conversation_id,
        createdAt: row.created_at,
      })),
    });
  } catch (err) {
    return next(err);
  }
};

const getCommunitySkillExchanges = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT se.id, se.skill_offered, se.skill_requested, se.status,
              se.progress_percent, se.completed_at, se.created_at,
              requester.full_name AS requester_name,
              requester.avatar_url AS requester_avatar
       FROM skill_exchanges se
       JOIN users requester ON requester.id = se.requester_id
       WHERE se.status IN ('accepted', 'completed')
       ORDER BY COALESCE(se.completed_at, se.created_at) DESC
       LIMIT 20`,
    );

    return res.json({
      exchanges: rows.map((row) => ({
        id: row.id,
        offeredBy: row.requester_name,
        offeredByAvatar: row.requester_avatar,
        offeredSkill: row.skill_offered,
        requestedSkill: row.skill_requested,
        status: row.status,
        progressPercent: row.progress_percent || 0,
        completedAt: row.completed_at,
        createdAt: row.created_at,
      })),
    });
  } catch (err) {
    return next(err);
  }
};

const createSkillExchange = async (req, res, next) => {
  try {
    const { skillOffered, skillRequested, message, providerId, scheduledDate } =
      req.body;

    if (!skillOffered || !skillRequested) {
      return res
        .status(400)
        .json({ error: "Please add a skill to teach and learn." });
    }

    if (!providerId) {
      return res.status(400).json({ error: "Choose a community member for this request." });
    }

    if (providerId && Number(providerId) === req.user.id) {
      return res
        .status(400)
        .json({ error: "Choose another member for this skill exchange." });
    }

    if (providerId) {
      const [providers] = await db.query(
        "SELECT id, full_name FROM users WHERE id = ? AND is_active = 1 AND is_verified = 1",
        [providerId],
      );
      if (!providers.length) {
        return res.status(404).json({ error: "The selected community member was not found." });
      }

      const [existing] = await db.query(
        `SELECT id, status
         FROM skill_exchanges
         WHERE requester_id = ?
           AND provider_id = ?
           AND status IN ('pending', 'accepted')
         LIMIT 1`,
        [req.user.id, providerId],
      );

      if (existing.length) {
        return res.status(409).json({
          error: "You already have an active skill request with this member.",
        });
      }
    }

    const [result] = await db.query(
      `INSERT INTO skill_exchanges
       (requester_id, provider_id, skill_offered, skill_requested, message, scheduled_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        providerId || null,
        String(skillOffered).trim().slice(0, 100),
        String(skillRequested).trim().slice(0, 100),
        String(message || "").trim().slice(0, 1000) || null,
        scheduledDate || null,
      ],
    );

    await createNotification(req, {
      userId: providerId,
      type: "skill_exchange",
      title: "New skill exchange request",
      message: `${req.user.fullName} offered ${skillOffered} to learn ${skillRequested}.`,
      link: "/skill-requests",
      metadata: { exchangeId: result.insertId },
    });

    return res.status(201).json({
      exchange: {
        id: result.insertId,
        requesterId: req.user.id,
        providerId: providerId || null,
        skillOffered: String(skillOffered).trim().slice(0, 100),
        skillRequested: String(skillRequested).trim().slice(0, 100),
        status: "pending",
      },
    });
  } catch (err) {
    return next(err);
  }
};

const bookSkillExchange = async (req, res, next) => {
  try {
    const { exchangeId } = req.params;
    const { scheduledDate } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM skill_exchanges WHERE id = ?",
      [exchangeId],
    );
    const exchange = rows[0];

    if (!exchange) {
      return res
        .status(404)
        .json({ error: "Skill exchange request not found." });
    }

    if (exchange.requester_id === req.user.id) {
      return res
        .status(400)
        .json({ error: "Choose another member to accept this swap." });
    }

    await db.query(
      `UPDATE skill_exchanges
       SET provider_id = ?, scheduled_date = ?, status = 'accepted'
       WHERE id = ?`,
      [
        req.user.id,
        scheduledDate || exchange.scheduled_date || null,
        exchangeId,
      ],
    );

    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'skill_exchange', 'Skill exchange accepted', ?, ?)`,
      [
        exchange.requester_id,
        `${req.user.fullName} accepted your ${exchange.skill_offered} exchange request.`,
        `/community/skill-exchange/${exchangeId}`,
      ],
    );

    return res.json({ message: "Skill exchange booked." });
  } catch (err) {
    return next(err);
  }
};

const updateSkillExchangeStatus = async (req, res, next) => {
  try {
    const { exchangeId } = req.params;
    const { status, scheduledDate, rejectionReason } = req.body;
    const allowedStatuses = ["accepted", "rejected", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid skill request status." });
    }

    const [rows] = await db.query(
      "SELECT * FROM skill_exchanges WHERE id = ?",
      [exchangeId],
    );
    const exchange = rows[0];

    if (!exchange) {
      return res
        .status(404)
        .json({ error: "Skill exchange request not found." });
    }

    const isRequester = exchange.requester_id === req.user.id;
    const isProvider = exchange.provider_id === req.user.id;

    if (status === "cancelled" && !isRequester) {
      return res
        .status(403)
        .json({ error: "Only the requester can cancel this request." });
    }

    if ((status === "accepted" || status === "rejected") && !isProvider) {
      return res
        .status(403)
        .json({ error: "Only the requested member can update this request." });
    }

    if (exchange.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Only pending requests can be updated." });
    }

    const scheduledDateTime =
      status === "accepted" ? toMysqlDateTime(scheduledDate) : null;

    if (status === "accepted" && !scheduledDateTime) {
      return res
        .status(400)
        .json({ error: "Please choose a meeting date and time." });
    }

    const declineReason = String(rejectionReason || "").trim();

    if (status === "rejected" && !declineReason) {
      return res
        .status(400)
        .json({ error: "Please add a reason before declining this request." });
    }

    await db.query(
      `UPDATE skill_exchanges
       SET status = ?,
           scheduled_date = COALESCE(?, scheduled_date),
           rejection_reason = COALESCE(?, rejection_reason)
       WHERE id = ?`,
      [status, scheduledDateTime, declineReason || null, exchangeId],
    );

    if (status === "accepted") {
      const conversationId = await createConversationForUsers(
        exchange.requester_id,
        exchange.provider_id,
        {
          type: "skill_exchange",
          exchangeId,
          skillOffered: exchange.skill_offered,
          skillWanted: exchange.skill_wanted,
          meetingLink: getMeetingLink(exchangeId),
        },
      );
      const meetingLink = getMeetingLink(exchangeId);

      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES (?, 'skill_exchange', 'Skill exchange accepted', ?, ?)`,
        [
          exchange.requester_id,
          `${req.user.fullName} accepted your ${exchange.skill_offered} exchange request. Chat and meeting are ready.`,
          `/messages/${conversationId}`,
        ],
      );

      const io = req.app.get("io");
      if (io) {
        const payload = {
          type: "skill_exchange",
          title: "Skill exchange accepted",
          message: `${req.user.fullName} accepted your request. Meeting is scheduled.`,
          link: `/messages/${conversationId}`,
          exchangeId: Number(exchangeId),
          conversationId,
          meetingLink,
          scheduledDate: scheduledDateTime,
        };

        io.to(`user:${exchange.requester_id}`).emit("notification:new", payload);
        io.to(`user:${exchange.provider_id}`).emit("notification:new", payload);
      }

      return res.json({
        message: "Skill request accepted. Chat and meeting are ready.",
        conversationId,
        meetingLink,
        scheduledDate: scheduledDateTime,
      });
    }

    if (status === "rejected") {
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES (?, 'skill_exchange', 'Skill exchange declined', ?, ?)`,
        [
          exchange.requester_id,
          `${req.user.fullName} declined your request: ${declineReason}`,
          "/skill-requests",
        ],
      );

      const io = req.app.get("io");
      if (io) {
        io.to(`user:${exchange.requester_id}`).emit("notification:new", {
          type: "skill_exchange",
          title: "Skill exchange declined",
          message: `${req.user.fullName} declined your request: ${declineReason}`,
          link: "/skill-requests",
          exchangeId: Number(exchangeId),
          rejectionReason: declineReason,
        });
      }
    }

    return res.json({ message: `Skill request ${status}.` });
  } catch (err) {
    return next(err);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, type, title, message, link,
              is_read AS isRead, created_at AS createdAt
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 30`,
      [req.user.id],
    );

    return res.json({ notifications: rows });
  } catch (err) {
    return next(err);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    await db.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
      [req.params.notificationId, req.user.id],
    );

    return res.json({ message: "Notification marked as read." });
  } catch (err) {
    return next(err);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    await db.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [
      req.user.id,
    ]);

    return res.json({ message: "All notifications marked as read." });
  } catch (err) {
    return next(err);
  }
};

const getAdminOverview = async (req, res, next) => {
  try {
    const [stats, [users], [applications]] = await Promise.all([
      Promise.all([
        countTable("users", "is_active = 1"),
        countTable("users", "role = 'mentor' AND is_active = 1"),
        countTable("internships", "status = 'open'"),
        countTable("skill_exchanges", "status IN ('pending', 'accepted')"),
        countTable("internship_applications"),
      ]),
      db.query(
        `SELECT id, full_name, email, role, is_active, created_at
         FROM users
         ORDER BY created_at DESC
         LIMIT 20`,
      ),
      db.query(
        `SELECT ia.id, ia.status, ia.applied_at, u.full_name AS student_name,
                i.title, i.company
         FROM internship_applications ia
         JOIN users u ON u.id = ia.student_id
         JOIN internships i ON i.id = ia.internship_id
         ORDER BY ia.applied_at DESC
         LIMIT 10`,
      ),
    ]);

    return res.json({
      stats: {
        users: stats[0],
        mentors: stats[1],
        openInternships: stats[2],
        activeSkillExchanges: stats[3],
        applications: stats[4],
      },
      users,
      applications,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  applyInternship,
  bookSkillExchange,
  createInternship,
  createMentorship,
  createSkillExchange,
  getAdminOverview,
  getDashboard,
  getCommunitySkillExchanges,
  getInternships,
  getMembers,
  getMentors,
  getNotifications,
  getSkillExchanges,
  getStats,
  markNotificationRead,
  markAllNotificationsRead,
  updateSkillExchangeStatus,
};
