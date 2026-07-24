const db = require("../config/db");
const { createNotification } = require("../services/notificationDeliveryService");

const allowedRoles = new Set(["user", "student", "mentor", "recruiter", "admin"]);
const allowedInternshipStatuses = new Set(["open", "closed", "filled"]);

const logAdminAction = async (
  req,
  action,
  entityType,
  entityId,
  details = null,
) => {
  await db.query(
    `INSERT INTO user_activity_logs
       (user_id, action, entity_type, entity_id, ip_address, user_agent, details)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.id,
      action,
      entityType,
      entityId || null,
      String(req.headers["x-forwarded-for"] || req.ip || "").slice(0, 45) || null,
      String(req.headers["user-agent"] || "").slice(0, 1000) || null,
      details ? JSON.stringify(details) : null,
    ],
  );
};

const pagination = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, offset: (page - 1) * limit };
};

const withPagination = (page, limit, total) => ({
  page,
  limit,
  total: Number(total || 0),
  pages: Math.max(1, Math.ceil(Number(total || 0) / limit)),
});

const getAdminDashboard = async (req, res, next) => {
  try {
    const [[summary], [recentActions]] = await Promise.all([
      db.query(
        `SELECT
          (SELECT COUNT(*) FROM users) AS users,
          (SELECT COUNT(*) FROM users WHERE is_active = 0) AS suspendedUsers,
          (SELECT COUNT(*) FROM mentor_applications WHERE status = 'pending') AS pendingMentors,
          (SELECT COUNT(*) FROM company_profiles WHERE verification_status = 'pending') AS pendingCompanies,
          (SELECT COUNT(*) FROM internships WHERE status = 'open') AS openInternships,
          (SELECT COUNT(*) FROM internship_applications) AS applications,
          (SELECT COUNT(*) FROM forum_posts WHERE status = 'hidden') AS hiddenPosts,
          (SELECT COUNT(*) FROM notifications WHERE is_read = 0) AS unreadNotifications`,
      ),
      db.query(
        `SELECT l.id, l.action, l.entity_type AS entityType,
                l.entity_id AS entityId, l.details,
                l.created_at AS createdAt, u.full_name AS adminName
         FROM user_activity_logs l
         JOIN users u ON u.id = l.user_id
         ORDER BY l.created_at DESC LIMIT 8`,
      ),
    ]);
    return res.json({
      summary: Object.fromEntries(
        Object.entries(summary[0] || {}).map(([key, value]) => [key, Number(value || 0)]),
      ),
      recentActions: recentActions.map((row) => {
        let details = null;
        try {
          details = row.details ? JSON.parse(row.details) : null;
        } catch {
          details = null;
        }
        return { ...row, details };
      }),
    });
  } catch (err) {
    return next(err);
  }
};

const listAdminUsers = async (req, res, next) => {
  try {
    const { page, limit, offset } = pagination(req.query);
    const query = String(req.query.q || "").trim();
    const role = String(req.query.role || "");
    const status = String(req.query.status || "");
    const conditions = ["1 = 1"];
    const params = [];
    if (query) {
      conditions.push("(full_name LIKE ? OR email LIKE ?)");
      params.push(`%${query}%`, `%${query}%`);
    }
    if (allowedRoles.has(role)) {
      conditions.push("role = ?");
      params.push(role);
    }
    if (status === "active" || status === "suspended") {
      conditions.push("is_active = ?");
      params.push(status === "active" ? 1 : 0);
    }
    const where = conditions.join(" AND ");
    const [[countRows], [users]] = await Promise.all([
      db.query(`SELECT COUNT(*) AS total FROM users WHERE ${where}`, params),
      db.query(
        `SELECT id, full_name AS fullName, email, role, is_verified AS isVerified,
                is_active AS isActive, auth_provider AS authProvider,
                suspension_reason AS suspensionReason,
                suspended_at AS suspendedAt, last_login AS lastLogin,
                created_at AS createdAt
         FROM users WHERE ${where}
         ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      ),
    ]);
    return res.json({
      users: users.map((user) => ({
        ...user,
        isVerified: Boolean(user.isVerified),
        isActive: Boolean(user.isActive),
      })),
      pagination: withPagination(page, limit, countRows[0]?.total),
    });
  } catch (err) {
    return next(err);
  }
};

const updateAdminUser = async (req, res, next) => {
  try {
    const body = req.body || {};
    const userId = Number(req.params.userId);
    const [[target]] = await db.query(
      "SELECT id, full_name, role, is_active, is_verified FROM users WHERE id = ?",
      [userId],
    );
    if (!target) return res.status(404).json({ error: "User account not found." });

    const changes = [];
    const values = [];
    const details = {};
    if (Object.hasOwn(body, "fullName")) {
      const fullName = String(body.fullName || "").trim();
      if (fullName.length < 2 || fullName.length > 100) {
        return res.status(400).json({ error: "Name must be 2 to 100 characters." });
      }
      changes.push("full_name = ?");
      values.push(fullName);
      details.fullName = fullName;
    }
    if (Object.hasOwn(body, "role")) {
      const role = String(body.role);
      if (!allowedRoles.has(role)) {
        return res.status(400).json({ error: "Choose a valid account role." });
      }
      if (userId === req.user.id && role !== "admin") {
        return res.status(400).json({ error: "You cannot remove your own administrator role." });
      }
      if (target.role === "admin" && userId !== req.user.id && role !== "admin") {
        return res.status(403).json({ error: "Another administrator role cannot be changed." });
      }
      changes.push("role = ?");
      values.push(role);
      details.role = { from: target.role, to: role };
    }
    if (Object.hasOwn(body, "isVerified")) {
      changes.push("is_verified = ?, email_verified_at = IF(?, COALESCE(email_verified_at, NOW()), NULL)");
      const verified = body.isVerified ? 1 : 0;
      values.push(verified, verified);
      details.isVerified = Boolean(verified);
    }
    if (Object.hasOwn(body, "isActive")) {
      const isActive = body.isActive ? 1 : 0;
      if (userId === req.user.id && !isActive) {
        return res.status(400).json({ error: "You cannot suspend your own account." });
      }
      if (target.role === "admin" && userId !== req.user.id && !isActive) {
        return res.status(403).json({ error: "Another administrator cannot be suspended." });
      }
      const reason = String(body.suspensionReason || "").trim().slice(0, 500);
      changes.push(
        "is_active = ?, suspension_reason = ?, suspended_at = ?, suspended_by = ?",
      );
      values.push(
        isActive,
        isActive ? null : reason || "Suspended by an administrator.",
        isActive ? null : new Date(),
        isActive ? null : req.user.id,
      );
      details.isActive = Boolean(isActive);
      if (!isActive) details.suspensionReason = reason || "Administrative suspension";
    }
    if (!changes.length) {
      return res.status(400).json({ error: "No user changes were provided." });
    }
    await db.query(`UPDATE users SET ${changes.join(", ")} WHERE id = ?`, [
      ...values,
      userId,
    ]);
    await logAdminAction(req, "admin.user.update", "user", userId, details);
    if (Object.hasOwn(body, "isActive") && body.isActive) {
      await createNotification(req, {
        userId,
        type: "system",
        title: "Account restored",
        message: "Your Smart Community account has been restored by an administrator.",
        link: "/dashboard",
      });
    }
    return res.json({ message: "User account updated." });
  } catch (err) {
    return next(err);
  }
};

const listAdminMentorApplications = async (req, res, next) => {
  try {
    const { page, limit, offset } = pagination(req.query);
    const status = ["pending", "approved", "rejected"].includes(req.query.status)
      ? req.query.status
      : "";
    const where = status ? "WHERE ma.status = ?" : "";
    const params = status ? [status] : [];
    const [[statsRows], [countRows], [applications]] = await Promise.all([
      db.query(
        `SELECT COUNT(*) AS total,
                SUM(status = 'pending') AS pending,
                SUM(status = 'approved') AS approved,
                SUM(status = 'rejected') AS rejected
         FROM mentor_applications`,
      ),
      db.query(
        `SELECT COUNT(*) AS total FROM mentor_applications ma ${where}`,
        params,
      ),
      db.query(
        `SELECT ma.id, ma.user_id AS userId, u.full_name AS name, u.email,
                ma.professional_title AS professionalTitle, ma.company,
                ma.expertise, ma.experience_years AS experienceYears,
                ma.motivation, ma.linkedin_url AS linkedinUrl,
                ma.availability, ma.status,
                ma.rejection_reason AS rejectionReason,
                reviewer.full_name AS reviewedBy, ma.reviewed_at AS reviewedAt,
                ma.created_at AS createdAt
         FROM mentor_applications ma
         JOIN users u ON u.id = ma.user_id
         LEFT JOIN users reviewer ON reviewer.id = ma.reviewed_by
         ${where}
         ORDER BY FIELD(ma.status, 'pending', 'approved', 'rejected'), ma.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      ),
    ]);
    return res.json({
      applications,
      stats: Object.fromEntries(
        Object.entries(statsRows[0] || {}).map(([key, value]) => [key, Number(value || 0)]),
      ),
      pagination: withPagination(page, limit, countRows[0]?.total),
    });
  } catch (err) {
    return next(err);
  }
};

const reviewAdminMentorApplication = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const body = req.body || {};
    const status = String(body.status || "");
    const reason = String(body.reason || "").trim().slice(0, 500);
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Choose approved or rejected." });
    }
    if (status === "rejected" && !reason) {
      return res.status(400).json({ error: "Add a rejection reason." });
    }
    await connection.beginTransaction();
    const [[application]] = await connection.query(
      "SELECT id, user_id, status FROM mentor_applications WHERE id = ? FOR UPDATE",
      [req.params.applicationId],
    );
    if (!application) {
      await connection.rollback();
      return res.status(404).json({ error: "Mentor application not found." });
    }
    await connection.query(
      `UPDATE mentor_applications
       SET status = ?, rejection_reason = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [status, status === "rejected" ? reason : null, req.user.id, application.id],
    );
    if (status === "approved") {
      await connection.query("UPDATE users SET role = 'mentor' WHERE id = ?", [
        application.user_id,
      ]);
    }
    await connection.commit();
    await logAdminAction(
      req,
      `admin.mentor.${status}`,
      "mentor_application",
      application.id,
      { userId: application.user_id, reason: reason || null },
    );
    await createNotification(req, {
      userId: application.user_id,
      type: "mentorship",
      title: status === "approved" ? "Mentor application approved" : "Mentor application rejected",
      message:
        status === "approved"
          ? "Your verified mentor profile is now active."
          : `Your mentor application was not approved: ${reason}`,
      link: "/mentorship",
    });
    return res.json({ message: `Mentor application ${status}.` });
  } catch (err) {
    await connection.rollback();
    return next(err);
  } finally {
    connection.release();
  }
};

const listAdminCompanies = async (req, res, next) => {
  try {
    const { page, limit, offset } = pagination(req.query);
    const query = String(req.query.q || "").trim();
    const status = String(req.query.status || "");
    const conditions = ["1 = 1"];
    const params = [];
    if (query) {
      conditions.push("(cp.name LIKE ? OR owner.full_name LIKE ? OR cp.contact_email LIKE ?)");
      params.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }
    if (["pending", "verified", "rejected"].includes(status)) {
      conditions.push("cp.verification_status = ?");
      params.push(status);
    }
    const where = conditions.join(" AND ");
    const [[countRows], [companies]] = await Promise.all([
      db.query(
        `SELECT COUNT(*) AS total FROM company_profiles cp
         JOIN users owner ON owner.id = cp.owner_id WHERE ${where}`,
        params,
      ),
      db.query(
        `SELECT cp.id, cp.name, cp.industry, cp.website,
                cp.contact_email AS contactEmail, cp.location,
                cp.company_size AS companySize, cp.logo_url AS logoUrl,
                cp.verification_status AS verificationStatus,
                cp.rejection_reason AS rejectionReason,
                cp.created_at AS createdAt,
                owner.id AS ownerId, owner.full_name AS ownerName,
                owner.email AS ownerEmail, COUNT(i.id) AS internshipCount
         FROM company_profiles cp
         JOIN users owner ON owner.id = cp.owner_id
         LEFT JOIN internships i ON i.company_profile_id = cp.id
         WHERE ${where}
         GROUP BY cp.id
         ORDER BY FIELD(cp.verification_status, 'pending', 'verified', 'rejected'),
                  cp.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      ),
    ]);
    return res.json({
      companies: companies.map((company) => ({
        ...company,
        internshipCount: Number(company.internshipCount || 0),
      })),
      pagination: withPagination(page, limit, countRows[0]?.total),
    });
  } catch (err) {
    return next(err);
  }
};

const reviewAdminCompany = async (req, res, next) => {
  try {
    const body = req.body || {};
    const status = String(body.status || "");
    const reason = String(body.reason || "").trim().slice(0, 500);
    if (!["pending", "verified", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Choose pending, verified, or rejected." });
    }
    if (status === "rejected" && !reason) {
      return res.status(400).json({ error: "Add a rejection reason." });
    }
    const [[company]] = await db.query(
      "SELECT id, owner_id, name FROM company_profiles WHERE id = ?",
      [req.params.companyId],
    );
    if (!company) return res.status(404).json({ error: "Company not found." });
    await db.query(
      `UPDATE company_profiles
       SET verification_status = ?, is_verified = ?, rejection_reason = ?,
           reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [
        status,
        status === "verified" ? 1 : 0,
        status === "rejected" ? reason : null,
        req.user.id,
        company.id,
      ],
    );
    await logAdminAction(req, `admin.company.${status}`, "company", company.id, {
      name: company.name,
      reason: reason || null,
    });
    await createNotification(req, {
      userId: company.owner_id,
      type: "internship",
      title: `Company profile ${status}`,
      message:
        status === "rejected"
          ? `${company.name} was not verified: ${reason}`
          : `${company.name} is now ${status}.`,
      link: "/applications",
    });
    return res.json({ message: `Company marked ${status}.` });
  } catch (err) {
    return next(err);
  }
};

const listAdminInternships = async (req, res, next) => {
  try {
    const { page, limit, offset } = pagination(req.query);
    const query = String(req.query.q || "").trim();
    const status = String(req.query.status || "");
    const conditions = ["1 = 1"];
    const params = [];
    if (query) {
      conditions.push("(i.title LIKE ? OR i.company LIKE ?)");
      params.push(`%${query}%`, `%${query}%`);
    }
    if (allowedInternshipStatuses.has(status)) {
      conditions.push("i.status = ?");
      params.push(status);
    }
    const where = conditions.join(" AND ");
    const [[countRows], [internships]] = await Promise.all([
      db.query(`SELECT COUNT(*) AS total FROM internships i WHERE ${where}`, params),
      db.query(
        `SELECT i.id, i.title, i.company, i.category, i.location,
                i.internship_type AS internshipType, i.status,
                i.openings, i.application_deadline AS applicationDeadline,
                i.created_at AS createdAt, u.full_name AS postedBy,
                COUNT(ia.id) AS applicationCount
         FROM internships i
         LEFT JOIN users u ON u.id = i.posted_by
         LEFT JOIN internship_applications ia ON ia.internship_id = i.id
         WHERE ${where}
         GROUP BY i.id ORDER BY i.created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      ),
    ]);
    return res.json({
      internships: internships.map((item) => ({
        ...item,
        applicationCount: Number(item.applicationCount || 0),
      })),
      pagination: withPagination(page, limit, countRows[0]?.total),
    });
  } catch (err) {
    return next(err);
  }
};

const updateAdminInternship = async (req, res, next) => {
  try {
    const status = String(req.body?.status || "");
    if (!allowedInternshipStatuses.has(status)) {
      return res.status(400).json({ error: "Choose open, closed, or filled." });
    }
    const [[internship]] = await db.query(
      "SELECT id, title, status, posted_by FROM internships WHERE id = ?",
      [req.params.internshipId],
    );
    if (!internship) return res.status(404).json({ error: "Internship not found." });
    await db.query("UPDATE internships SET status = ? WHERE id = ?", [
      status,
      internship.id,
    ]);
    await logAdminAction(req, "admin.internship.status", "internship", internship.id, {
      title: internship.title,
      from: internship.status,
      to: status,
    });
    if (internship.posted_by) {
      await createNotification(req, {
        userId: internship.posted_by,
        type: "internship",
        title: "Internship status updated by administrator",
        message: `${internship.title} is now ${status}.`,
        link: "/applications",
      });
    }
    return res.json({ message: `Internship marked ${status}.` });
  } catch (err) {
    return next(err);
  }
};

const listAdminAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, offset } = pagination(req.query);
    const [[countRows], [logs]] = await Promise.all([
      db.query("SELECT COUNT(*) AS total FROM user_activity_logs"),
      db.query(
        `SELECT l.id, l.action, l.entity_type AS entityType,
                l.entity_id AS entityId, l.ip_address AS ipAddress,
                l.details, l.created_at AS createdAt,
                u.full_name AS adminName, u.email AS adminEmail
         FROM user_activity_logs l
         JOIN users u ON u.id = l.user_id
         ORDER BY l.created_at DESC LIMIT ? OFFSET ?`,
        [limit, offset],
      ),
    ]);
    return res.json({
      logs: logs.map((row) => {
        let details = null;
        try {
          details = row.details ? JSON.parse(row.details) : null;
        } catch {
          details = null;
        }
        return { ...row, details };
      }),
      pagination: withPagination(page, limit, countRows[0]?.total),
    });
  } catch (err) {
    return next(err);
  }
};

const csvCell = (value) => {
  let text =
    value === null || value === undefined
      ? ""
      : value instanceof Date
        ? value.toISOString()
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};

const exportAdminReport = async (req, res, next) => {
  try {
    const report = String(req.params.report);
    const reports = {
      users: `SELECT id, full_name, email, role, is_verified, is_active,
                     last_login, created_at FROM users ORDER BY created_at DESC`,
      mentors: `SELECT ma.id, u.full_name, u.email, ma.professional_title,
                       ma.company, ma.experience_years, ma.status,
                       ma.reviewed_at, ma.created_at
                FROM mentor_applications ma JOIN users u ON u.id = ma.user_id
                ORDER BY ma.created_at DESC`,
      internships: `SELECT id, title, company, category, location,
                           internship_type, openings, status,
                           application_deadline, created_at
                    FROM internships ORDER BY created_at DESC`,
      applications: `SELECT ia.id, u.full_name AS student, u.email,
                            i.title AS internship, i.company, ia.status,
                            ia.applied_at, ia.reviewed_at
                     FROM internship_applications ia
                     JOIN users u ON u.id = ia.student_id
                     JOIN internships i ON i.id = ia.internship_id
                     ORDER BY ia.applied_at DESC`,
      companies: `SELECT cp.id, cp.name, owner.full_name AS owner,
                         cp.contact_email, cp.industry, cp.location,
                         cp.company_size, cp.verification_status, cp.created_at
                  FROM company_profiles cp
                  JOIN users owner ON owner.id = cp.owner_id
                  ORDER BY cp.created_at DESC`,
      audit: `SELECT l.id, u.full_name AS administrator, l.action,
                     l.entity_type, l.entity_id, l.ip_address,
                     l.details, l.created_at
              FROM user_activity_logs l JOIN users u ON u.id = l.user_id
              ORDER BY l.created_at DESC`,
    };
    if (!Object.hasOwn(reports, report)) {
      return res.status(404).json({ error: "Report type not found." });
    }
    const [rows, fields] = await db.query(reports[report]);
    const headers = fields.map((field) => field.name);
    const csv = [
      headers.map(csvCell).join(","),
      ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
    ].join("\r\n");
    await logAdminAction(req, "admin.report.export", "report", null, {
      report,
      rows: rows.length,
    });
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="smart-community-${report}-${date}.csv"`,
    );
    return res.send(`\uFEFF${csv}`);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  exportAdminReport,
  getAdminDashboard,
  listAdminAuditLogs,
  listAdminCompanies,
  listAdminInternships,
  listAdminMentorApplications,
  listAdminUsers,
  reviewAdminCompany,
  reviewAdminMentorApplication,
  updateAdminInternship,
  updateAdminUser,
};
