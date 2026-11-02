const db = require("../config/db");

/**
 * Helper to safely parse JSON skills column
 */
const parseSkills = (skills) => {
  if (!skills) return { teach: [], learn: [] };
  if (typeof skills === "object") return skills;
  try {
    return JSON.parse(skills);
  } catch {
    return { teach: [], learn: [] };
  }
};

/**
 * Truncate text cleanly for search excerpt
 */
const makeExcerpt = (text, maxLength = 160) => {
  if (!text) return "";
  const cleaned = String(text).replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength) + "...";
};

/**
 * GET /api/search
 * Unified search across Courses, Mentors, Jobs, Skill Exchange, and Community
 */
const globalSearch = async (req, res, next) => {
  try {
    const rawQ = req.query.q || "";
    // Preserve Unicode (Khmer and English) using standard NFC normalization
    const q = String(rawQ).normalize("NFC").trim();
    const type = String(req.query.type || "all").toLowerCase();
    const category = req.query.category ? String(req.query.category).trim() : null;
    const level = req.query.level ? String(req.query.level).trim() : null;
    const price = req.query.price ? String(req.query.price).trim() : null;
    const jobType = req.query.jobType ? String(req.query.jobType).trim() : null;
    const sort = String(req.query.sort || "relevance").toLowerCase();

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || (type === "all" ? 6 : 20)));
    const offset = (page - 1) * limit;

    const searchTerm = `%${q}%`;
    const hasQuery = q.length > 0;

    // Response structure
    const results = {
      query: q,
      type,
      counts: {
        all: 0,
        courses: 0,
        mentors: 0,
        jobs: 0,
        skills: 0,
        community: 0,
      },
      data: {
        courses: [],
        mentors: [],
        jobs: [],
        skills: [],
        community: [],
      },
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 1,
      },
    };

    // -------------------------------------------------------------
    // 1. COURSES SEARCH
    // -------------------------------------------------------------
    if (type === "all" || type === "courses") {
      let sqlWhere = "WHERE c.is_published = 1";
      const params = [];

      if (hasQuery) {
        sqlWhere += " AND (c.title LIKE ? OR c.description LIKE ? OR c.category LIKE ? OR c.instructor_name LIKE ?)";
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (category && category !== "All") {
        sqlWhere += " AND c.category = ?";
        params.push(category);
      }

      if (level && level !== "All") {
        sqlWhere += " AND c.level = ?";
        params.push(level);
      }

      if (price && price !== "All") {
        if (price === "Free" || price === "0") {
          sqlWhere += " AND (c.price = 0 OR c.price IS NULL)";
        } else if (price === "Paid") {
          sqlWhere += " AND c.price > 0";
        }
      }

      // Count total courses
      const [countRows] = await db.query(
        `SELECT COUNT(*) AS total FROM courses c ${sqlWhere}`,
        params
      );
      results.counts.courses = Number(countRows[0]?.total || 0);

      // Fetch items
      let orderBy = "ORDER BY c.sort_order ASC, c.id DESC";
      if (sort === "newest") orderBy = "ORDER BY c.created_at DESC";
      if (sort === "price-low") orderBy = "ORDER BY c.price ASC";
      if (sort === "price-high") orderBy = "ORDER BY c.price DESC";

      const queryLimit = type === "all" ? 4 : limit;
      const queryOffset = type === "all" ? 0 : offset;

      const [courseRows] = await db.query(
        `SELECT c.id, c.slug, c.title, c.description, c.category, c.level,
                c.instructor_name, c.thumbnail_url, c.price, c.currency,
                c.duration_text, c.created_at
         FROM courses c
         ${sqlWhere}
         ${orderBy}
         LIMIT ? OFFSET ?`,
        [...params, queryLimit, queryOffset]
      );

      results.data.courses = courseRows.map((c) => ({
        id: `course-${c.id}`,
        databaseId: c.id,
        category: "courses",
        title: c.title,
        slug: c.slug,
        subtitle: c.instructor_name || "Smart Community Instructor",
        description: makeExcerpt(c.description),
        imageUrl: c.thumbnail_url,
        level: c.level,
        courseCategory: c.category,
        price: Number(c.price || 0),
        currency: c.currency || "USD",
        duration: c.duration_text || "Flexible",
        route: `/courses/${c.slug}`,
      }));
    }

    // -------------------------------------------------------------
    // 2. MENTORS SEARCH
    // (Only active verified mentors with approved profile)
    // -------------------------------------------------------------
    if (type === "all" || type === "mentors") {
      let sqlWhere = "WHERE u.role = 'mentor' AND u.is_active = 1 AND u.is_verified = 1";
      const params = [];

      if (hasQuery) {
        sqlWhere += " AND (u.full_name LIKE ? OR u.profession LIKE ? OR u.company LIKE ? OR u.bio LIKE ? OR u.skills LIKE ?)";
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (category && category !== "All") {
        sqlWhere += " AND (u.profession LIKE ? OR u.skills LIKE ?)";
        params.push(`%${category}%`, `%${category}%`);
      }

      const [countRows] = await db.query(
        `SELECT COUNT(*) AS total FROM users u ${sqlWhere}`,
        params
      );
      results.counts.mentors = Number(countRows[0]?.total || 0);

      const queryLimit = type === "all" ? 4 : limit;
      const queryOffset = type === "all" ? 0 : offset;

      const [mentorRows] = await db.query(
        `SELECT u.id, u.full_name, u.profession, u.company, u.bio,
                u.skills, u.avatar_url, u.experience_years, u.location,
                u.is_verified, ma.status as application_status
         FROM users u
         LEFT JOIN mentor_applications ma ON ma.user_id = u.id AND ma.status = 'approved'
         ${sqlWhere}
         ORDER BY u.experience_years DESC, u.full_name ASC
         LIMIT ? OFFSET ?`,
        [...params, queryLimit, queryOffset]
      );

      results.data.mentors = mentorRows.map((m) => {
        const parsed = parseSkills(m.skills);
        const teachSkills = Array.isArray(parsed?.teach) ? parsed.teach : [];
        return {
          id: `mentor-${m.id}`,
          databaseId: m.id,
          category: "mentors",
          title: m.full_name,
          subtitle: `${m.profession || "Expert Mentor"}${m.company ? ` at ${m.company}` : ""}`,
          description: makeExcerpt(m.bio),
          imageUrl: m.avatar_url,
          experienceYears: m.experience_years || 1,
          location: m.location || "Phnom Penh, Cambodia",
          isVerified: Boolean(m.is_verified),
          skills: teachSkills.slice(0, 5),
          route: `/mentorship/${m.id}`,
        };
      });
    }

    // -------------------------------------------------------------
    // 3. JOBS / INTERNSHIPS SEARCH
    // (Only active open opportunities; no private recruiter notes)
    // -------------------------------------------------------------
    if (type === "all" || type === "jobs") {
      let sqlWhere = "WHERE i.status = 'open'";
      const params = [];

      if (hasQuery) {
        sqlWhere += " AND (i.title LIKE ? OR i.company LIKE ? OR i.location LIKE ? OR i.description LIKE ? OR i.requirements LIKE ?)";
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (jobType && jobType !== "All") {
        sqlWhere += " AND i.internship_type = ?";
        params.push(jobType);
      }

      if (category && category !== "All") {
        sqlWhere += " AND i.category = ?";
        params.push(category);
      }

      const [countRows] = await db.query(
        `SELECT COUNT(*) AS total FROM internships i ${sqlWhere}`,
        params
      );
      results.counts.jobs = Number(countRows[0]?.total || 0);

      const queryLimit = type === "all" ? 4 : limit;
      const queryOffset = type === "all" ? 0 : offset;

      const [jobRows] = await db.query(
        `SELECT i.id, i.title, i.company, i.category, i.location,
                i.internship_type, i.is_remote, i.stipend, i.stipend_amount,
                i.description, i.company_logo, i.application_deadline,
                cp.is_verified as company_verified
         FROM internships i
         LEFT JOIN company_profiles cp ON cp.id = i.company_profile_id
         ${sqlWhere}
         ORDER BY i.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, queryLimit, queryOffset]
      );

      results.data.jobs = jobRows.map((j) => ({
        id: `job-${j.id}`,
        databaseId: j.id,
        category: "jobs",
        title: j.title,
        subtitle: j.company,
        description: makeExcerpt(j.description),
        imageUrl: j.company_logo,
        location: j.location || (j.is_remote ? "Remote" : "Phnom Penh"),
        isRemote: Boolean(j.is_remote),
        jobType: j.internship_type || "internship",
        stipend: j.stipend ? `$${j.stipend_amount || "Paid"}` : "Unpaid",
        isCompanyVerified: Boolean(j.company_verified),
        deadline: j.application_deadline,
        route: `/jobs?jobId=${j.id}`,
      }));
    }

    // -------------------------------------------------------------
    // 4. SKILL EXCHANGE SEARCH
    // (Search active members who offer or seek skills)
    // -------------------------------------------------------------
    if (type === "all" || type === "skills") {
      let sqlWhere = "WHERE u.is_active = 1 AND u.role <> 'admin' AND u.skills IS NOT NULL";
      const params = [];

      if (hasQuery) {
        sqlWhere += " AND (u.full_name LIKE ? OR u.profession LIKE ? OR u.skills LIKE ? OR u.bio LIKE ?)";
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      const [countRows] = await db.query(
        `SELECT COUNT(*) AS total FROM users u ${sqlWhere}`,
        params
      );
      results.counts.skills = Number(countRows[0]?.total || 0);

      const queryLimit = type === "all" ? 4 : limit;
      const queryOffset = type === "all" ? 0 : offset;

      const [skillRows] = await db.query(
        `SELECT u.id, u.full_name, u.role, u.profession, u.bio,
                u.skills, u.avatar_url, u.location
         FROM users u
         ${sqlWhere}
         ORDER BY u.id DESC
         LIMIT ? OFFSET ?`,
        [...params, queryLimit, queryOffset]
      );

      results.data.skills = skillRows.map((s) => {
        const parsed = parseSkills(s.skills);
        const teach = Array.isArray(parsed?.teach) ? parsed.teach : [];
        const learn = Array.isArray(parsed?.learn) ? parsed.learn : [];
        return {
          id: `skill-user-${s.id}`,
          databaseId: s.id,
          category: "skills",
          title: s.full_name,
          subtitle: s.profession || (s.role === "student" ? "Student & Learner" : "Community Member"),
          description: makeExcerpt(s.bio || `Offers to teach ${teach.join(", ") || "technology"} and eager to learn ${learn.join(", ") || "new skills"}.`),
          imageUrl: s.avatar_url,
          offeredSkills: teach,
          wantedSkills: learn,
          location: s.location || "Cambodia",
          route: `/discover/${s.id}`,
        };
      });
    }

    // -------------------------------------------------------------
    // 5. COMMUNITY (FORUM) SEARCH
    // (Public discussions and articles)
    // -------------------------------------------------------------
    if (type === "all" || type === "community") {
      let sqlWhere = "WHERE 1 = 1";
      const params = [];

      if (hasQuery) {
        sqlWhere += " AND (fp.title LIKE ? OR fp.body LIKE ?)";
        params.push(searchTerm, searchTerm);
      }

      if (category && category !== "All") {
        sqlWhere += " AND fc.name = ?";
        params.push(category);
      }

      const [countRows] = await db.query(
        `SELECT COUNT(*) AS total
         FROM forum_posts fp
         LEFT JOIN forum_categories fc ON fc.id = fp.category_id
         ${sqlWhere}`,
        params
      );
      results.counts.community = Number(countRows[0]?.total || 0);

      const queryLimit = type === "all" ? 4 : limit;
      const queryOffset = type === "all" ? 0 : offset;

      const [forumRows] = await db.query(
        `SELECT fp.id, fp.title, fp.body, fp.post_type, fp.views_count,
                fp.created_at, author.full_name as author_name,
                author.avatar_url as author_avatar,
                fc.name as category_name
         FROM forum_posts fp
         LEFT JOIN users author ON author.id = fp.author_id
         LEFT JOIN forum_categories fc ON fc.id = fp.category_id
         ${sqlWhere}
         ORDER BY fp.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, queryLimit, queryOffset]
      );

      results.data.community = forumRows.map((f) => ({
        id: `post-${f.id}`,
        databaseId: f.id,
        category: "community",
        title: f.title,
        subtitle: `By ${f.author_name || "Community Member"} · ${f.category_name || "General"}`,
        description: makeExcerpt(f.body),
        imageUrl: f.author_avatar,
        forumCategory: f.category_name || "Discussion",
        viewsCount: f.views_count || 0,
        createdAt: f.created_at,
        route: `/forum/${f.id}`,
      }));
    }

    // Compute all count
    results.counts.all =
      results.counts.courses +
      results.counts.mentors +
      results.counts.jobs +
      results.counts.skills +
      results.counts.community;

    const currentTypeCount = type === "all" ? results.counts.all : results.counts[type] || 0;
    results.pagination.total = currentTypeCount;
    results.pagination.totalPages = Math.max(1, Math.ceil(currentTypeCount / limit));

    return res.json(results);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  globalSearch,
};
