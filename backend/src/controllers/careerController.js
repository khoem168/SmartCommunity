const db = require("../config/db");

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
};

const formatPath = (row) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description,
  targetRole: row.target_role,
  level: row.level,
  durationWeeks: Number(row.duration_weeks),
  skills: parseJson(row.skills, []),
  stepCount: Number(row.step_count || 0),
});

const formatStep = (row) => ({
  id: row.id,
  position: Number(row.position),
  title: row.title,
  description: row.description,
  skill: row.skill,
  estimatedHours: Number(row.estimated_hours || 0),
  resources: parseJson(row.resources, []),
  completed: Boolean(row.completed),
  completedAt: row.completed_at || null,
});

const getCareerPaths = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT cp.*, COUNT(cps.id) AS step_count
       FROM career_paths cp
       LEFT JOIN career_path_steps cps ON cps.path_id = cp.id
       WHERE cp.is_active = 1
       GROUP BY cp.id
       ORDER BY cp.title`,
    );
    return res.json({ paths: rows.map(formatPath) });
  } catch (err) {
    return next(err);
  }
};

const getCareerPath = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT cp.*, COUNT(cps.id) AS step_count
       FROM career_paths cp LEFT JOIN career_path_steps cps ON cps.path_id = cp.id
       WHERE cp.id = ? AND cp.is_active = 1 GROUP BY cp.id`,
      [req.params.pathId],
    );
    if (!rows.length) return res.status(404).json({ error: "Career path not found." });
    const [steps] = await db.query(
      "SELECT * FROM career_path_steps WHERE path_id = ? ORDER BY position",
      [rows[0].id],
    );
    return res.json({ path: formatPath(rows[0]), steps: steps.map(formatStep) });
  } catch (err) {
    return next(err);
  }
};

const scorePathForUser = (path, user) => {
  const goal = String(user.careerGoal || "").toLowerCase();
  const profileSkills = user.skills || {};
  const userSkills = [
    ...(profileSkills.teach || []),
    ...(profileSkills.learn || []),
    ...(profileSkills.candidate || []),
    ...(user.interestedSkills || []),
  ].map((item) => String(item).toLowerCase());
  const pathSkills = parseJson(path.skills, []).map((item) => String(item).toLowerCase());
  const skillMatches = pathSkills.filter((skill) =>
    userSkills.some((item) => item.includes(skill) || skill.includes(item)),
  ).length;
  const goalMatch = [path.title, path.target_role]
    .filter(Boolean)
    .some((item) => goal.includes(String(item).toLowerCase().replace(" developer", "")));
  return Math.min(100, 25 + skillMatches * 12 + (goalMatch ? 35 : 0));
};

const getCareerOverview = async (req, res, next) => {
  try {
    const [[roadmapRows], [pathRows], [attemptRows]] = await Promise.all([
      db.query(
        `SELECT ucr.id AS roadmap_id, ucr.started_at, ucr.completed_at,
                cp.*, COUNT(cps.id) AS step_count
         FROM user_career_roadmaps ucr
         JOIN career_paths cp ON cp.id = ucr.path_id
         LEFT JOIN career_path_steps cps ON cps.path_id = cp.id
         WHERE ucr.user_id = ? AND ucr.is_current = 1
         GROUP BY ucr.id, cp.id
         ORDER BY ucr.started_at DESC LIMIT 1`,
        [req.user.id],
      ),
      db.query(
        `SELECT cp.*, COUNT(cps.id) AS step_count
         FROM career_paths cp LEFT JOIN career_path_steps cps ON cps.path_id = cp.id
         WHERE cp.is_active = 1 GROUP BY cp.id ORDER BY cp.title`,
      ),
      db.query(
        `SELECT caa.id, caa.score_percent AS scorePercent,
                caa.competency_scores AS competencyScores,
                caa.recommendations, caa.completed_at AS completedAt,
                ca.title AS assessmentTitle
         FROM career_assessment_attempts caa
         JOIN career_assessments ca ON ca.id = caa.assessment_id
         WHERE caa.user_id = ? ORDER BY caa.completed_at DESC LIMIT 10`,
        [req.user.id],
      ),
    ]);

    let roadmap = null;
    if (roadmapRows[0]) {
      const row = roadmapRows[0];
      const [steps] = await db.query(
        `SELECT cps.*, urs.completed_at,
                CASE WHEN urs.id IS NULL THEN 0 ELSE 1 END AS completed
         FROM career_path_steps cps
         LEFT JOIN user_roadmap_steps urs
           ON urs.step_id = cps.id AND urs.roadmap_id = ?
         WHERE cps.path_id = ? ORDER BY cps.position`,
        [row.roadmap_id, row.id],
      );
      const completedSteps = steps.filter((step) => step.completed).length;
      roadmap = {
        id: row.roadmap_id,
        path: formatPath(row),
        steps: steps.map(formatStep),
        completedSteps,
        progressPercent: steps.length
          ? Math.round((completedSteps / steps.length) * 100)
          : 0,
        startedAt: row.started_at,
        completedAt: row.completed_at,
      };
    }

    const paths = pathRows
      .map((row) => ({ ...formatPath(row), matchScore: scorePathForUser(row, req.user) }))
      .sort((left, right) => right.matchScore - left.matchScore);
    const attempts = attemptRows.map((row) => ({
      ...row,
      competencyScores: parseJson(row.competencyScores, {}),
      recommendations: parseJson(row.recommendations, []),
    }));
    return res.json({
      roadmap,
      recommendedPaths: paths,
      latestAssessment: attempts[0] || null,
      assessmentHistory: attempts,
      stats: {
        roadmapProgress: roadmap?.progressPercent || 0,
        completedSteps: roadmap?.completedSteps || 0,
        assessmentAttempts: attempts.length,
        latestScore: attempts[0]?.scorePercent || 0,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const startCareerRoadmap = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const pathId = Number(req.body.pathId);
    const [paths] = await connection.query(
      "SELECT id, title FROM career_paths WHERE id = ? AND is_active = 1",
      [pathId],
    );
    if (!paths.length) return res.status(404).json({ error: "Career path not found." });
    await connection.beginTransaction();
    await connection.query(
      "UPDATE user_career_roadmaps SET is_current = 0 WHERE user_id = ?",
      [req.user.id],
    );
    const [result] = await connection.query(
      `INSERT INTO user_career_roadmaps (user_id, path_id, is_current)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), is_current = 1,
         completed_at = NULL`,
      [req.user.id, pathId],
    );
    await connection.commit();
    return res.status(201).json({
      message: `${paths[0].title} roadmap selected.`,
      roadmapId: result.insertId,
    });
  } catch (err) {
    await connection.rollback();
    return next(err);
  } finally {
    connection.release();
  }
};

const updateRoadmapStep = async (req, res, next) => {
  try {
    const roadmapId = Number(req.params.roadmapId);
    const stepId = Number(req.params.stepId);
    const completed = Boolean(req.body.completed);
    const [rows] = await db.query(
      `SELECT ucr.id, ucr.path_id
       FROM user_career_roadmaps ucr
       JOIN career_path_steps cps ON cps.path_id = ucr.path_id
       WHERE ucr.id = ? AND ucr.user_id = ? AND cps.id = ?`,
      [roadmapId, req.user.id, stepId],
    );
    if (!rows.length) return res.status(404).json({ error: "Roadmap step not found." });
    if (completed) {
      await db.query(
        "INSERT IGNORE INTO user_roadmap_steps (roadmap_id, step_id) VALUES (?, ?)",
        [roadmapId, stepId],
      );
    } else {
      await db.query(
        "DELETE FROM user_roadmap_steps WHERE roadmap_id = ? AND step_id = ?",
        [roadmapId, stepId],
      );
    }
    const [[counts]] = await db.query(
      `SELECT COUNT(cps.id) AS total,
              COUNT(urs.id) AS completed
       FROM career_path_steps cps
       LEFT JOIN user_roadmap_steps urs
         ON urs.step_id = cps.id AND urs.roadmap_id = ?
       WHERE cps.path_id = ?`,
      [roadmapId, rows[0].path_id],
    );
    const progressPercent = counts.total
      ? Math.round((Number(counts.completed) / Number(counts.total)) * 100)
      : 0;
    await db.query(
      `UPDATE user_career_roadmaps
       SET completed_at = CASE WHEN ? = 100 THEN COALESCE(completed_at, NOW()) ELSE NULL END
       WHERE id = ?`,
      [progressPercent, roadmapId],
    );
    return res.json({
      message: completed ? "Roadmap step completed." : "Roadmap step reopened.",
      completed,
      progressPercent,
    });
  } catch (err) {
    return next(err);
  }
};

const getCareerArticles = async (req, res, next) => {
  try {
    const category = String(req.query.category || "").trim();
    const [rows] = category
      ? await db.query(
          `SELECT id, slug, title, excerpt, category,
                  reading_minutes AS readingMinutes, created_at AS createdAt
           FROM career_articles WHERE is_published = 1 AND category = ?
           ORDER BY created_at DESC`,
          [category],
        )
      : await db.query(
          `SELECT id, slug, title, excerpt, category,
                  reading_minutes AS readingMinutes, created_at AS createdAt
           FROM career_articles WHERE is_published = 1 ORDER BY created_at DESC`,
        );
    return res.json({ articles: rows });
  } catch (err) {
    return next(err);
  }
};

const getCareerArticle = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, slug, title, excerpt, content, category,
              reading_minutes AS readingMinutes, created_at AS createdAt
       FROM career_articles WHERE slug = ? AND is_published = 1`,
      [req.params.slug],
    );
    if (!rows.length) return res.status(404).json({ error: "Career article not found." });
    return res.json({ article: rows[0] });
  } catch (err) {
    return next(err);
  }
};

const getCareerAssessments = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT ca.id, ca.slug, ca.title, ca.description,
              COUNT(caq.id) AS questionCount
       FROM career_assessments ca
       LEFT JOIN career_assessment_questions caq ON caq.assessment_id = ca.id
       WHERE ca.is_active = 1 GROUP BY ca.id ORDER BY ca.title`,
    );
    return res.json({ assessments: rows });
  } catch (err) {
    return next(err);
  }
};

const getCareerAssessment = async (req, res, next) => {
  try {
    const [assessments] = await db.query(
      "SELECT id, slug, title, description FROM career_assessments WHERE id = ? AND is_active = 1",
      [req.params.assessmentId],
    );
    if (!assessments.length) return res.status(404).json({ error: "Assessment not found." });
    const [questions] = await db.query(
      `SELECT id, position, competency, question, options
       FROM career_assessment_questions WHERE assessment_id = ? ORDER BY position`,
      [assessments[0].id],
    );
    return res.json({
      assessment: assessments[0],
      questions: questions.map((question) => ({
        ...question,
        options: parseJson(question.options, []),
      })),
    });
  } catch (err) {
    return next(err);
  }
};

const recommendationByCompetency = {
  "Technical Foundations": "Focus your next roadmap step on core concepts and one small independent project.",
  "Problem Solving": "Practice breaking one problem per day into inputs, smaller tasks, tests, and a reflection.",
  "Project Evidence": "Finish and publish one focused project with decisions, screenshots, and measurable results.",
  "Career Readiness": "Update your CV and portfolio, then schedule weekly interview or application practice.",
};

const submitCareerAssessment = async (req, res, next) => {
  try {
    const [assessments] = await db.query(
      "SELECT id, title FROM career_assessments WHERE id = ? AND is_active = 1",
      [req.params.assessmentId],
    );
    if (!assessments.length) return res.status(404).json({ error: "Assessment not found." });
    const [questions] = await db.query(
      `SELECT id, competency, options FROM career_assessment_questions
       WHERE assessment_id = ? ORDER BY position`,
      [assessments[0].id],
    );
    const submittedAnswers = req.body.answers || {};
    const scored = [];
    for (const question of questions) {
      const options = parseJson(question.options, []);
      const optionIndex = Number(submittedAnswers[question.id]);
      if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= options.length) {
        return res.status(400).json({ error: "Answer every assessment question." });
      }
      scored.push({
        questionId: question.id,
        optionIndex,
        competency: question.competency,
        percent: Math.round(((optionIndex + 1) / options.length) * 100),
      });
    }
    const grouped = {};
    for (const answer of scored) {
      if (!grouped[answer.competency]) grouped[answer.competency] = [];
      grouped[answer.competency].push(answer.percent);
    }
    const competencyScores = Object.fromEntries(
      Object.entries(grouped).map(([competency, scores]) => [
        competency,
        Math.round(scores.reduce((total, score) => total + score, 0) / scores.length),
      ]),
    );
    const scorePercent = Math.round(
      scored.reduce((total, answer) => total + answer.percent, 0) / scored.length,
    );
    const recommendations = Object.entries(competencyScores)
      .filter(([, score]) => score < 75)
      .sort((left, right) => left[1] - right[1])
      .map(([competency]) => recommendationByCompetency[competency]);
    if (!recommendations.length) {
      recommendations.push("You are ready for a challenging portfolio project, mentor feedback, and targeted applications.");
    }
    const [result] = await db.query(
      `INSERT INTO career_assessment_attempts
       (user_id, assessment_id, score_percent, answers,
        competency_scores, recommendations)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        assessments[0].id,
        scorePercent,
        JSON.stringify(scored.map(({ questionId, optionIndex }) => ({ questionId, optionIndex }))),
        JSON.stringify(competencyScores),
        JSON.stringify(recommendations),
      ],
    );
    return res.status(201).json({
      message: "Career readiness assessment completed.",
      attempt: {
        id: result.insertId,
        assessmentTitle: assessments[0].title,
        scorePercent,
        competencyScores,
        recommendations,
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getCareerArticle,
  getCareerArticles,
  getCareerAssessment,
  getCareerAssessments,
  getCareerOverview,
  getCareerPath,
  getCareerPaths,
  startCareerRoadmap,
  submitCareerAssessment,
  updateRoadmapStep,
};
