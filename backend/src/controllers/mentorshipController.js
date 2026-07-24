const db = require("../config/db");
const { createNotification } = require("../services/notificationDeliveryService");

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
};

const cleanUrl = (value) => {
  if (!value) return null;
  try {
    const url = new URL(String(value));
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

const toMysqlDateTime = (value) => {
  if (!value) return null;
  const local = String(value).match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?$/,
  );
  if (local) return `${local[1]} ${local[2]}:${local[3] || "00"}`;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString().slice(0, 19).replace("T", " ");
};

const meetingLinkFor = (mentorshipId) =>
  `https://meet.jit.si/smart-community-mentorship-${mentorshipId}`;

const emitNotification = (req, userId, notification) => {
  const io = req.app.get("io");
  if (io) io.to(`user:${userId}`).emit("notification:new", notification);
};

const mentorSelect = `
  SELECT u.id, u.full_name, u.bio, u.avatar_url, u.profession, u.company,
         u.experience_years, u.location, u.skills, u.linkedin_url,
         ma.availability,
         COALESCE(ROUND(AVG(mr.rating), 1), 0) AS rating,
         COUNT(DISTINCT mr.id) AS review_count,
         COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) AS sessions
  FROM users u
  LEFT JOIN mentor_applications ma ON ma.user_id = u.id AND ma.status = 'approved'
  LEFT JOIN mentor_reviews mr ON mr.mentor_id = u.id
  LEFT JOIN mentorships m ON m.mentor_id = u.id
  WHERE u.role = 'mentor' AND u.is_active = 1 AND u.is_verified = 1
  GROUP BY u.id, u.full_name, u.bio, u.avatar_url, u.profession, u.company,
           u.experience_years, u.location, u.skills, u.linkedin_url, ma.availability
`;

const formatMentor = (row) => {
  const skillData = parseJson(row.skills, {});
  return {
    id: row.id,
    name: row.full_name,
    title: row.profession || "Community Mentor",
    company: row.company,
    bio: row.bio || "Experienced community mentor ready to help you grow.",
    avatarUrl: row.avatar_url,
    skills: [
      ...(Array.isArray(skillData.teach) ? skillData.teach : []),
      ...(Array.isArray(skillData.candidate) ? skillData.candidate : []),
    ].filter((skill, index, values) => skill && values.indexOf(skill) === index),
    experienceYears: Number(row.experience_years || 0),
    location: row.location || "Online",
    linkedinUrl: row.linkedin_url,
    availability: row.availability || skillData.availability || "Flexible schedule",
    rating: Number(row.rating || 0),
    reviewCount: Number(row.review_count || 0),
    sessions: Number(row.sessions || 0),
  };
};

const getMentors = async (req, res, next) => {
  try {
    const [rows] = await db.query(`${mentorSelect} ORDER BY rating DESC, u.full_name ASC`);
    const query = String(req.query.q || "").trim().toLowerCase();
    const skill = String(req.query.skill || "").trim().toLowerCase();
    const mentors = rows.map(formatMentor).filter((mentor) => {
      const searchText = [
        mentor.name,
        mentor.title,
        mentor.company,
        mentor.bio,
        ...mentor.skills,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        (!query || searchText.includes(query)) &&
        (!skill || mentor.skills.some((item) => item.toLowerCase().includes(skill)))
      );
    });
    return res.json({ mentors });
  } catch (err) {
    return next(err);
  }
};

const getMentorDetail = async (req, res, next) => {
  try {
    const [rows] = await db.query(`${mentorSelect} HAVING u.id = ?`, [
      req.params.mentorId,
    ]);
    if (!rows.length) return res.status(404).json({ error: "Mentor not found." });

    const [reviews] = await db.query(
      `SELECT mr.id, mr.rating, mr.review, mr.created_at AS createdAt,
              u.id AS studentId, u.full_name AS studentName, u.avatar_url AS studentAvatar
       FROM mentor_reviews mr
       JOIN users u ON u.id = mr.student_id
       WHERE mr.mentor_id = ?
       ORDER BY mr.created_at DESC`,
      [req.params.mentorId],
    );
    return res.json({ mentor: formatMentor(rows[0]), reviews });
  } catch (err) {
    return next(err);
  }
};

const submitMentorApplication = async (req, res, next) => {
  try {
    if (req.user.role === "mentor") {
      return res.status(409).json({ error: "Your account is already a verified mentor." });
    }
    const professionalTitle = String(req.body.professionalTitle || "").trim();
    const motivation = String(req.body.motivation || "").trim();
    const expertise = Array.isArray(req.body.expertise)
      ? req.body.expertise.map((item) => String(item).trim()).filter(Boolean).slice(0, 20)
      : [];
    const experienceYears = Number(req.body.experienceYears || 0);
    if (!professionalTitle || !motivation || !expertise.length) {
      return res.status(400).json({
        error: "Professional title, expertise, and motivation are required.",
      });
    }
    if (!Number.isInteger(experienceYears) || experienceYears < 0 || experienceYears > 80) {
      return res.status(400).json({ error: "Experience must be between 0 and 80 years." });
    }
    const linkedinUrl = cleanUrl(req.body.linkedinUrl);
    if (req.body.linkedinUrl && !linkedinUrl) {
      return res.status(400).json({ error: "Enter a valid LinkedIn URL." });
    }

    const [existingRows] = await db.query(
      "SELECT status FROM mentor_applications WHERE user_id = ?",
      [req.user.id],
    );
    if (existingRows[0]?.status === "pending") {
      return res.status(409).json({ error: "Your mentor application is already pending." });
    }
    if (existingRows[0]?.status === "approved") {
      return res.status(409).json({ error: "Your mentor application is already approved." });
    }

    await db.query(
      `INSERT INTO mentor_applications
       (user_id, professional_title, company, expertise, experience_years,
        motivation, linkedin_url, availability, status, rejection_reason,
        reviewed_by, reviewed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, NULL)
       ON DUPLICATE KEY UPDATE professional_title = VALUES(professional_title),
         company = VALUES(company), expertise = VALUES(expertise),
         experience_years = VALUES(experience_years), motivation = VALUES(motivation),
         linkedin_url = VALUES(linkedin_url), availability = VALUES(availability),
         status = 'pending', rejection_reason = NULL, reviewed_by = NULL,
         reviewed_at = NULL`,
      [
        req.user.id,
        professionalTitle.slice(0, 150),
        String(req.body.company || "").trim().slice(0, 150) || null,
        JSON.stringify(expertise),
        experienceYears,
        motivation.slice(0, 2000),
        linkedinUrl,
        String(req.body.availability || "Flexible schedule").trim().slice(0, 150),
      ],
    );

    const [userRows] = await db.query("SELECT skills FROM users WHERE id = ?", [req.user.id]);
    const skills = parseJson(userRows[0]?.skills, {});
    await db.query(
      `UPDATE users SET profession = ?, company = ?, experience_years = ?,
              linkedin_url = ?, skills = ? WHERE id = ?`,
      [
        professionalTitle.slice(0, 150),
        String(req.body.company || "").trim().slice(0, 150) || null,
        experienceYears,
        linkedinUrl,
        JSON.stringify({ ...skills, teach: expertise }),
        req.user.id,
      ],
    );
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       SELECT id, 'mentorship', 'Mentor application received', ?, '/mentorship'
       FROM users WHERE role = 'admin' AND is_active = 1`,
      [`${req.user.fullName} submitted a mentor application.`],
    );
    return res.status(201).json({
      message: "Mentor application submitted for administrator review.",
      status: "pending",
    });
  } catch (err) {
    return next(err);
  }
};

const getMyMentorApplication = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, professional_title AS professionalTitle, company, expertise,
              experience_years AS experienceYears, motivation,
              linkedin_url AS linkedinUrl, availability, status,
              rejection_reason AS rejectionReason, reviewed_at AS reviewedAt,
              created_at AS createdAt
       FROM mentor_applications WHERE user_id = ?`,
      [req.user.id],
    );
    const application = rows[0]
      ? { ...rows[0], expertise: parseJson(rows[0].expertise, []) }
      : req.user.role === "mentor"
        ? { status: "approved" }
        : null;
    return res.json({ application });
  } catch (err) {
    return next(err);
  }
};

const getMentorApplications = async (req, res, next) => {
  try {
    const status = String(req.query.status || "pending");
    const allowed = ["pending", "approved", "rejected", "all"];
    if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status." });
    const params = [];
    const where = status === "all" ? "" : "WHERE ma.status = ?";
    if (status !== "all") params.push(status);
    const [rows] = await db.query(
      `SELECT ma.id, ma.user_id AS userId, u.full_name AS userName, u.email,
              ma.professional_title AS professionalTitle, ma.company, ma.expertise,
              ma.experience_years AS experienceYears, ma.motivation,
              ma.linkedin_url AS linkedinUrl, ma.availability, ma.status,
              ma.rejection_reason AS rejectionReason, ma.created_at AS createdAt
       FROM mentor_applications ma JOIN users u ON u.id = ma.user_id
       ${where} ORDER BY ma.created_at DESC`,
      params,
    );
    return res.json({
      applications: rows.map((row) => ({
        ...row,
        expertise: parseJson(row.expertise, []),
      })),
    });
  } catch (err) {
    return next(err);
  }
};

const reviewMentorApplication = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const status = String(req.body.status || "");
    const reason = String(req.body.rejectionReason || "").trim();
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Choose approved or rejected." });
    }
    if (status === "rejected" && !reason) {
      return res.status(400).json({ error: "Add a rejection reason." });
    }
    await connection.beginTransaction();
    const [rows] = await connection.query(
      "SELECT * FROM mentor_applications WHERE id = ? FOR UPDATE",
      [req.params.applicationId],
    );
    const application = rows[0];
    if (!application) {
      await connection.rollback();
      return res.status(404).json({ error: "Mentor application not found." });
    }
    if (application.status !== "pending") {
      await connection.rollback();
      return res.status(400).json({ error: "This application was already reviewed." });
    }
    await connection.query(
      `UPDATE mentor_applications SET status = ?, rejection_reason = ?,
              reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
      [status, status === "rejected" ? reason.slice(0, 500) : null, req.user.id, application.id],
    );
    if (status === "approved") {
      await connection.query("UPDATE users SET role = 'mentor' WHERE id = ?", [
        application.user_id,
      ]);
    }
    await connection.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'mentorship', ?, ?, '/mentorship')`,
      [
        application.user_id,
        status === "approved" ? "Mentor application approved" : "Mentor application update",
        status === "approved"
          ? "Your mentor profile is verified and now appears in mentor search."
          : `Your mentor application was not approved: ${reason}`,
      ],
    );
    await connection.commit();
    emitNotification(req, application.user_id, {
      type: "mentorship",
      title: `Mentor application ${status}`,
      link: "/mentorship",
    });
    return res.json({ message: `Mentor application ${status}.`, status });
  } catch (err) {
    await connection.rollback();
    return next(err);
  } finally {
    connection.release();
  }
};

const formatMentorship = (row, userId) => ({
  id: row.id,
  mentorId: row.mentor_id,
  mentorName: row.mentor_name,
  studentId: row.student_id,
  studentName: row.student_name,
  topic: row.topic,
  description: row.description,
  requestedTime: row.requested_time,
  durationMinutes: Number(row.duration_minutes || 60),
  meetingFrequency: row.meeting_frequency,
  status: row.status,
  rejectionReason: row.rejection_reason,
  completedAt: row.completed_at,
  meetingLink: row.meeting_link,
  sessionId: row.session_id,
  review: row.review_id
    ? { id: row.review_id, rating: row.review_rating, review: row.review_text }
    : null,
  currentUserRole: row.mentor_id === userId ? "mentor" : "student",
  createdAt: row.created_at,
});

const mentorshipSelect = `
  SELECT m.*, mentor.full_name AS mentor_name, student.full_name AS student_name,
         ms.id AS session_id, ms.meeting_link,
         mr.id AS review_id, mr.rating AS review_rating, mr.review AS review_text
  FROM mentorships m
  JOIN users mentor ON mentor.id = m.mentor_id
  JOIN users student ON student.id = m.student_id
  LEFT JOIN mentorship_sessions ms ON ms.mentorship_id = m.id
  LEFT JOIN mentor_reviews mr ON mr.mentorship_id = m.id
`;

const getMentorships = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `${mentorshipSelect}
       WHERE m.mentor_id = ? OR m.student_id = ?
       ORDER BY m.created_at DESC`,
      [req.user.id, req.user.id],
    );
    return res.json({ mentorships: rows.map((row) => formatMentorship(row, req.user.id)) });
  } catch (err) {
    return next(err);
  }
};

const createMentorship = async (req, res, next) => {
  try {
    const mentorId = Number(req.body.mentorId);
    const topic = String(req.body.topic || "").trim();
    const description = String(req.body.description || "").trim();
    const requestedTime = toMysqlDateTime(req.body.requestedTime);
    const durationMinutes = Number(req.body.durationMinutes || 60);
    const meetingFrequency = String(req.body.meetingFrequency || "weekly");
    if (!mentorId || !topic || !requestedTime) {
      return res.status(400).json({ error: "Mentor, topic, and requested time are required." });
    }
    if (mentorId === req.user.id) {
      return res.status(400).json({ error: "You cannot book yourself." });
    }
    if (new Date(requestedTime.replace(" ", "T")).getTime() <= Date.now()) {
      return res.status(400).json({ error: "Choose a future appointment time." });
    }
    if (![30, 45, 60, 90, 120].includes(durationMinutes)) {
      return res.status(400).json({ error: "Choose a valid session duration." });
    }
    if (!["weekly", "biweekly", "monthly"].includes(meetingFrequency)) {
      return res.status(400).json({ error: "Choose a valid meeting frequency." });
    }
    const [mentors] = await db.query(
      "SELECT id, full_name FROM users WHERE id = ? AND role = 'mentor' AND is_active = 1 AND is_verified = 1",
      [mentorId],
    );
    if (!mentors.length) return res.status(404).json({ error: "Verified mentor not found." });
    const [existing] = await db.query(
      `SELECT id FROM mentorships WHERE mentor_id = ? AND student_id = ?
       AND status IN ('pending','active') LIMIT 1`,
      [mentorId, req.user.id],
    );
    if (existing.length) {
      return res.status(409).json({ error: "You already have an active request with this mentor." });
    }

    const [result] = await db.query(
      `INSERT INTO mentorships
       (mentor_id, student_id, topic, description, requested_time,
        duration_minutes, meeting_frequency)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        mentorId,
        req.user.id,
        topic.slice(0, 200),
        description.slice(0, 2000) || null,
        requestedTime,
        durationMinutes,
        meetingFrequency,
      ],
    );
    await createNotification(req, {
      userId: mentorId,
      type: "mentorship",
      title: "New mentorship booking",
      message: `${req.user.fullName} requested a session about ${topic}.`,
      link: "/mentorship",
      metadata: { mentorshipId: result.insertId },
    });
    return res.status(201).json({
      message: "Mentorship booking sent for mentor approval.",
      mentorship: { id: result.insertId, mentorId, status: "pending" },
    });
  } catch (err) {
    return next(err);
  }
};

const updateMentorshipStatus = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const status = String(req.body.status || "");
    const reason = String(req.body.rejectionReason || "").trim();
    if (!["active", "rejected", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({ error: "Invalid mentorship status." });
    }
    await connection.beginTransaction();
    const [rows] = await connection.query(
      "SELECT * FROM mentorships WHERE id = ? FOR UPDATE",
      [req.params.mentorshipId],
    );
    const mentorship = rows[0];
    if (!mentorship) {
      await connection.rollback();
      return res.status(404).json({ error: "Mentorship booking not found." });
    }
    const isMentor = mentorship.mentor_id === req.user.id;
    const isStudent = mentorship.student_id === req.user.id;
    if (!isMentor && !isStudent) {
      await connection.rollback();
      return res.status(403).json({ error: "You do not belong to this mentorship." });
    }
    if (["active", "rejected"].includes(status) && (!isMentor || mentorship.status !== "pending")) {
      await connection.rollback();
      return res.status(403).json({ error: "Only the mentor can review a pending booking." });
    }
    if (status === "rejected" && !reason) {
      await connection.rollback();
      return res.status(400).json({ error: "Add a rejection reason." });
    }
    if (status === "cancelled" && !["pending", "active"].includes(mentorship.status)) {
      await connection.rollback();
      return res.status(400).json({ error: "This booking cannot be cancelled." });
    }
    if (status === "completed" && mentorship.status !== "active") {
      await connection.rollback();
      return res.status(400).json({ error: "Only active mentorships can be completed." });
    }

    const meetingLink = meetingLinkFor(mentorship.id);
    await connection.query(
      `UPDATE mentorships SET status = ?, rejection_reason = ?,
              start_date = CASE WHEN ? = 'active' THEN DATE(requested_time) ELSE start_date END,
              end_date = CASE WHEN ? = 'completed' THEN CURDATE() ELSE end_date END,
              completed_at = CASE WHEN ? = 'completed' THEN NOW() ELSE completed_at END
       WHERE id = ?`,
      [status, status === "rejected" ? reason.slice(0, 500) : null, status, status, status, mentorship.id],
    );
    if (status === "active") {
      await connection.query(
        `INSERT INTO mentorship_sessions
         (mentorship_id, scheduled_time, duration_minutes, meeting_link, topic, status)
         VALUES (?, ?, ?, ?, ?, 'scheduled')`,
        [
          mentorship.id,
          mentorship.requested_time,
          mentorship.duration_minutes,
          meetingLink,
          mentorship.topic,
        ],
      );
    } else if (["completed", "cancelled"].includes(status)) {
      await connection.query(
        "UPDATE mentorship_sessions SET status = ? WHERE mentorship_id = ?",
        [status === "completed" ? "completed" : "cancelled", mentorship.id],
      );
    }
    const otherUserId = isMentor ? mentorship.student_id : mentorship.mentor_id;
    await connection.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'mentorship', ?, ?, '/mentorship')`,
      [
        otherUserId,
        `Mentorship ${status}`,
        status === "rejected"
          ? `${req.user.fullName} declined the booking: ${reason}`
          : `${req.user.fullName} marked the mentorship as ${status}.`,
      ],
    );
    await connection.commit();
    emitNotification(req, otherUserId, {
      type: "mentorship",
      title: `Mentorship ${status}`,
      link: "/mentorship",
      mentorshipId: mentorship.id,
    });
    return res.json({
      message: `Mentorship ${status}.`,
      status,
      meetingLink: status === "active" ? meetingLink : undefined,
    });
  } catch (err) {
    await connection.rollback();
    return next(err);
  } finally {
    connection.release();
  }
};

const submitMentorReview = async (req, res, next) => {
  try {
    const rating = Number(req.body.rating);
    const review = String(req.body.review || "").trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !review) {
      return res.status(400).json({ error: "Choose 1-5 stars and write a review." });
    }
    const [rows] = await db.query(
      "SELECT * FROM mentorships WHERE id = ? AND student_id = ? AND status = 'completed'",
      [req.params.mentorshipId, req.user.id],
    );
    const mentorship = rows[0];
    if (!mentorship) {
      return res.status(403).json({ error: "Complete this mentorship before reviewing it." });
    }
    await db.query(
      `INSERT INTO mentor_reviews (mentorship_id, mentor_id, student_id, rating, review)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), review = VALUES(review),
         updated_at = CURRENT_TIMESTAMP`,
      [mentorship.id, mentorship.mentor_id, req.user.id, rating, review.slice(0, 1000)],
    );
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'mentorship', 'New mentor review', ?, ?)`,
      [
        mentorship.mentor_id,
        `${req.user.fullName} left a ${rating}-star review.`,
        `/mentorship/${mentorship.mentor_id}`,
      ],
    );
    return res.status(201).json({ message: "Thank you for reviewing your mentor." });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createMentorship,
  getMentorApplications,
  getMentorDetail,
  getMentors,
  getMentorships,
  getMyMentorApplication,
  reviewMentorApplication,
  submitMentorApplication,
  submitMentorReview,
  updateMentorshipStatus,
};
