const db = require("../config/db");
const {
  checkBakongTransaction,
  generateCourseKhqr,
  getBakongConfig,
  normalizeBakongCurrency,
} = require("../services/bakongPaymentService");
const {
  createNotification,
} = require("../services/notificationDeliveryService");

const formatCourse = (row) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description,
  category: row.category,
  level: row.level,
  instructor: row.instructor_name,
  thumbnailUrl: row.thumbnail_url,
  price: 12,
  currency: "USD",
  duration: row.duration_text,
  lessonCount: Number(row.lesson_count || 0),
  previewCount: Number(row.preview_count || 0),
  isEnrolled: Boolean(row.is_enrolled),
  progress: Number(row.progress_percent || 0),
});

const paymentPayload = (payment, merchantName) => ({
  id: payment.id,
  courseId: payment.course_id,
  status: payment.status,
  amount: Number(payment.amount),
  currency: payment.currency,
  qrCode: payment.qr_code,
  qrMd5: payment.qr_md5,
  expiresAt:
    payment.qr_expires_at instanceof Date
      ? payment.qr_expires_at.toISOString()
      : payment.qr_expires_at,
  merchantName,
  paidAt: payment.paid_at || null,
  transactionId: payment.transaction_id || null,
});

const getCourses = async (req, res, next) => {
  try {
    const userId = req.user?.id || 0;
    const [rows] = await db.query(
      `SELECT c.*,
              COUNT(DISTINCT l.id) AS lesson_count,
              SUM(CASE WHEN l.is_preview = 1 THEN 1 ELSE 0 END) AS preview_count,
              MAX(CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END) AS is_enrolled,
              COALESCE(MAX(e.progress_percent), 0) AS progress_percent
       FROM courses c
       LEFT JOIN course_lessons l ON l.course_id = c.id
       LEFT JOIN course_enrollments e
         ON e.course_id = c.id AND e.user_id = ?
       WHERE c.is_published = 1
       GROUP BY c.id
       ORDER BY c.sort_order, c.created_at DESC`,
      [userId],
    );
    return res.json({ courses: rows.map(formatCourse) });
  } catch (error) {
    return next(error);
  }
};

const getCourseDetail = async (req, res, next) => {
  try {
    const userId = req.user?.id || 0;
    const rawSlug = req.params.courseSlug;
    const slugOrId = rawSlug === "react-fundamentals" ? "react-modern-web" : rawSlug;
    const isNum = !isNaN(Number(slugOrId));
    const [[course]] = await db.query(
      `SELECT c.*,
              COUNT(DISTINCT l.id) AS lesson_count,
              SUM(CASE WHEN l.is_preview = 1 THEN 1 ELSE 0 END) AS preview_count,
              MAX(CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END) AS is_enrolled,
              COALESCE(MAX(e.progress_percent), 0) AS progress_percent
       FROM courses c
       LEFT JOIN course_lessons l ON l.course_id = c.id
       LEFT JOIN course_enrollments e
         ON e.course_id = c.id AND e.user_id = ?
       WHERE (c.slug = ? OR (1 = ? AND c.id = ?)) AND c.is_published = 1
       GROUP BY c.id`,
      [userId, slugOrId, isNum ? 1 : 0, isNum ? Number(slugOrId) : 0],
    );
    if (!course) return res.status(404).json({ error: "Course not found." });

    const hasVideoAccess = Boolean(course.is_enrolled);
    const hasPdfAccess = Boolean(userId);
    const [lessons] = await db.query(
      `SELECT id, position, title, description, duration_minutes, is_preview, pdf_url
       FROM course_lessons
       WHERE course_id = ?
       ORDER BY position`,
      [course.id],
    );

    return res.json({
      course: {
        ...formatCourse(course),
        highlights: JSON.parse(course.highlights || "[]"),
        lessons: lessons.map((lesson) => ({
          id: lesson.id,
          position: lesson.position,
          title: lesson.title,
          description: lesson.description,
          durationMinutes: lesson.duration_minutes,
          isPreview: Boolean(lesson.is_preview),
          isPdfFree: true,
          pdfUrl: hasPdfAccess ? lesson.pdf_url : null,
          isVideoLocked: !hasVideoAccess,
          isLocked: !hasPdfAccess,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getCourseLesson = async (req, res, next) => {
  try {
    const rawSlug = req.params.courseSlug;
    const slugOrId = rawSlug === "react-fundamentals" ? "react-modern-web" : rawSlug;
    const isNum = !isNaN(Number(slugOrId));
    const [[lesson]] = await db.query(
      `SELECT l.*, c.id AS course_id, c.slug AS course_slug,
              c.title AS course_title, c.is_published
       FROM course_lessons l
       JOIN courses c ON c.id = l.course_id
       WHERE l.id = ? AND (c.slug = ? OR (1 = ? AND c.id = ?))`,
      [Number(req.params.lessonId), slugOrId, isNum ? 1 : 0, isNum ? Number(slugOrId) : 0],
    );
    if (!lesson || !lesson.is_published) {
      return res.status(404).json({ error: "Lesson not found." });
    }

    if (!req.user?.id) {
      return res.status(401).json({
        error: "Please register or sign in to view free lesson PDFs and course videos.",
        code: "AUTH_REQUIRED_FOR_LESSON",
      });
    }

    const [[enrollment]] = await db.query(
      `SELECT id FROM course_enrollments
       WHERE user_id = ? AND course_id = ?`,
      [req.user.id, lesson.course_id],
    );
    const hasVideoAccess = Boolean(enrollment);

    return res.json({
      lesson: {
        id: lesson.id,
        courseId: lesson.course_id,
        courseSlug: lesson.course_slug,
        courseTitle: lesson.course_title,
        position: lesson.position,
        title: lesson.title,
        description: lesson.description,
        durationMinutes: lesson.duration_minutes,
        isPreview: Boolean(lesson.is_preview),
        isPdfFree: true,
        isVideoLocked: !hasVideoAccess,
        videoUrl: hasVideoAccess ? lesson.video_url : null,
        pdfUrl: lesson.pdf_url,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const createCoursePayment = async (req, res, next) => {
  try {
    const courseId = Number(req.params.courseId);
    const [[course]] = await db.query(
      "SELECT * FROM courses WHERE id = ? AND is_published = 1",
      [courseId],
    );
    if (!course) return res.status(404).json({ error: "Course not found." });

    const [[enrollment]] = await db.query(
      "SELECT id FROM course_enrollments WHERE user_id = ? AND course_id = ?",
      [req.user.id, courseId],
    );
    if (enrollment) {
      return res.status(409).json({
        error: "You already have access to this course.",
        code: "COURSE_ALREADY_OWNED",
      });
    }
    if (Number(course.price) <= 0) {
      await db.query(
        `INSERT IGNORE INTO course_enrollments (user_id, course_id)
         VALUES (?, ?)`,
        [req.user.id, courseId],
      );
      return res.status(201).json({ enrolled: true, payment: null });
    }

    const [[existing]] = await db.query(
      `SELECT * FROM course_payments
       WHERE user_id = ? AND course_id = ? AND status = 'pending'
         AND qr_expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [req.user.id, courseId],
    );
    if (existing) {
      return res.json({
        payment: paymentPayload(existing, getBakongConfig().accountName),
      });
    }

    await db.query(
      `UPDATE course_payments
       SET status = 'expired'
       WHERE user_id = ? AND course_id = ? AND status = 'pending'
         AND qr_expires_at <= NOW()`,
      [req.user.id, courseId],
    );

    const effectivePrice = 12;
    const khqr = generateCourseKhqr({
      amount: effectivePrice,
      currency: "USD",
      courseTitle: course.title,
    });
    const [result] = await db.query(
      `INSERT INTO course_payments
         (user_id, course_id, amount, currency, status, payment_method,
          qr_code, qr_md5, qr_expires_at)
       VALUES (?, ?, ?, ?, 'pending', 'khqr', ?, ?, ?)`,
      [
        req.user.id,
        course.id,
        effectivePrice,
        "USD",
        khqr.qrCode,
        khqr.qrMd5,
        khqr.expiresAt,
      ],
    );
    const [[payment]] = await db.query(
      "SELECT * FROM course_payments WHERE id = ?",
      [result.insertId],
    );
    return res.status(201).json({
      payment: paymentPayload(payment, khqr.merchantName),
    });
  } catch (error) {
    if (error.code?.startsWith("BAKONG") || error.code === "KHQR_GENERATION_FAILED") {
      return res.status(503).json({ error: error.message, code: error.code });
    }
    return next(error);
  }
};

const verifyCoursePayment = async (req, res, next) => {
  try {
    const paymentId = Number(req.params.paymentId);
    const [[payment]] = await db.query(
      `SELECT p.*, c.title AS course_title, c.slug AS course_slug
       FROM course_payments p
       JOIN courses c ON c.id = p.course_id
       WHERE p.id = ? AND p.user_id = ?`,
      [paymentId, req.user.id],
    );
    if (!payment) return res.status(404).json({ error: "Payment not found." });

    if (payment.status === "paid") {
      return res.json({
        confirmed: true,
        payment: paymentPayload(payment, getBakongConfig().accountName),
      });
    }
    if (
      payment.status !== "pending" ||
      new Date(payment.qr_expires_at).getTime() <= Date.now()
    ) {
      if (payment.status === "pending") {
        await db.query(
          "UPDATE course_payments SET status = 'expired' WHERE id = ?",
          [payment.id],
        );
      }
      return res.status(410).json({
        error: "This KHQR code has expired. Generate a new payment.",
        code: "KHQR_EXPIRED",
      });
    }

    const transaction = await checkBakongTransaction(payment.qr_md5);
    if (!transaction) {
      return res.json({ confirmed: false, status: "pending" });
    }

    const paidCurrency = normalizeBakongCurrency(transaction.currency);
    const expectedAmount = Number(payment.amount);
    const paidAmount = Number(transaction.amount);
    const merchantAccount = getBakongConfig().accountId.toLowerCase();
    const recipientMatches =
      !transaction.toAccountId ||
      String(transaction.toAccountId).toLowerCase() === merchantAccount;
    const amountMatches =
      paidCurrency === "KHR"
        ? Math.round(paidAmount) === Math.round(expectedAmount)
        : Math.abs(paidAmount - expectedAmount) < 0.001;
    if (
      paidCurrency !== payment.currency ||
      !amountMatches ||
      !recipientMatches
    ) {
      return res.status(409).json({
        error:
          "The received payment recipient, amount, or currency does not match this course.",
        code: "PAYMENT_MISMATCH",
      });
    }

    const connection = await db.getConnection();
    let newlyConfirmed = false;
    try {
      await connection.beginTransaction();
      const [paymentUpdate] = await connection.query(
        `UPDATE course_payments
         SET status = 'paid', paid_at = ?, transaction_id = ?,
             bakong_hash = ?, from_account_id = ?, to_account_id = ?
         WHERE id = ? AND status = 'pending'`,
        [
          transaction.acknowledgedDateMs
            ? new Date(Number(transaction.acknowledgedDateMs))
            : new Date(),
          transaction.hash,
          transaction.hash,
          transaction.fromAccountId || null,
          transaction.toAccountId || null,
          payment.id,
        ],
      );
      newlyConfirmed = paymentUpdate.affectedRows === 1;
      await connection.query(
        `INSERT IGNORE INTO course_enrollments
           (user_id, course_id, payment_id)
         VALUES (?, ?, ?)`,
        [req.user.id, payment.course_id, payment.id],
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    if (newlyConfirmed) {
      const securityAlerts = require("../services/securityAlertService");
      securityAlerts.notifyPaymentSuccess({
        userName: req.user.fullName || req.user.full_name,
        userEmail: req.user.email,
        courseTitle: payment.course_title || `Course #${payment.course_id}`,
        amount: payment.amount,
        currency: payment.currency || "USD",
        orderId: payment.id,
      });
      await createNotification(req, {
        userId: req.user.id,
        type: "system",
        title: "Course unlocked",
        message: `${payment.course_title} is now available in your learning library.`,
        link: `/courses/${payment.course_slug}`,
        metadata: { courseId: payment.course_id, paymentId: payment.id },
      });
    }

    const [[confirmedPayment]] = await db.query(
      "SELECT * FROM course_payments WHERE id = ?",
      [payment.id],
    );
    return res.json({
      confirmed: true,
      courseSlug: payment.course_slug,
      payment: paymentPayload(
        confirmedPayment,
        getBakongConfig().accountName,
      ),
    });
  } catch (error) {
    if (error.name === "TimeoutError") {
      return res.status(504).json({
        error: "Bakong verification timed out. We will try again.",
      });
    }
    if (error.code?.startsWith("BAKONG")) {
      return res.status(503).json({ error: error.message, code: error.code });
    }
    return next(error);
  }
};

module.exports = {
  createCoursePayment,
  getCourseDetail,
  getCourseLesson,
  getCourses,
  verifyCoursePayment,
};
