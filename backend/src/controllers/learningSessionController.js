const crypto = require("crypto");
const db = require("../config/db");
const {
  createNotification,
  createNotifications,
} = require("../services/notificationDeliveryService");

const allowedLevels = new Set(["beginner", "intermediate", "advanced", "all"]);
const allowedStatuses = new Set(["scheduled", "ongoing", "completed", "cancelled"]);

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

const parseMaterials = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const normalizeMaterials = (value) => {
  const entries = Array.isArray(value) ? value : [];
  return entries
    .map((item) => {
      const label = String(item?.label || item?.url || "").trim().slice(0, 150);
      const rawUrl = String(item?.url || item || "").trim();
      try {
        const url = new URL(rawUrl);
        if (!["http:", "https:"].includes(url.protocol)) return null;
        return { label: label || url.hostname, url: url.toString() };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .slice(0, 10);
};

const meetingLinkFor = (sessionId) =>
  `https://meet.jit.si/smart-community-session-${sessionId}-${crypto
    .randomBytes(6)
    .toString("hex")}`;

const baseSessionSelect = `
  SELECT ls.id, ls.title, ls.description, ls.category, ls.level,
         ls.mentor_id AS hostId, host.full_name AS hostName,
         host.avatar_url AS hostAvatarUrl, host.profession AS hostTitle,
         ls.scheduled_time AS scheduledTime,
         ls.registration_deadline AS registrationDeadline,
         ls.duration_minutes AS durationMinutes,
         ls.max_participants AS maxParticipants,
         ls.meeting_provider AS meetingProvider,
         ls.visibility, ls.recording_url AS recordingUrl,
         ls.materials, ls.status, ls.cancel_reason AS cancelReason,
         ls.created_at AS createdAt,
         (SELECT COUNT(*) FROM session_participants counted
          WHERE counted.session_id = ls.id
            AND counted.attendance_status <> 'cancelled') AS participantCount,
         mine.id AS registrationId,
         mine.attendance_status AS attendanceStatus,
         mine.actual_joined_at AS actualJoinedAt,
         mine.left_at AS leftAt,
         mine.attendance_minutes AS attendanceMinutes,
         mine.rating AS myRating,
         mine.feedback AS myFeedback
  FROM learning_sessions ls
  JOIN users host ON host.id = ls.mentor_id
  LEFT JOIN session_participants mine
    ON mine.session_id = ls.id AND mine.user_id = ?
`;

const mapSession = (row, userId) => {
  const scheduledAt = new Date(row.scheduledTime);
  const now = Date.now();
  const opensAt = scheduledAt.getTime() - 30 * 60 * 1000;
  const closesAt =
    scheduledAt.getTime() + (Number(row.durationMinutes) + 120) * 60 * 1000;
  const isHost = Number(row.hostId) === Number(userId);
  const isRegistered =
    Boolean(row.registrationId) && row.attendanceStatus !== "cancelled";
  return {
    ...row,
    participantCount: Number(row.participantCount || 0),
    durationMinutes: Number(row.durationMinutes || 60),
    maxParticipants: Number(row.maxParticipants || 50),
    materials: parseMaterials(row.materials),
    isHost,
    isRegistered,
    canJoin:
      (isHost || isRegistered) &&
      ["scheduled", "ongoing"].includes(row.status) &&
      now >= opensAt &&
      now <= closesAt,
  };
};

const getSessionRecord = async (sessionId, userId = 0) => {
  const [rows] = await db.query(`${baseSessionSelect} WHERE ls.id = ?`, [
    userId || 0,
    sessionId,
  ]);
  return rows[0] ? mapSession(rows[0], userId) : null;
};

const listLearningSessions = async (req, res, next) => {
  try {
    const userId = req.user?.id || 0;
    const conditions = ["(ls.visibility = 'public' OR ls.mentor_id = ? OR mine.id IS NOT NULL)"];
    const params = [userId, userId];
    const scope = String(req.query.scope || "upcoming");
    const query = String(req.query.q || "").trim();
    const category = String(req.query.category || "").trim();

    if (scope === "upcoming") {
      conditions.push(
        "ls.status IN ('scheduled','ongoing') AND DATE_ADD(ls.scheduled_time, INTERVAL ls.duration_minutes MINUTE) >= NOW()",
      );
    } else if (scope === "past") {
      conditions.push(
        "(ls.status = 'completed' OR (ls.status <> 'cancelled' AND DATE_ADD(ls.scheduled_time, INTERVAL ls.duration_minutes MINUTE) < NOW()))",
      );
    } else if (scope === "cancelled") {
      conditions.push("ls.status = 'cancelled'");
    } else if (scope === "my") {
      if (!userId) return res.status(401).json({ error: "Please login to view your sessions." });
      conditions.push("(ls.mentor_id = ? OR mine.id IS NOT NULL)");
      params.push(userId);
    }
    if (query) {
      conditions.push("(ls.title LIKE ? OR ls.description LIKE ? OR host.full_name LIKE ?)");
      const like = `%${query}%`;
      params.push(like, like, like);
    }
    if (category) {
      conditions.push("ls.category = ?");
      params.push(category);
    }

    const [rows] = await db.query(
      `${baseSessionSelect}
       WHERE ${conditions.join(" AND ")}
       ORDER BY
         CASE ls.status WHEN 'ongoing' THEN 0 WHEN 'scheduled' THEN 1 ELSE 2 END,
         ls.scheduled_time ${scope === "past" ? "DESC" : "ASC"}
       LIMIT 100`,
      params,
    );
    const [categories] = await db.query(
      `SELECT DISTINCT category FROM learning_sessions
       WHERE category IS NOT NULL AND category <> ''
       ORDER BY category`,
    );
    return res.json({
      sessions: rows.map((row) => mapSession(row, userId)),
      categories: categories.map((row) => row.category),
    });
  } catch (err) {
    return next(err);
  }
};

const getLearningSession = async (req, res, next) => {
  try {
    const session = await getSessionRecord(req.params.sessionId, req.user?.id);
    if (
      !session ||
      (session.visibility === "private" && !session.isHost && !session.isRegistered)
    ) {
      return res.status(404).json({ error: "Learning session not found." });
    }
    return res.json({ session });
  } catch (err) {
    return next(err);
  }
};

const createLearningSession = async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    const category = String(req.body.category || "General").trim().slice(0, 100);
    const level = String(req.body.level || "all");
    const scheduledTime = toMysqlDateTime(req.body.scheduledTime);
    const registrationDeadline = toMysqlDateTime(req.body.registrationDeadline);
    const durationMinutes = Number(req.body.durationMinutes || 60);
    const maxParticipants = Number(req.body.maxParticipants || 50);
    const materials = normalizeMaterials(req.body.materials);

    if (title.length < 3 || title.length > 200) {
      return res.status(400).json({ error: "Title must be 3 to 200 characters." });
    }
    if (!scheduledTime || new Date(scheduledTime.replace(" ", "T")).getTime() <= Date.now()) {
      return res.status(400).json({ error: "Choose a future session date and time." });
    }
    if (!allowedLevels.has(level)) {
      return res.status(400).json({ error: "Choose a valid learning level." });
    }
    if (!Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 480) {
      return res.status(400).json({ error: "Duration must be between 15 and 480 minutes." });
    }
    if (!Number.isInteger(maxParticipants) || maxParticipants < 2 || maxParticipants > 500) {
      return res.status(400).json({ error: "Capacity must be between 2 and 500." });
    }
    if (
      registrationDeadline &&
      new Date(registrationDeadline.replace(" ", "T")).getTime() >=
        new Date(scheduledTime.replace(" ", "T")).getTime()
    ) {
      return res.status(400).json({ error: "Registration must close before the session starts." });
    }

    const [result] = await db.query(
      `INSERT INTO learning_sessions
       (title, description, category, level, mentor_id, scheduled_time,
        registration_deadline, duration_minutes, max_participants,
        meeting_provider, visibility, materials, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'jitsi', 'public', ?, 'scheduled')`,
      [
        title,
        description || null,
        category || "General",
        level,
        req.user.id,
        scheduledTime,
        registrationDeadline,
        durationMinutes,
        maxParticipants,
        JSON.stringify(materials),
      ],
    );
    const meetingLink = meetingLinkFor(result.insertId);
    await db.query("UPDATE learning_sessions SET meeting_link = ? WHERE id = ?", [
      meetingLink,
      result.insertId,
    ]);
    return res.status(201).json({
      sessionId: result.insertId,
      message: "Learning session scheduled.",
    });
  } catch (err) {
    return next(err);
  }
};

const registerForSession = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [[session]] = await connection.query(
      `SELECT id, mentor_id, scheduled_time, registration_deadline,
              max_participants, status
       FROM learning_sessions WHERE id = ? FOR UPDATE`,
      [req.params.sessionId],
    );
    if (!session || session.status !== "scheduled") {
      await connection.rollback();
      return res.status(400).json({ error: "This session is not open for registration." });
    }
    if (Number(session.mentor_id) === Number(req.user.id)) {
      await connection.rollback();
      return res.status(400).json({ error: "You are already the host of this session." });
    }
    const closesAt = session.registration_deadline || session.scheduled_time;
    if (new Date(closesAt).getTime() <= Date.now()) {
      await connection.rollback();
      return res.status(400).json({ error: "Registration for this session has closed." });
    }
    const [[count]] = await connection.query(
      `SELECT COUNT(*) AS total FROM session_participants
       WHERE session_id = ? AND attendance_status <> 'cancelled'`,
      [session.id],
    );
    if (Number(count.total) >= Number(session.max_participants)) {
      await connection.rollback();
      return res.status(409).json({ error: "This learning session is full." });
    }
    await connection.query(
      `INSERT INTO session_participants (session_id, user_id, attendance_status)
       VALUES (?, ?, 'registered')
       ON DUPLICATE KEY UPDATE attendance_status = 'registered', joined_at = CURRENT_TIMESTAMP`,
      [session.id, req.user.id],
    );
    await connection.commit();
    await createNotification(req, {
      userId: session.mentor_id,
      type: "session",
      title: "New session participant",
      message: `${req.user.fullName} registered for your learning session.`,
      link: `/sessions/${session.id}`,
      metadata: { sessionId: session.id },
    });
    return res.status(201).json({ message: "You are registered for the session." });
  } catch (err) {
    await connection.rollback();
    return next(err);
  } finally {
    connection.release();
  }
};

const cancelSessionRegistration = async (req, res, next) => {
  try {
    const [result] = await db.query(
      `UPDATE session_participants
       SET attendance_status = 'cancelled'
       WHERE session_id = ? AND user_id = ?
         AND attendance_status = 'registered'`,
      [req.params.sessionId, req.user.id],
    );
    if (!result.affectedRows) {
      return res.status(404).json({ error: "Active session registration not found." });
    }
    return res.json({ message: "Session registration cancelled." });
  } catch (err) {
    return next(err);
  }
};

const updateLearningSessionStatus = async (req, res, next) => {
  try {
    const status = String(req.body.status || "");
    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ error: "Choose a valid session status." });
    }
    const [[session]] = await db.query(
      "SELECT mentor_id, status FROM learning_sessions WHERE id = ?",
      [req.params.sessionId],
    );
    if (!session) return res.status(404).json({ error: "Learning session not found." });
    if (Number(session.mentor_id) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only the host can update this session." });
    }
    const cancelReason =
      status === "cancelled"
        ? String(req.body.cancelReason || "").trim().slice(0, 500) || null
        : null;
    await db.query(
      "UPDATE learning_sessions SET status = ?, cancel_reason = ? WHERE id = ?",
      [status, cancelReason, req.params.sessionId],
    );
    if (status === "cancelled") {
      const [participants] = await db.query(
        `SELECT user_id FROM session_participants
         WHERE session_id = ? AND attendance_status <> 'cancelled'`,
        [req.params.sessionId],
      );
      if (participants.length) {
        await createNotifications(
          req,
          participants.map((participant) => participant.user_id),
          {
            type: "session",
            title: "Session cancelled",
            message:
              cancelReason ||
              "A learning session you registered for was cancelled.",
            link: "/sessions",
            metadata: { sessionId: Number(req.params.sessionId) },
          },
        );
      }
    }
    return res.json({ message: `Session marked ${status}.` });
  } catch (err) {
    return next(err);
  }
};

const joinLearningSession = async (req, res, next) => {
  try {
    const [[session]] = await db.query(
      `SELECT id, mentor_id, scheduled_time, duration_minutes, meeting_link, status
       FROM learning_sessions WHERE id = ?`,
      [req.params.sessionId],
    );
    if (!session || ["completed", "cancelled"].includes(session.status)) {
      return res.status(400).json({ error: "This session is not available to join." });
    }
    const isHost = Number(session.mentor_id) === Number(req.user.id);
    const [[participant]] = isHost
      ? [[]]
      : await db.query(
          `SELECT id, attendance_status FROM session_participants
           WHERE session_id = ? AND user_id = ?`,
          [session.id, req.user.id],
        );
    if (!isHost && (!participant || participant.attendance_status === "cancelled")) {
      return res.status(403).json({ error: "Register for this session before joining." });
    }
    const scheduledAt = new Date(session.scheduled_time).getTime();
    const now = Date.now();
    if (now < scheduledAt - 30 * 60 * 1000) {
      return res.status(400).json({ error: "The meeting opens 30 minutes before its start time." });
    }
    if (now > scheduledAt + (Number(session.duration_minutes) + 120) * 60 * 1000) {
      return res.status(400).json({ error: "The meeting join window has closed." });
    }
    if (!isHost) {
      await db.query(
        `UPDATE session_participants
         SET attendance_status = 'attended',
             actual_joined_at = COALESCE(actual_joined_at, CURRENT_TIMESTAMP)
         WHERE id = ?`,
        [participant.id],
      );
    }
    if (session.status === "scheduled") {
      await db.query("UPDATE learning_sessions SET status = 'ongoing' WHERE id = ?", [
        session.id,
      ]);
    }
    return res.json({
      meetingLink: session.meeting_link,
      provider: "jitsi",
      joinedAt: new Date().toISOString(),
    });
  } catch (err) {
    return next(err);
  }
};

const leaveLearningSession = async (req, res, next) => {
  try {
    const [result] = await db.query(
      `UPDATE session_participants
       SET left_at = CURRENT_TIMESTAMP,
           attendance_minutes = GREATEST(
             attendance_minutes,
             TIMESTAMPDIFF(MINUTE, actual_joined_at, CURRENT_TIMESTAMP)
           )
       WHERE session_id = ? AND user_id = ?
         AND actual_joined_at IS NOT NULL`,
      [req.params.sessionId, req.user.id],
    );
    return res.json({
      message: result.affectedRows
        ? "Attendance time saved."
        : "The host left the meeting.",
    });
  } catch (err) {
    return next(err);
  }
};

const getSessionParticipants = async (req, res, next) => {
  try {
    const [[session]] = await db.query(
      "SELECT mentor_id FROM learning_sessions WHERE id = ?",
      [req.params.sessionId],
    );
    if (!session) return res.status(404).json({ error: "Learning session not found." });
    if (Number(session.mentor_id) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only the host can view attendance." });
    }
    const [participants] = await db.query(
      `SELECT u.id, u.full_name AS name, u.email, u.avatar_url AS avatarUrl,
              sp.joined_at AS registeredAt,
              sp.attendance_status AS attendanceStatus,
              sp.actual_joined_at AS actualJoinedAt,
              sp.left_at AS leftAt,
              sp.attendance_minutes AS attendanceMinutes,
              sp.rating, sp.feedback
       FROM session_participants sp
       JOIN users u ON u.id = sp.user_id
       WHERE sp.session_id = ?
       ORDER BY sp.joined_at`,
      [req.params.sessionId],
    );
    return res.json({ participants });
  } catch (err) {
    return next(err);
  }
};

const submitSessionFeedback = async (req, res, next) => {
  try {
    const rating = Number(req.body.rating);
    const feedback = String(req.body.feedback || "").trim().slice(0, 1500);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }
    const [result] = await db.query(
      `UPDATE session_participants
       SET rating = ?, feedback = ?
       WHERE session_id = ? AND user_id = ?
         AND attendance_status = 'attended'`,
      [rating, feedback || null, req.params.sessionId, req.user.id],
    );
    if (!result.affectedRows) {
      return res.status(403).json({ error: "Attend the session before leaving feedback." });
    }
    return res.json({ message: "Thank you for your session feedback." });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  cancelSessionRegistration,
  createLearningSession,
  getLearningSession,
  getSessionParticipants,
  joinLearningSession,
  leaveLearningSession,
  listLearningSessions,
  registerForSession,
  submitSessionFeedback,
  updateLearningSessionStatus,
};
