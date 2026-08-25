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

const createConversationForUsers = async (leftUserId, rightUserId) => {
  const participant1 = Math.min(leftUserId, rightUserId);
  const participant2 = Math.max(leftUserId, rightUserId);

  const [result] = await db.query(
    `INSERT INTO conversations (participant1_id, participant2_id, last_message, last_message_time)
     VALUES (?, ?, 'Skill exchange accepted. Chat and meeting are ready.', CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE
       id = LAST_INSERT_ID(id),
       last_message = VALUES(last_message),
       last_message_time = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP`,
    [participant1, participant2],
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
    const [
      [applications],
      [sessions],
      [notifications],
      [jobMatches],
      [exchanges],
    ] = await Promise.all([
      db.query(
        `SELECT ia.*, i.title, i.company
           FROM internship_applications ia
           JOIN internships i ON i.id = ia.internship_id
           WHERE ia.student_id = ?
           ORDER BY ia.applied_at DESC
           LIMIT 5`,
        [userId],
      ),
      db.query(
        `SELECT ls.id, ls.title, ls.scheduled_time, ls.duration_minutes,
                  u.full_name AS mentor_name, ls.meeting_link, ls.status
           FROM learning_sessions ls
           JOIN users u ON u.id = ls.mentor_id
           WHERE ls.status IN ('scheduled', 'ongoing')
           ORDER BY ls.scheduled_time ASC
           LIMIT 4`,
      ),
      db.query(
        `SELECT id, type, title, message, link, is_read, created_at
           FROM notifications
           WHERE user_id = ?
           ORDER BY created_at DESC
           LIMIT 5`,
        [userId],
      ),
      db.query(
        `SELECT id, title, company, location, internship_type, stipend, application_deadline
           FROM internships
           WHERE status = 'open'
           ORDER BY created_at DESC
           LIMIT 5`,
      ),
      db.query(
        `SELECT se.id, se.skill_offered, se.skill_requested, se.status,
                  requester.full_name AS requester_name,
                  provider.full_name AS provider_name
           FROM skill_exchanges se
           JOIN users requester ON requester.id = se.requester_id
           LEFT JOIN users provider ON provider.id = se.provider_id
           WHERE se.requester_id = ? OR se.provider_id = ?
           ORDER BY se.created_at DESC
           LIMIT 5`,
        [userId, userId],
      ),
    ]);

    return res.json({
      profile: req.user,
      widgets: {
        learningProgress: 68,
        skillScore: 82,
        completedCourses: 4,
        jobMatches: jobMatches.length,
      },
      roadmap: [
        "Complete one focused course",
        "Book a mentorship session",
        "Create a skill exchange request",
        "Apply to matched internships",
      ],
      applications,
      exchanges,
      jobMatches,
      notifications,
      upcomingEvents: sessions,
      recommendedCourses: [
        {
          id: "react-modern-web",
          title: "React for Modern Web",
          category: "Frontend",
          progress: 72,
        },
        {
          id: "node-api-development",
          title: "Node.js API Development",
          category: "Backend",
          progress: 40,
        },
      ],
    });
  } catch (err) {
    return next(err);
  }
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
       WHERE is_active = 1
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
              provider.id AS provider_id, provider.full_name AS provider_name,
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
        requesterId: row.requester_id,
        providerId: row.provider_id,
        providerName: row.provider_name,
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
              requester.full_name AS requester_name
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
