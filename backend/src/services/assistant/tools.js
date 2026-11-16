// Tools the site assistant can call. Every tool is a read-only, parameterised
// query that returns a small, public-safe result (never emails, phone numbers,
// password hashes or other users' private data). The signed-in user's own
// data is only reachable through get_my_progress, which uses the session's
// user id - never an id supplied by the model.
const db = require("../../config/db");

const LIMIT = 8;
const clip = (value, max = 220) => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};
const like = (value) => `%${String(value).replace(/[\\%_]/g, (c) => `\\${c}`).slice(0, 80)}%`;

const schema = (properties, required = []) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});

const definitions = [
  {
    name: "search_courses",
    description:
      "Search the published course library by topic, technology or skill (e.g. 'React', 'Python', 'design'). Returns title, level, lesson count, duration and the course page link. Call with an empty query to list popular courses.",
    input_schema: schema(
      {
        query: { type: "string", description: "Topic or keyword in English, e.g. 'react'. Empty string lists all." },
        level: { type: "string", enum: ["any", "beginner", "intermediate", "advanced"] },
      },
      ["query", "level"],
    ),
  },
  {
    name: "search_mentors",
    description:
      "Find verified mentors on the platform, optionally by skill. Returns name, profession, company, skills and profile link.",
    input_schema: schema(
      { skill: { type: "string", description: "Skill keyword, or empty string for all mentors." } },
      ["skill"],
    ),
  },
  {
    name: "search_internships",
    description:
      "Find open internships and jobs, optionally by keyword or remote-only. Returns title, company, location, type, deadline and link.",
    input_schema: schema(
      {
        query: { type: "string", description: "Keyword, or empty string for all open positions." },
        remote_only: { type: "boolean" },
      },
      ["query", "remote_only"],
    ),
  },
  {
    name: "search_forum",
    description:
      "Search community forum discussions and questions. Returns title, short excerpt, answer count and link.",
    input_schema: schema(
      { query: { type: "string", description: "Keyword, or empty string for the latest posts." } },
      ["query"],
    ),
  },
  {
    name: "list_career_paths",
    description:
      "List the career roadmaps available on the platform (target role, level, duration, skills).",
    input_schema: schema({}),
  },
  {
    name: "get_my_progress",
    description:
      "Get the signed-in user's own learning progress: enrolled courses with completion percent, skill-exchange requests and current career roadmap. Only works when the user is signed in.",
    input_schema: schema({}),
  },
];

// Strict schemas guarantee the shape; these checks keep values sane anyway,
// because tool input is model output.
const asText = (value) => (typeof value === "string" ? value.trim() : "");

const handlers = {
  async search_courses(input) {
    const query = asText(input.query);
    const level = ["beginner", "intermediate", "advanced"].includes(input.level) ? input.level : null;
    const where = ["c.is_published = 1"];
    const params = [];
    if (query) {
      where.push("(c.title LIKE ? OR c.description LIKE ? OR c.category LIKE ?)");
      params.push(like(query), like(query), like(query));
    }
    if (level) {
      where.push("LOWER(c.level) = ?");
      params.push(level);
    }
    const [rows] = await db.query(
      `SELECT c.slug, c.title, c.level, c.category, c.duration_text, COUNT(l.id) AS lessons
       FROM courses c LEFT JOIN course_lessons l ON l.course_id = c.id
       WHERE ${where.join(" AND ")}
       GROUP BY c.id ORDER BY c.sort_order, c.id LIMIT ${LIMIT}`,
      params,
    );
    return {
      courses: rows.map((r) => ({
        title: r.title, level: r.level, category: r.category, lessons: Number(r.lessons),
        duration: r.duration_text, link: `/courses/${r.slug}`,
      })),
      note: "Lesson PDFs are free for signed-in members; full video access is $12 per course.",
    };
  },

  async search_mentors(input) {
    const skill = asText(input.skill);
    const params = [];
    let filter = "";
    if (skill) {
      filter = "AND (u.skills LIKE ? OR u.profession LIKE ? OR u.bio LIKE ?)";
      params.push(like(skill), like(skill), like(skill));
    }
    const [rows] = await db.query(
      `SELECT u.id, u.full_name, u.profession, u.company, u.skills, u.experience_years
       FROM users u
       WHERE u.role = 'mentor' AND u.is_active = 1 AND u.is_verified = 1 ${filter}
       ORDER BY u.experience_years DESC, u.id LIMIT ${LIMIT}`,
      params,
    );
    return {
      mentors: rows.map((r) => ({
        name: r.full_name, profession: r.profession, company: r.company,
        skills: clip(r.skills, 120), experienceYears: r.experience_years, link: `/mentorship/${r.id}`,
      })),
      browseAll: "/mentorship",
    };
  },

  async search_internships(input) {
    const query = asText(input.query);
    const where = ["i.status = 'open'"];
    const params = [];
    if (query) {
      where.push("(i.title LIKE ? OR i.company LIKE ? OR i.category LIKE ? OR i.requirements LIKE ?)");
      params.push(like(query), like(query), like(query), like(query));
    }
    if (input.remote_only === true) where.push("i.is_remote = 1");
    const [rows] = await db.query(
      `SELECT i.id, i.title, i.company, i.location, i.is_remote, i.internship_type, i.application_deadline
       FROM internships i WHERE ${where.join(" AND ")}
       ORDER BY i.created_at DESC LIMIT ${LIMIT}`,
      params,
    );
    return {
      internships: rows.map((r) => ({
        title: r.title, company: r.company, location: r.location, remote: Boolean(r.is_remote),
        type: r.internship_type, deadline: r.application_deadline, link: "/jobs",
      })),
      browseAll: "/jobs",
    };
  },

  async search_forum(input) {
    const query = asText(input.query);
    const params = [];
    let filter = "";
    if (query) {
      filter = "AND (p.title LIKE ? OR p.body LIKE ?)";
      params.push(like(query), like(query));
    }
    const [rows] = await db.query(
      `SELECT p.id, p.title, p.body, p.post_type, COUNT(a.id) AS answers
       FROM forum_posts p LEFT JOIN forum_answers a ON a.post_id = p.id
       WHERE p.status <> 'hidden' ${filter}
       GROUP BY p.id ORDER BY p.created_at DESC LIMIT ${LIMIT}`,
      params,
    );
    return {
      posts: rows.map((r) => ({
        title: r.title, excerpt: clip(r.body, 160), type: r.post_type,
        answers: Number(r.answers), link: `/forum/${r.id}`,
      })),
      browseAll: "/forum",
    };
  },

  async list_career_paths() {
    const [rows] = await db.query(
      `SELECT id, title, target_role, level, duration_weeks, skills
       FROM career_paths WHERE is_active = 1 ORDER BY title LIMIT ${LIMIT}`,
    );
    return {
      careerPaths: rows.map((r) => ({
        title: r.title, targetRole: r.target_role, level: r.level,
        weeks: r.duration_weeks, skills: clip(r.skills, 160),
      })),
      link: "/career",
    };
  },

  async get_my_progress(input, context) {
    if (!context.user) {
      return { signedIn: false, message: "The user is not signed in. Suggest signing in at /login to track progress." };
    }
    const userId = context.user.id;
    const [courses] = await db.query(
      `SELECT c.title, c.slug, e.progress_percent
       FROM course_enrollments e JOIN courses c ON c.id = e.course_id
       WHERE e.user_id = ? ORDER BY e.updated_at DESC LIMIT ${LIMIT}`,
      [userId],
    );
    const [exchanges] = await db.query(
      `SELECT skill_offered, skill_requested, status, progress_percent
       FROM skill_exchanges WHERE requester_id = ? OR provider_id = ?
       ORDER BY updated_at DESC LIMIT ${LIMIT}`,
      [userId, userId],
    );
    const [roadmaps] = await db.query(
      `SELECT cp.title FROM user_career_roadmaps r JOIN career_paths cp ON cp.id = r.path_id
       WHERE r.user_id = ? AND r.is_current = 1 LIMIT 1`,
      [userId],
    );
    return {
      signedIn: true,
      name: context.user.fullName || context.user.full_name || null,
      role: context.user.role,
      enrolledCourses: courses.map((r) => ({ title: r.title, progressPercent: r.progress_percent, link: `/courses/${r.slug}` })),
      skillExchanges: exchanges.map((r) => ({ offered: r.skill_offered, requested: r.skill_requested, status: r.status, progressPercent: r.progress_percent })),
      currentRoadmap: roadmaps[0]?.title || null,
    };
  },
};

const runTool = async (name, input, context) => {
  const handler = Object.prototype.hasOwnProperty.call(handlers, name) ? handlers[name] : null;
  if (!handler) return { isError: true, content: `Unknown tool: ${name}` };
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { isError: true, content: "Tool input must be an object." };
  }
  try {
    return { isError: false, content: JSON.stringify(await handler(input, context)) };
  } catch (error) {
    console.error(`Assistant tool ${name} failed:`, error.message);
    return { isError: true, content: "The database lookup failed. Tell the user to try again later." };
  }
};

module.exports = { definitions, runTool, handlers };
