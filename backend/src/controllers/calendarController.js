const db = require("../config/db");

const DEFAULT_TIMEZONE = "Asia/Phnom_Penh";

/**
 * Normalizes start time and computes end time based on duration
 */
const computeTimeWindow = (startTime, durationMinutes = 60) => {
  if (!startTime) return { startAt: null, endAt: null };
  const start = new Date(startTime);
  if (isNaN(start.getTime())) return { startAt: null, endAt: null };
  const duration = Math.max(15, parseInt(durationMinutes, 10) || 60);
  const end = new Date(start.getTime() + duration * 60 * 1000);
  return {
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    durationMinutes: duration,
  };
};

/**
 * GET /api/calendar/events
 * Aggregates authorized scheduled activities for current authenticated user
 */
const getCalendarEvents = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role || "student";
    const { from, to } = req.query;

    const events = [];

    // 1. MENTORSHIP SESSIONS & BOOKINGS
    if (role === "mentor" || role === "student" || role === "admin") {
      let mentorshipQuery = `
        SELECT
          m.id AS booking_id,
          m.topic,
          m.description,
          m.requested_time,
          m.duration_minutes AS booking_duration,
          m.status AS booking_status,
          ms.id AS session_id,
          ms.scheduled_time AS session_scheduled_time,
          ms.duration_minutes AS session_duration,
          ms.meeting_link,
          ms.status AS session_status,
          student.id AS student_id,
          student.full_name AS student_name,
          student.email AS student_email,
          student.avatar_url AS student_avatar,
          mentor.id AS mentor_id,
          mentor.full_name AS mentor_name,
          mentor.email AS mentor_email,
          mentor.avatar_url AS mentor_avatar,
          mentor.profession AS mentor_profession
        FROM mentorships m
        JOIN users student ON student.id = m.student_id
        JOIN users mentor ON mentor.id = m.mentor_id
        LEFT JOIN mentorship_sessions ms ON ms.id = (
          SELECT id FROM mentorship_sessions
          WHERE mentorship_id = m.id
          ORDER BY scheduled_time DESC LIMIT 1
        )
        WHERE 1 = 1
      `;
      const mentorshipParams = [];

      if (role === "mentor") {
        mentorshipQuery += " AND m.mentor_id = ?";
        mentorshipParams.push(userId);
      } else if (role === "student") {
        mentorshipQuery += " AND m.student_id = ?";
        mentorshipParams.push(userId);
      }

      mentorshipQuery += " ORDER BY COALESCE(ms.scheduled_time, m.requested_time) ASC";

      const [mentorshipRows] = await db.query(mentorshipQuery, mentorshipParams);

      for (const row of mentorshipRows) {
        const rawStart = row.session_scheduled_time || row.requested_time;
        if (!rawStart) continue;

        const duration = row.session_duration || row.booking_duration || 60;
        const { startAt, endAt, durationMinutes } = computeTimeWindow(rawStart, duration);
        if (!startAt) continue;

        const isMentor = role === "mentor" || row.mentor_id === userId;
        const partner = isMentor
          ? {
              id: row.student_id,
              name: row.student_name,
              email: row.student_email,
              avatarUrl: row.student_avatar || "",
              role: "student",
            }
          : {
              id: row.mentor_id,
              name: row.mentor_name,
              email: row.mentor_email,
              avatarUrl: row.mentor_avatar || "",
              role: "mentor",
              profession: row.mentor_profession || "Mentor",
            };

        const isPending = row.booking_status === "pending";
        const hasSession = Boolean(row.session_id);
        const meetingLink = (!isPending && row.meeting_link) ? row.meeting_link : null;

        const availableActions = ["view"];
        if (meetingLink && (row.booking_status === "active" || row.session_status === "scheduled")) {
          availableActions.push("join");
        }
        if (isPending && isMentor) {
          availableActions.push("respond");
        }

        events.push({
          id: `mentorship-${row.booking_id}${row.session_id ? `-${row.session_id}` : ""}`,
          sourceType: "mentorship",
          sourceId: row.booking_id,
          sessionId: row.session_id || null,
          title: row.topic || "Mentorship Session",
          description: row.description || "",
          startAt,
          endAt,
          durationMinutes,
          status: hasSession ? (row.session_status || "scheduled") : row.booking_status,
          isPending,
          meetingLink,
          participantRole: isMentor ? "mentor" : "student",
          partner,
          detailRoute: "/mentorship",
          availableActions,
          timezone: DEFAULT_TIMEZONE,
        });
      }
    }

    // 2. LIVE LEARNING SESSIONS
    if (role === "mentor" || role === "student" || role === "admin") {
      let liveQuery = "";
      const liveParams = [];

      if (role === "mentor") {
        liveQuery = `
          SELECT ls.id, ls.title, ls.description, ls.category, ls.level,
                 ls.scheduled_time, ls.duration_minutes, ls.max_participants,
                 ls.meeting_link, ls.status, ls.mentor_id,
                 u.full_name AS mentor_name, u.avatar_url AS mentor_avatar,
                 COUNT(sp.id) AS attendee_count
          FROM learning_sessions ls
          JOIN users u ON u.id = ls.mentor_id
          LEFT JOIN session_participants sp ON sp.session_id = ls.id
          WHERE ls.mentor_id = ? AND ls.status IN ('scheduled', 'ongoing', 'completed')
          GROUP BY ls.id
          ORDER BY ls.scheduled_time ASC
        `;
        liveParams.push(userId);
      } else if (role === "student") {
        liveQuery = `
          SELECT ls.id, ls.title, ls.description, ls.category, ls.level,
                 ls.scheduled_time, ls.duration_minutes, ls.max_participants,
                 ls.meeting_link, ls.status, ls.mentor_id,
                 u.full_name AS mentor_name, u.avatar_url AS mentor_avatar,
                 sp.attendance_status
          FROM learning_sessions ls
          JOIN users u ON u.id = ls.mentor_id
          JOIN session_participants sp ON sp.session_id = ls.id AND sp.user_id = ?
          WHERE ls.status IN ('scheduled', 'ongoing', 'completed')
          ORDER BY ls.scheduled_time ASC
        `;
        liveParams.push(userId);
      } else {
        liveQuery = `
          SELECT ls.id, ls.title, ls.description, ls.category, ls.level,
                 ls.scheduled_time, ls.duration_minutes, ls.max_participants,
                 ls.meeting_link, ls.status, ls.mentor_id,
                 u.full_name AS mentor_name, u.avatar_url AS mentor_avatar
          FROM learning_sessions ls
          JOIN users u ON u.id = ls.mentor_id
          ORDER BY ls.scheduled_time ASC LIMIT 50
        `;
      }

      const [liveRows] = await db.query(liveQuery, liveParams);

      for (const row of liveRows) {
        if (!row.scheduled_time) continue;
        const { startAt, endAt, durationMinutes } = computeTimeWindow(
          row.scheduled_time,
          row.duration_minutes || 60
        );
        if (!startAt) continue;

        const isHost = row.mentor_id === userId;
        const meetingLink = row.meeting_link || null;
        const availableActions = ["view"];
        if (meetingLink && (row.status === "scheduled" || row.status === "ongoing")) {
          availableActions.push("join");
        }

        events.push({
          id: `learning-session-${row.id}`,
          sourceType: "learning_session",
          sourceId: row.id,
          title: row.title,
          description: row.description || `Category: ${row.category || "General"} (${row.level || "All Levels"})`,
          startAt,
          endAt,
          durationMinutes,
          status: row.status,
          isPending: false,
          meetingLink,
          participantRole: isHost ? "host" : "attendee",
          partner: {
            id: row.mentor_id,
            name: row.mentor_name,
            avatarUrl: row.mentor_avatar || "",
            role: "mentor",
          },
          detailRoute: "/learning-sessions",
          availableActions,
          timezone: DEFAULT_TIMEZONE,
        });
      }
    }

    // 3. SKILL EXCHANGES
    if (role === "student" || role === "mentor" || role === "admin") {
      let skillQuery = `
        SELECT se.id, se.skill_offered, se.skill_requested, se.message,
               se.status, se.scheduled_date,
               req_u.id AS requester_id, req_u.full_name AS requester_name, req_u.avatar_url AS requester_avatar,
               prov_u.id AS provider_id, prov_u.full_name AS provider_name, prov_u.avatar_url AS provider_avatar
        FROM skill_exchanges se
        JOIN users req_u ON req_u.id = se.requester_id
        JOIN users prov_u ON prov_u.id = se.provider_id
        WHERE se.scheduled_date IS NOT NULL
      `;
      const skillParams = [];

      if (role !== "admin") {
        skillQuery += " AND (se.requester_id = ? OR se.provider_id = ?)";
        skillParams.push(userId, userId);
      }

      skillQuery += " ORDER BY se.scheduled_date ASC";

      const [skillRows] = await db.query(skillQuery, skillParams);

      for (const row of skillRows) {
        const { startAt, endAt, durationMinutes } = computeTimeWindow(row.scheduled_date, 60);
        if (!startAt) continue;

        const isRequester = row.requester_id === userId;
        const partner = isRequester
          ? {
              id: row.provider_id,
              name: row.provider_name,
              avatarUrl: row.provider_avatar || "",
              role: "student",
            }
          : {
              id: row.requester_id,
              name: row.requester_name,
              avatarUrl: row.requester_avatar || "",
              role: "student",
            };

        events.push({
          id: `skill-exchange-${row.id}`,
          sourceType: "skill_exchange",
          sourceId: row.id,
          title: `Skill Swap: ${row.skill_offered} ⇄ ${row.skill_requested}`,
          description: row.message || "Peer skill exchange session",
          startAt,
          endAt,
          durationMinutes,
          status: row.status,
          isPending: row.status === "pending",
          meetingLink: null,
          participantRole: isRequester ? "requester" : "provider",
          partner,
          detailRoute: "/skill-exchange",
          availableActions: ["view"],
          timezone: DEFAULT_TIMEZONE,
        });
      }
    }

    // 4. INTERNSHIP INTERVIEWS
    if (role === "student" || role === "recruiter" || role === "admin") {
      let interviewQuery = `
        SELECT ia.id, ia.interview_scheduled_at, ia.interview_meeting_link, ia.interview_note,
               ia.status AS application_status,
               i.id AS internship_id, i.title AS internship_title, i.company, i.location,
               recruiter.id AS recruiter_id, recruiter.full_name AS recruiter_name,
               student.id AS student_id, student.full_name AS student_name, student.avatar_url AS student_avatar
        FROM internship_applications ia
        JOIN internships i ON i.id = ia.internship_id
        JOIN users recruiter ON recruiter.id = i.posted_by
        JOIN users student ON student.id = ia.student_id
        WHERE ia.interview_scheduled_at IS NOT NULL
      `;
      const interviewParams = [];

      if (role === "student") {
        interviewQuery += " AND ia.student_id = ?";
        interviewParams.push(userId);
      } else if (role === "recruiter") {
        interviewQuery += " AND i.posted_by = ?";
        interviewParams.push(userId);
      }

      interviewQuery += " ORDER BY ia.interview_scheduled_at ASC";

      const [interviewRows] = await db.query(interviewQuery, interviewParams);

      for (const row of interviewRows) {
        const { startAt, endAt, durationMinutes } = computeTimeWindow(row.interview_scheduled_at, 45);
        if (!startAt) continue;

        const isRecruiter = role === "recruiter" || row.recruiter_id === userId;
        const partner = isRecruiter
          ? {
              id: row.student_id,
              name: row.student_name,
              avatarUrl: row.student_avatar || "",
              role: "candidate",
            }
          : {
              id: row.recruiter_id,
              name: `${row.company} (${row.recruiter_name})`,
              avatarUrl: "",
              role: "recruiter",
            };

        const meetingLink = row.interview_meeting_link || null;
        const availableActions = ["view"];
        if (meetingLink) availableActions.push("join");

        events.push({
          id: `interview-${row.id}`,
          sourceType: "interview",
          sourceId: row.id,
          title: `Interview: ${row.internship_title}`,
          description: row.interview_note || `Interview for ${row.internship_title} at ${row.company}`,
          startAt,
          endAt,
          durationMinutes,
          status: "scheduled",
          isPending: false,
          meetingLink,
          participantRole: isRecruiter ? "interviewer" : "candidate",
          partner,
          detailRoute: isRecruiter ? "/recruiter/ats" : "/applications",
          availableActions,
          timezone: DEFAULT_TIMEZONE,
        });
      }
    }

    // Sort all events chronologically
    events.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    // Optional date filter in memory
    let filteredEvents = events;
    if (from) {
      const fromTime = new Date(from).getTime();
      filteredEvents = filteredEvents.filter((e) => new Date(e.endAt).getTime() >= fromTime);
    }
    if (to) {
      const toTime = new Date(to).getTime();
      filteredEvents = filteredEvents.filter((e) => new Date(e.startAt).getTime() <= toTime);
    }

    return res.json({
      timezone: DEFAULT_TIMEZONE,
      total: filteredEvents.length,
      events: filteredEvents,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCalendarEvents,
};
