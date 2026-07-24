const db = require("../config/db");

const run = async () => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.query(
      `SELECT id, role FROM users
       WHERE is_active = 1
       ORDER BY FIELD(role, 'mentor', 'admin', 'student', 'user'), id`,
    );
    const mentors = users.filter((user) => user.role === "mentor");
    const members = users.filter((user) => ["student", "user"].includes(user.role));
    if (!mentors.length || !members.length) {
      throw new Error("Demo content needs at least one mentor and one student.");
    }

    const [categories] = await connection.query(
      "SELECT id, slug FROM forum_categories",
    );
    const categoryBySlug = Object.fromEntries(
      categories.map((category) => [category.slug, category.id]),
    );
    const posts = [
      {
        authorId: members[0].id,
        category: "programming",
        title: "How should I structure a React portfolio for internship applications?",
        body: "I have three small React projects and want to present them professionally. Which sections, screenshots, technical details, and deployment links should I include so recruiters can quickly understand my work?",
        type: "question",
        views: 48,
      },
      {
        authorId: mentors[0].id,
        category: "career",
        title: "A practical four-week plan for preparing for a junior developer interview",
        body: "This discussion shares a realistic weekly plan covering portfolio cleanup, JavaScript fundamentals, problem solving, mock interviews, communication practice, and thoughtful questions to ask an employer.",
        type: "discussion",
        views: 76,
      },
      {
        authorId: members[1]?.id || members[0].id,
        category: "design",
        title: "What makes a student dashboard feel clear instead of crowded?",
        body: "I am improving a final-year project dashboard. I would appreciate advice about visual hierarchy, spacing, card density, responsive navigation, and how much information should appear above the fold.",
        type: "question",
        views: 35,
      },
      {
        authorId: mentors[1]?.id || mentors[0].id,
        category: "internship",
        title: "Internship application checklist: CV, portfolio, and follow-up",
        body: "Before applying, verify that your CV matches the role, portfolio links work, project descriptions explain your contribution, and contact details are current. After applying, track the status and follow up professionally.",
        type: "discussion",
        views: 62,
      },
    ];

    for (const post of posts) {
      const categoryId = categoryBySlug[post.category];
      if (!categoryId) continue;
      await connection.query(
        `INSERT INTO forum_posts
           (author_id, category_id, title, body, post_type, status, views_count)
         SELECT ?, ?, ?, ?, ?, 'published', ?
         WHERE NOT EXISTS (
           SELECT 1 FROM forum_posts WHERE title = ?
         )`,
        [
          post.authorId,
          categoryId,
          post.title,
          post.body,
          post.type,
          post.views,
          post.title,
        ],
      );
    }

    const [[portfolioPost]] = await connection.query(
      "SELECT id FROM forum_posts WHERE title = ? LIMIT 1",
      [posts[0].title],
    );
    if (portfolioPost) {
      const answer =
        "Use a short introduction, featured projects, skills, experience, and contact sections. For every project, show the problem, your role, the technology, one measurable result, a live demo, and the source repository. Keep the strongest project first.";
      await connection.query(
        `INSERT INTO forum_answers (post_id, author_id, body, is_accepted)
         SELECT ?, ?, ?, 1
         WHERE NOT EXISTS (
           SELECT 1 FROM forum_answers WHERE post_id = ? AND body = ?
         )`,
        [portfolioPost.id, mentors[0].id, answer, portfolioPost.id, answer],
      );
    }

    const sessions = [
      {
        title: "Build a Job-Ready React Portfolio",
        description:
          "A practical workshop for turning student projects into clear portfolio case studies with responsive React components.",
        category: "Programming",
        level: "beginner",
        mentorId: mentors[0].id,
        dayOffset: 3,
        duration: 75,
        capacity: 35,
        materials: ["Portfolio checklist", "Project case-study template"],
      },
      {
        title: "CV and Interview Clinic for Internships",
        description:
          "Review strong CV structure, prepare concise project stories, and practice common internship interview questions.",
        category: "Career",
        level: "all",
        mentorId: mentors[1]?.id || mentors[0].id,
        dayOffset: 6,
        duration: 60,
        capacity: 45,
        materials: ["CV checklist", "Interview preparation worksheet"],
      },
      {
        title: "UI/UX Review: Make Your Final Project Feel Professional",
        description:
          "Learn how spacing, typography, hierarchy, color, and responsive layouts improve the clarity of a final-year project.",
        category: "Design",
        level: "intermediate",
        mentorId: mentors[2]?.id || mentors[0].id,
        dayOffset: 9,
        duration: 90,
        capacity: 30,
        materials: ["UI review rubric", "Responsive design checklist"],
      },
    ];

    for (const session of sessions) {
      await connection.query(
        `INSERT INTO learning_sessions
           (title, description, category, level, mentor_id, scheduled_time,
            registration_deadline, duration_minutes, max_participants,
            meeting_provider, visibility, status, materials)
         SELECT ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY),
                DATE_ADD(NOW(), INTERVAL ? DAY), ?, ?, 'jitsi', 'public',
                'scheduled', ?
         WHERE NOT EXISTS (
           SELECT 1 FROM learning_sessions WHERE title = ?
         )`,
        [
          session.title,
          session.description,
          session.category,
          session.level,
          session.mentorId,
          session.dayOffset,
          session.dayOffset - 1,
          session.duration,
          session.capacity,
          JSON.stringify(session.materials),
          session.title,
        ],
      );
      await connection.query(
        `UPDATE learning_sessions
         SET scheduled_time = DATE_ADD(NOW(), INTERVAL ? DAY),
             registration_deadline = DATE_ADD(NOW(), INTERVAL ? DAY),
             status = 'scheduled', cancel_reason = NULL
         WHERE title = ?`,
        [session.dayOffset, session.dayOffset - 1, session.title],
      );
    }

    await connection.commit();
    const [[forumCount]] = await connection.query(
      "SELECT COUNT(*) AS total FROM forum_posts WHERE status = 'published'",
    );
    const [[sessionCount]] = await connection.query(
      "SELECT COUNT(*) AS total FROM learning_sessions WHERE status = 'scheduled' AND scheduled_time > NOW()",
    );
    console.log(
      `Demo content ready: ${forumCount.total} forum posts and ${sessionCount.total} upcoming learning sessions.`,
    );
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await db.end();
  }
};

run().catch((error) => {
  console.error("Demo content seed failed:", error.stack || error.message);
  process.exitCode = 1;
});
