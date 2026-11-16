// Lesson completion and certificates. Members mark lessons done as they
// study; finishing every lesson in a course issues a certificate with a
// public verification code.
const crypto = require("crypto");
const db = require("../config/db");

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I

const newCode = () => {
  const bytes = crypto.randomBytes(10);
  let code = "";
  for (const byte of bytes) code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return `SC-${code.slice(0, 5)}-${code.slice(5)}`;
};

const findCourse = async (slugParam) => {
  const slugOrId = slugParam === "react-fundamentals" ? "react-modern-web" : slugParam;
  const isNum = !Number.isNaN(Number(slugOrId));
  const [[course]] = await db.query(
    `SELECT id, slug, title FROM courses
     WHERE (slug = ? OR (1 = ? AND id = ?)) AND is_published = 1`,
    [slugOrId, isNum ? 1 : 0, isNum ? Number(slugOrId) : 0],
  );
  return course || null;
};

/** Completed lesson ids, totals and the certificate (if any) for one user. */
const progressFor = async (userId, courseId) => {
  const [[totals]] = await db.query("SELECT COUNT(*) AS total FROM course_lessons WHERE course_id = ?", [courseId]);
  const [done] = await db.query(
    `SELECT c.lesson_id FROM course_lesson_completions c
     JOIN course_lessons l ON l.id = c.lesson_id
     WHERE c.user_id = ? AND l.course_id = ?`,
    [userId, courseId],
  );
  const [[certificate]] = await db.query(
    "SELECT code, issued_at FROM course_certificates WHERE user_id = ? AND course_id = ?",
    [userId, courseId],
  );
  const total = Number(totals.total);
  const completed = done.length;
  return {
    completedLessonIds: done.map((row) => row.lesson_id),
    completed,
    total,
    progressPercent: total ? Math.round((completed / total) * 100) : 0,
    certificate: certificate ? { code: certificate.code, issuedAt: certificate.issued_at } : null,
  };
};

const completeLesson = async (req, res, next) => {
  try {
    const course = await findCourse(req.params.courseSlug);
    if (!course) return res.status(404).json({ error: "Course not found." });
    const lessonId = Number(req.params.lessonId);
    const [[lesson]] = await db.query("SELECT id FROM course_lessons WHERE id = ? AND course_id = ?", [lessonId, course.id]);
    if (!lesson) return res.status(404).json({ error: "Lesson not found." });

    await db.query(
      "INSERT IGNORE INTO course_lesson_completions (user_id, lesson_id) VALUES (?, ?)",
      [req.user.id, lessonId],
    );
    let progress = await progressFor(req.user.id, course.id);
    await db.query(
      "UPDATE course_enrollments SET progress_percent = ?, last_lesson_id = ? WHERE user_id = ? AND course_id = ?",
      [progress.progressPercent, lessonId, req.user.id, course.id],
    );

    let newlyIssued = false;
    if (progress.total > 0 && progress.completed >= progress.total && !progress.certificate) {
      // A unique-key collision on the code is astronomically unlikely; retry once.
      for (let attempt = 0; attempt < 2 && !newlyIssued; attempt += 1) {
        const [result] = await db.query(
          "INSERT IGNORE INTO course_certificates (code, user_id, course_id) VALUES (?, ?, ?)",
          [newCode(), req.user.id, course.id],
        );
        newlyIssued = result.affectedRows === 1;
      }
      progress = await progressFor(req.user.id, course.id);
    }
    return res.json({ ...progress, newlyIssued });
  } catch (error) {
    return next(error);
  }
};

const uncompleteLesson = async (req, res, next) => {
  try {
    const course = await findCourse(req.params.courseSlug);
    if (!course) return res.status(404).json({ error: "Course not found." });
    await db.query(
      `DELETE c FROM course_lesson_completions c
       JOIN course_lessons l ON l.id = c.lesson_id
       WHERE c.user_id = ? AND c.lesson_id = ? AND l.course_id = ?`,
      [req.user.id, Number(req.params.lessonId), course.id],
    );
    // An issued certificate stays valid; it records a completion that happened.
    const progress = await progressFor(req.user.id, course.id);
    await db.query(
      "UPDATE course_enrollments SET progress_percent = ? WHERE user_id = ? AND course_id = ?",
      [progress.progressPercent, req.user.id, course.id],
    );
    return res.json(progress);
  } catch (error) {
    return next(error);
  }
};

const getCourseProgress = async (req, res, next) => {
  try {
    const course = await findCourse(req.params.courseSlug);
    if (!course) return res.status(404).json({ error: "Course not found." });
    return res.json(await progressFor(req.user.id, course.id));
  } catch (error) {
    return next(error);
  }
};

// Public: anyone with the code (or the QR on the certificate) can check it.
const getCertificate = async (req, res, next) => {
  try {
    const code = String(req.params.code || "").toUpperCase().slice(0, 20);
    if (!/^SC-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(code)) {
      return res.status(404).json({ error: "Certificate not found.", code: "CERTIFICATE_NOT_FOUND" });
    }
    const [[row]] = await db.query(
      `SELECT cc.code, cc.issued_at, u.full_name, c.title, c.slug, c.category, c.level, c.duration_text,
              (SELECT COUNT(*) FROM course_lessons l WHERE l.course_id = c.id) AS lessons
       FROM course_certificates cc
       JOIN users u ON u.id = cc.user_id
       JOIN courses c ON c.id = cc.course_id
       WHERE cc.code = ?`,
      [code],
    );
    if (!row) return res.status(404).json({ error: "Certificate not found.", code: "CERTIFICATE_NOT_FOUND" });
    return res.json({
      certificate: {
        code: row.code,
        issuedAt: row.issued_at,
        recipient: row.full_name,
        course: {
          title: row.title, slug: row.slug, category: row.category,
          level: row.level, duration: row.duration_text, lessons: Number(row.lessons),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

const listMyCertificates = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT cc.code, cc.issued_at, c.title, c.slug
       FROM course_certificates cc JOIN courses c ON c.id = cc.course_id
       WHERE cc.user_id = ? ORDER BY cc.issued_at DESC`,
      [req.user.id],
    );
    return res.json({ certificates: rows.map((r) => ({ code: r.code, issuedAt: r.issued_at, courseTitle: r.title, courseSlug: r.slug })) });
  } catch (error) {
    return next(error);
  }
};

module.exports = { completeLesson, uncompleteLesson, getCourseProgress, getCertificate, listMyCertificates, newCode };
