const db = require("../config/db");

const ranges = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "12m": 365,
};

const mysqlDateTime = (date) => date.toISOString().slice(0, 19).replace("T", " ");
const percent = (value, total) =>
  total ? Math.round((Number(value || 0) / Number(total)) * 1000) / 10 : 0;

const createBuckets = (days) => {
  const buckets = [];
  const now = new Date();
  if (days > 90) {
    for (let offset = 11; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      buckets.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: date.toLocaleDateString("en", { month: "short", year: "2-digit" }),
      });
    }
  } else {
    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      buckets.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0",
        )}-${String(date.getDate()).padStart(2, "0")}`,
        label: date.toLocaleDateString("en", {
          month: "short",
          day: "numeric",
        }),
      });
    }
  }
  return buckets;
};

const parseSkills = (value) => {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== "object") return [];
    return [
      ...(Array.isArray(parsed.teach) ? parsed.teach : []),
      ...(Array.isArray(parsed.learn) ? parsed.learn : []),
      ...(Array.isArray(parsed.candidate) ? parsed.candidate : []),
    ];
  } catch {
    return [];
  }
};

const getAdminAnalytics = async (req, res, next) => {
  try {
    const rangeKey = Object.hasOwn(ranges, req.query.range)
      ? req.query.range
      : "30d";
    const days = ranges[rangeKey];
    const fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);
    fromDate.setDate(fromDate.getDate() - days + 1);
    const from = mysqlDateTime(fromDate);
    const bucketFormat = days > 90 ? "%Y-%m" : "%Y-%m-%d";

    const [
      [userSummaryRows],
      [internshipSummaryRows],
      [exchangeSummaryRows],
      [sessionSummaryRows],
      [communitySummaryRows],
      [roleRows],
      [applicationStatusRows],
      [internshipStatusRows],
      [userGrowthRows],
      [applicationGrowthRows],
      [exchangeGrowthRows],
      [sessionGrowthRows],
      [topInternships],
      [mentorPerformance],
      [skillRows],
      [recentActivity],
    ] = await Promise.all([
      db.query(
        `SELECT COUNT(*) AS totalUsers,
                SUM(role = 'mentor') AS totalMentors,
                SUM(role = 'recruiter') AS totalRecruiters,
                SUM(role IN ('student','user')) AS totalStudents,
                SUM(is_verified = 1) AS verifiedUsers,
                SUM(created_at >= ?) AS newUsers
         FROM users WHERE is_active = 1`,
        [from],
      ),
      db.query(
        `SELECT COUNT(*) AS totalInternships,
                SUM(status = 'open') AS openInternships,
                SUM(status = 'filled') AS filledInternships,
                SUM(created_at >= ?) AS newInternships,
                (SELECT COUNT(*) FROM internship_applications) AS totalApplications,
                (SELECT COUNT(*) FROM internship_applications WHERE applied_at >= ?) AS newApplications,
                (SELECT COUNT(*) FROM internship_applications
                 WHERE status IN ('approved','accepted')) AS successfulApplications
         FROM internships`,
        [from, from],
      ),
      db.query(
        `SELECT COUNT(*) AS totalExchanges,
                SUM(status = 'completed') AS completedExchanges,
                SUM(status IN ('pending','accepted')) AS activeExchanges,
                SUM(created_at >= ?) AS newExchanges
         FROM skill_exchanges`,
        [from],
      ),
      db.query(
        `SELECT COUNT(*) AS totalSessions,
                SUM(status = 'completed') AS completedSessions,
                SUM(status IN ('scheduled','ongoing')) AS activeSessions,
                SUM(created_at >= ?) AS newSessions,
                (SELECT COUNT(*) FROM session_participants
                 WHERE attendance_status <> 'cancelled') AS registrations,
                (SELECT COUNT(*) FROM session_participants
                 WHERE attendance_status = 'attended') AS attended
         FROM learning_sessions`,
        [from],
      ),
      db.query(
        `SELECT
           (SELECT COUNT(*) FROM forum_posts WHERE status <> 'hidden') AS forumPosts,
           (SELECT COUNT(*) FROM forum_answers) AS forumAnswers,
           (SELECT COUNT(*) FROM messages WHERE is_deleted = 0) AS messages,
           (SELECT COUNT(*) FROM mentorships) AS mentorships,
           (SELECT COUNT(*) FROM mentor_reviews) AS mentorReviews`,
      ),
      db.query(
        `SELECT role, COUNT(*) AS total
         FROM users WHERE is_active = 1 GROUP BY role ORDER BY total DESC`,
      ),
      db.query(
        `SELECT status, COUNT(*) AS total
         FROM internship_applications GROUP BY status ORDER BY total DESC`,
      ),
      db.query(
        `SELECT status, COUNT(*) AS total
         FROM internships GROUP BY status ORDER BY total DESC`,
      ),
      db.query(
        `SELECT DATE_FORMAT(created_at, ?) AS bucket, COUNT(*) AS total
         FROM users WHERE is_active = 1 AND created_at >= ?
         GROUP BY bucket ORDER BY bucket`,
        [bucketFormat, from],
      ),
      db.query(
        `SELECT DATE_FORMAT(applied_at, ?) AS bucket, COUNT(*) AS total
         FROM internship_applications WHERE applied_at >= ?
         GROUP BY bucket ORDER BY bucket`,
        [bucketFormat, from],
      ),
      db.query(
        `SELECT DATE_FORMAT(created_at, ?) AS bucket, COUNT(*) AS total
         FROM skill_exchanges WHERE created_at >= ?
         GROUP BY bucket ORDER BY bucket`,
        [bucketFormat, from],
      ),
      db.query(
        `SELECT DATE_FORMAT(created_at, ?) AS bucket, COUNT(*) AS total
         FROM learning_sessions WHERE created_at >= ?
         GROUP BY bucket ORDER BY bucket`,
        [bucketFormat, from],
      ),
      db.query(
        `SELECT i.id, i.title, i.company, i.status, i.openings,
                COUNT(ia.id) AS applications,
                SUM(ia.status IN ('approved','accepted')) AS successful
         FROM internships i
         LEFT JOIN internship_applications ia ON ia.internship_id = i.id
         GROUP BY i.id
         ORDER BY applications DESC, i.created_at DESC
         LIMIT 8`,
      ),
      db.query(
        `SELECT u.id, u.full_name AS name, u.profession,
                COUNT(DISTINCT m.id) AS mentorships,
                COUNT(DISTINCT mr.id) AS reviews,
                COALESCE(ROUND(AVG(mr.rating), 1), 0) AS rating
         FROM users u
         LEFT JOIN mentorships m ON m.mentor_id = u.id
         LEFT JOIN mentor_reviews mr ON mr.mentor_id = u.id
         WHERE u.role = 'mentor' AND u.is_active = 1
         GROUP BY u.id
         ORDER BY rating DESC, mentorships DESC
         LIMIT 8`,
      ),
      db.query(
        `SELECT skills FROM users
         WHERE is_active = 1 AND skills IS NOT NULL AND skills <> ''`,
      ),
      db.query(
        `SELECT type, label, createdAt FROM (
           SELECT 'user' AS type, CONCAT(full_name, ' joined the community') AS label,
                  created_at AS createdAt FROM users WHERE is_active = 1
           UNION ALL
           SELECT 'internship', CONCAT(company, ' published ', title), created_at
                  FROM internships
           UNION ALL
           SELECT 'application', CONCAT('Application submitted for ', i.title), ia.applied_at
                  FROM internship_applications ia
                  JOIN internships i ON i.id = ia.internship_id
           UNION ALL
           SELECT 'skill_exchange', CONCAT(skill_offered, ' for ', skill_requested), created_at
                  FROM skill_exchanges
           UNION ALL
           SELECT 'session', CONCAT('Learning session: ', title), created_at
                  FROM learning_sessions
         ) recent
         ORDER BY createdAt DESC
         LIMIT 12`,
      ),
    ]);

    const users = userSummaryRows[0] || {};
    const internships = internshipSummaryRows[0] || {};
    const exchanges = exchangeSummaryRows[0] || {};
    const sessions = sessionSummaryRows[0] || {};
    const community = communitySummaryRows[0] || {};
    const normalizeSkillLabel = (raw) => {
      const s = String(raw || "").trim();
      const lower = s.toLowerCase();
      if (lower === "react" || lower === "react.js") return "React.js";
      if (lower === "node.js" || lower === "node.js & api") return "Node.js";
      if (lower === "sql" || lower === "sql & mysql" || lower === "database") return "SQL & MySQL";
      if (lower === "html" || lower === "css" || lower === "html & css") return "HTML & CSS";
      if (lower === "laravel") return "Laravel";
      if (lower === "aws" || lower === "aws cloud") return "AWS Cloud";
      return s;
    };
    const skillCounts = new Map();
    for (const row of skillRows) {
      const uniqueSkills = new Set(
        parseSkills(row.skills)
          .map(normalizeSkillLabel)
          .filter(Boolean),
      );
      for (const skill of uniqueSkills) {
        skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
      }
    }
    const popularSkills = [...skillCounts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 10)
      .map(([skill, usersCount]) => ({ skill, users: usersCount }));

    const maps = {
      users: new Map(userGrowthRows.map((row) => [row.bucket, Number(row.total)])),
      applications: new Map(
        applicationGrowthRows.map((row) => [row.bucket, Number(row.total)]),
      ),
      exchanges: new Map(
        exchangeGrowthRows.map((row) => [row.bucket, Number(row.total)]),
      ),
      sessions: new Map(
        sessionGrowthRows.map((row) => [row.bucket, Number(row.total)]),
      ),
    };
    const growth = createBuckets(days).map((bucket) => ({
      ...bucket,
      users: maps.users.get(bucket.key) || 0,
      applications: maps.applications.get(bucket.key) || 0,
      exchanges: maps.exchanges.get(bucket.key) || 0,
      sessions: maps.sessions.get(bucket.key) || 0,
    }));

    return res.json({
      range: {
        key: rangeKey,
        days,
        from: fromDate.toISOString(),
        to: new Date().toISOString(),
      },
      summary: {
        totalUsers: Number(users.totalUsers || 0),
        totalMentors: Number(users.totalMentors || 0),
        totalRecruiters: Number(users.totalRecruiters || 0),
        totalStudents: Number(users.totalStudents || 0),
        verifiedUsers: Number(users.verifiedUsers || 0),
        newUsers: Number(users.newUsers || 0),
        totalInternships: Number(internships.totalInternships || 0),
        openInternships: Number(internships.openInternships || 0),
        newInternships: Number(internships.newInternships || 0),
        totalApplications: Number(internships.totalApplications || 0),
        newApplications: Number(internships.newApplications || 0),
        totalExchanges: Number(exchanges.totalExchanges || 0),
        activeExchanges: Number(exchanges.activeExchanges || 0),
        completedExchanges: Number(exchanges.completedExchanges || 0),
        totalSessions: Number(sessions.totalSessions || 0),
        activeSessions: Number(sessions.activeSessions || 0),
        registrations: Number(sessions.registrations || 0),
        forumPosts: Number(community.forumPosts || 0),
        messages: Number(community.messages || 0),
      },
      rates: {
        verification: percent(users.verifiedUsers, users.totalUsers),
        applicationSuccess: percent(
          internships.successfulApplications,
          internships.totalApplications,
        ),
        exchangeCompletion: percent(
          exchanges.completedExchanges,
          exchanges.totalExchanges,
        ),
        sessionAttendance: percent(sessions.attended, sessions.registrations),
      },
      charts: {
        growth,
        roles: roleRows.map((row) => ({
          name: row.role,
          value: Number(row.total),
        })),
        applicationStatuses: applicationStatusRows.map((row) => ({
          name: row.status,
          value: Number(row.total),
        })),
        internshipStatuses: internshipStatusRows.map((row) => ({
          name: row.status,
          value: Number(row.total),
        })),
        popularSkills,
      },
      tables: {
        topInternships: topInternships.map((row) => ({
          ...row,
          openings: Number(row.openings || 0),
          applications: Number(row.applications || 0),
          successful: Number(row.successful || 0),
        })),
        mentorPerformance: mentorPerformance.map((row) => ({
          ...row,
          mentorships: Number(row.mentorships || 0),
          reviews: Number(row.reviews || 0),
          rating: Number(row.rating || 0),
        })),
        recentActivity,
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAdminAnalytics };
