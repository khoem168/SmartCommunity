const db = require("../config/db");
const { uploadImage } = require("../services/imageUploadService");
const { uploadDocument } = require("../services/documentUploadService");
const {
  createNotification,
  createNotifications,
} = require("../services/notificationDeliveryService");

const cleanUrl = (value) => {
  if (!value) return null;
  try {
    const url = new URL(String(value));
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
const splitList = (value) =>
  Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : String(value || "")
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);

const formatCompany = (row) => ({
  id: row.id,
  ownerId: row.owner_id,
  name: row.name,
  description: row.description,
  industry: row.industry,
  website: row.website,
  contactEmail: row.contact_email,
  phone: row.phone,
  location: row.location,
  companySize: row.company_size,
  logoUrl: row.logo_url,
  isVerified: Boolean(row.is_verified),
  createdAt: row.created_at,
});

const formatInternship = (row) => ({
  id: row.id,
  title: row.title,
  category: row.category,
  company: row.company,
  companyProfileId: row.company_profile_id,
  companyLogo: row.company_logo,
  companyDescription: row.company_description,
  description: row.description,
  requirements: splitList(row.requirements),
  responsibilities: splitList(row.responsibilities),
  location: row.location,
  isRemote: Boolean(row.is_remote),
  internshipType: row.internship_type,
  durationWeeks: row.duration_weeks,
  stipend: row.stipend,
  stipendAmount: row.stipend_amount === null ? null : Number(row.stipend_amount),
  openings: Number(row.openings || 1),
  postedBy: row.posted_by,
  applicationDeadline: row.application_deadline,
  startDate: row.start_date,
  status: row.status,
  applicationCount: Number(row.application_count || 0),
  hasApplied: Boolean(row.has_applied),
  createdAt: row.created_at,
  // Retain compatibility with the existing jobs UI while it is upgraded.
  is_remote: Boolean(row.is_remote),
  internship_type: row.internship_type,
  application_deadline: row.application_deadline,
});

const internshipSelect = `
  SELECT i.*, cp.description AS company_description,
         COUNT(DISTINCT ia.id) AS application_count
  FROM internships i
  LEFT JOIN company_profiles cp ON cp.id = i.company_profile_id
  LEFT JOIN internship_applications ia ON ia.internship_id = i.id
`;

const getInternships = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `${internshipSelect}
       WHERE i.status = 'open'
       GROUP BY i.id, cp.description
       ORDER BY i.created_at DESC`,
    );
    const query = String(req.query.q || "").trim().toLowerCase();
    const type = String(req.query.type || "").trim();
    const remote = String(req.query.remote || "") === "true";
    const internships = rows.map(formatInternship).filter((item) => {
      const searchText = [
        item.title,
        item.company,
        item.category,
        item.description,
        ...item.requirements,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        (!query || searchText.includes(query)) &&
        (!type || item.internshipType === type) &&
        (!remote || item.isRemote)
      );
    });
    return res.json({ internships });
  } catch (err) {
    return next(err);
  }
};

const getCompanyProfile = async (req, res, next) => {
  try {
    const [rows] = await db.query("SELECT * FROM company_profiles WHERE owner_id = ?", [
      req.user.id,
    ]);
    return res.json({ company: rows[0] ? formatCompany(rows[0]) : null });
  } catch (err) {
    return next(err);
  }
};

const upsertCompanyProfile = async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const contactEmail = String(req.body.contactEmail || req.user.email || "").trim();
    const website = cleanUrl(req.body.website);
    if (!name || !isEmail(contactEmail)) {
      return res.status(400).json({ error: "Company name and a valid contact email are required." });
    }
    if (req.body.website && !website) {
      return res.status(400).json({ error: "Enter a valid company website URL." });
    }
    await db.query(
      `INSERT INTO company_profiles
       (owner_id, name, description, industry, website, contact_email,
        phone, location, company_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description),
         industry = VALUES(industry), website = VALUES(website),
         contact_email = VALUES(contact_email), phone = VALUES(phone),
         location = VALUES(location), company_size = VALUES(company_size)`,
      [
        req.user.id,
        name.slice(0, 150),
        String(req.body.description || "").trim().slice(0, 3000) || null,
        String(req.body.industry || "").trim().slice(0, 120) || null,
        website,
        contactEmail.slice(0, 255),
        String(req.body.phone || "").trim().slice(0, 50) || null,
        String(req.body.location || "").trim().slice(0, 200) || null,
        String(req.body.companySize || "").trim().slice(0, 80) || null,
      ],
    );
    await db.query("UPDATE users SET company = ? WHERE id = ?", [name.slice(0, 100), req.user.id]);
    const [rows] = await db.query("SELECT * FROM company_profiles WHERE owner_id = ?", [
      req.user.id,
    ]);
    return res.json({ message: "Company profile saved.", company: formatCompany(rows[0]) });
  } catch (err) {
    return next(err);
  }
};

const uploadCompanyLogo = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Choose a company logo image." });
    const [rows] = await db.query("SELECT id FROM company_profiles WHERE owner_id = ?", [
      req.user.id,
    ]);
    if (!rows.length) return res.status(400).json({ error: "Create your company profile first." });
    const uploaded = await uploadImage(req.file, {
      folder: "company-logos",
      publicId: `company-${rows[0].id}`,
    });
    await db.query("UPDATE company_profiles SET logo_url = ? WHERE id = ?", [
      uploaded.url,
      rows[0].id,
    ]);
    await db.query("UPDATE internships SET company_logo = ? WHERE company_profile_id = ?", [
      uploaded.url,
      rows[0].id,
    ]);
    return res.json({ message: "Company logo uploaded.", logoUrl: uploaded.url });
  } catch (err) {
    return next(err);
  }
};

const createInternship = async (req, res, next) => {
  try {
    const title = String(req.body.title || req.body.jobTitle || "").trim();
    const description = String(req.body.description || "").trim();
    const requirements = splitList(req.body.requirements || req.body.candidateSkills);
    const responsibilities = splitList(req.body.responsibilities);
    const internshipType = String(req.body.internshipType || "full_time");
    const applicationDeadline = String(req.body.applicationDeadline || "").trim() || null;
    const startDate = String(req.body.startDate || "").trim() || null;
    const durationWeeks = Number(req.body.durationWeeks || 0) || null;
    const openings = Number(req.body.openings || 1);
    const stipendAmount =
      req.body.stipendAmount === "" || req.body.stipendAmount === undefined || req.body.stipendAmount === null
        ? null
        : Number(req.body.stipendAmount);
    if (!title || !description || !requirements.length) {
      return res.status(400).json({ error: "Title, description, and requirements are required." });
    }
    if (!["full_time", "part_time", "virtual"].includes(internshipType)) {
      return res.status(400).json({ error: "Choose a valid internship type." });
    }
    if (!Number.isInteger(openings) || openings < 1 || openings > 1000) {
      return res.status(400).json({ error: "Openings must be between 1 and 1000." });
    }
    if (stipendAmount !== null && (!Number.isFinite(stipendAmount) || stipendAmount < 0)) {
      return res.status(400).json({ error: "Enter a valid stipend amount." });
    }
    const [companies] = await db.query("SELECT * FROM company_profiles WHERE owner_id = ?", [
      req.user.id,
    ]);
    const company = companies[0];
    if (!company) {
      return res.status(400).json({ error: "Create your company profile before posting an internship." });
    }
    const isVerified =
      req.user.role === "admin" ||
      Boolean(company.is_verified) ||
      company.verification_status === "verified";
    if (!isVerified) {
      return res.status(403).json({
        error: "Your company account is pending verification by an administrator.",
        code: "COMPANY_NOT_VERIFIED",
        verificationStatus: company.verification_status || "pending",
      });
    }
    const [result] = await db.query(
      `INSERT INTO internships
       (company_profile_id, title, category, company, company_logo, contact_email,
        description, requirements, responsibilities, location, is_remote,
        internship_type, duration_weeks, stipend, stipend_amount, openings,
        posted_by, application_deadline, start_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
      [
        company.id,
        title.slice(0, 200),
        String(req.body.category || "").trim().slice(0, 100) || null,
        company.name,
        company.logo_url,
        company.contact_email,
        description.slice(0, 5000),
        requirements.join(", ").slice(0, 3000),
        responsibilities.join(", ").slice(0, 3000) || null,
        String(req.body.location || company.location || "Remote").trim().slice(0, 200),
        req.body.isRemote ? 1 : 0,
        internshipType,
        durationWeeks,
        String(req.body.stipend || "").trim().slice(0, 100) || null,
        stipendAmount,
        openings,
        req.user.id,
        applicationDeadline,
        startDate,
      ],
    );
    const [students] = await db.query(
      `SELECT id FROM users
       WHERE is_active = 1 AND is_verified = 1
         AND role IN ('student', 'user') AND id <> ?`,
      [req.user.id],
    );
    await createNotifications(
      req,
      students.map((student) => student.id),
      {
        type: "internship",
        title: "New internship available",
        message: `${company.name} published ${title}.`,
        link: `/jobs`,
        metadata: { internshipId: result.insertId },
      },
    );
    return res.status(201).json({
      message: "Internship published.",
      internship: { id: result.insertId, title, company: company.name, status: "open" },
    });
  } catch (err) {
    return next(err);
  }
};

const getRecruiterInternships = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `${internshipSelect}
       WHERE i.posted_by = ?
       GROUP BY i.id, cp.description
       ORDER BY i.created_at DESC`,
      [req.user.id],
    );
    return res.json({ internships: rows.map(formatInternship) });
  } catch (err) {
    return next(err);
  }
};

const updateInternshipStatus = async (req, res, next) => {
  try {
    const status = String(req.body.status || "");
    if (!["open", "closed", "filled"].includes(status)) {
      return res.status(400).json({ error: "Choose open, closed, or filled." });
    }
    const [result] = await db.query(
      `UPDATE internships SET status = ?
       WHERE id = ? AND (posted_by = ? OR ? = 'admin')`,
      [status, req.params.internshipId, req.user.id, req.user.role],
    );
    if (!result.affectedRows) return res.status(404).json({ error: "Internship not found." });
    return res.json({ message: `Internship marked ${status}.`, status });
  } catch (err) {
    return next(err);
  }
};

const applyInternship = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Upload your CV as a PDF." });
    if (req.file.buffer.subarray(0, 5).toString() !== "%PDF-") {
      return res.status(400).json({ error: "The uploaded file is not a valid PDF." });
    }
    const [internships] = await db.query(
      `SELECT id, title, posted_by, application_deadline
       FROM internships WHERE id = ? AND status = 'open'`,
      [req.params.internshipId],
    );
    const internship = internships[0];
    if (!internship) return res.status(404).json({ error: "Open internship not found." });
    const deadline = internship.application_deadline
      ? internship.application_deadline instanceof Date
        ? internship.application_deadline.toISOString().slice(0, 10)
        : String(internship.application_deadline).slice(0, 10)
      : null;
    if (deadline && new Date(`${deadline}T23:59:59`).getTime() < Date.now()) {
      return res.status(400).json({ error: "The application deadline has passed." });
    }
    const [existing] = await db.query(
      "SELECT id FROM internship_applications WHERE internship_id = ? AND student_id = ?",
      [internship.id, req.user.id],
    );
    if (existing.length) return res.status(409).json({ error: "You already applied to this internship." });
    const portfolioUrl = cleanUrl(req.body.portfolioUrl);
    if (req.body.portfolioUrl && !portfolioUrl) {
      return res.status(400).json({ error: "Enter a valid portfolio URL." });
    }
    const uploaded = await uploadDocument(req.file, {
      folder: "internship-cvs",
      publicId: `cv-${req.user.id}-${internship.id}-${Date.now()}`,
    });
    const [result] = await db.query(
      `INSERT INTO internship_applications
       (internship_id, student_id, cover_letter, resume_url,
        resume_original_name, portfolio_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        internship.id,
        req.user.id,
        String(req.body.coverLetter || "").trim().slice(0, 5000) || null,
        uploaded.url,
        String(req.file.originalname || "cv.pdf").slice(0, 255),
        portfolioUrl,
      ],
    );
    if (internship.posted_by) {
      await createNotification(req, {
        userId: internship.posted_by,
        type: "internship",
        title: "New internship application",
        message: `${req.user.fullName} applied for ${internship.title}.`,
        link: "/applications",
      });
    }
    return res.status(201).json({
      message: "Application submitted with your CV.",
      application: { id: result.insertId, status: "pending" },
    });
  } catch (err) {
    return next(err);
  }
};

const formatStudentApplication = (row) => ({
  id: row.id,
  internshipId: row.internship_id,
  internshipTitle: row.internship_title,
  company: row.company,
  companyLogo: row.company_logo,
  location: row.location,
  internshipType: row.internship_type,
  stipend: row.stipend,
  coverLetter: row.cover_letter,
  resumeUrl: row.resume_url,
  resumeOriginalName: row.resume_original_name,
  portfolioUrl: row.portfolio_url,
  status: row.status === "accepted" ? "approved" : row.status,
  appliedAt: row.applied_at,
  statusUpdatedAt: row.status_updated_at || row.reviewed_at,
  interviewScheduledAt: row.interview_scheduled_at,
  interviewMeetingLink: row.interview_meeting_link,
  interviewNote: row.interview_note,
  // Note: recruiterNotes / admin_notes are STRICTLY excluded for student privacy
});

const formatRecruiterApplication = (row) => ({
  id: row.id,
  internshipId: row.internship_id,
  internshipTitle: row.internship_title,
  company: row.company,
  studentId: row.student_id,
  studentName: row.student_name,
  studentEmail: row.student_email,
  studentAvatar: row.student_avatar,
  coverLetter: row.cover_letter,
  resumeUrl: row.resume_url,
  resumeOriginalName: row.resume_original_name,
  portfolioUrl: row.portfolio_url,
  status: row.status === "accepted" ? "approved" : row.status,
  recruiterNotes: row.admin_notes,
  appliedAt: row.applied_at,
  statusUpdatedAt: row.status_updated_at || row.reviewed_at,
  interviewScheduledAt: row.interview_scheduled_at,
  interviewMeetingLink: row.interview_meeting_link,
  interviewNote: row.interview_note,
});

const getInternshipApplications = async (req, res, next) => {
  try {
    const isRecruiterOrAdmin = ["recruiter", "admin"].includes(req.user.role);
    const view = req.query.view === "student" ? "student" : isRecruiterOrAdmin ? "recruiter" : "student";

    if (view === "recruiter") {
      const [rows] = await db.query(
        `SELECT ia.*, i.title AS internship_title, i.company,
                student.full_name AS student_name, student.email AS student_email,
                student.avatar_url AS student_avatar
         FROM internship_applications ia
         JOIN internships i ON i.id = ia.internship_id
         JOIN users student ON student.id = ia.student_id
         WHERE i.posted_by = ? OR ? = 'admin'
         ORDER BY ia.applied_at DESC`,
        [req.user.id, req.user.role],
      );
      return res.json({
        applications: rows.map(formatRecruiterApplication),
        view: "recruiter",
      });
    }

    // Student View: Object-level isolation to only own applications
    const [rows] = await db.query(
      `SELECT ia.*, i.title AS internship_title, i.company, i.company_logo,
              i.location, i.internship_type, i.stipend
       FROM internship_applications ia
       JOIN internships i ON i.id = ia.internship_id
       WHERE ia.student_id = ?
       ORDER BY ia.applied_at DESC`,
      [req.user.id],
    );
    return res.json({
      applications: rows.map(formatStudentApplication),
      view: "student",
    });
  } catch (err) {
    return next(err);
  }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const status = String(req.body.status || "");
    const notes = req.body.recruiterNotes !== undefined
      ? (String(req.body.recruiterNotes || "").trim().slice(0, 2000) || null)
      : undefined;
    const interviewScheduledAt = req.body.interviewScheduledAt
      ? new Date(req.body.interviewScheduledAt).toISOString().slice(0, 19).replace("T", " ")
      : null;
    const interviewMeetingLink = cleanUrl(req.body.interviewMeetingLink);
    const interviewNote = String(req.body.interviewNote || "").trim().slice(0, 1000) || null;

    if (!["pending", "reviewed", "shortlisted", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid application status." });
    }

    // Object-level authorization: Ensure recruiter owns the internship
    const [rows] = await db.query(
      `SELECT ia.id, ia.student_id, ia.status AS previous_status, i.title, i.company
       FROM internship_applications ia
       JOIN internships i ON i.id = ia.internship_id
       WHERE ia.id = ? AND (i.posted_by = ? OR ? = 'admin')`,
      [req.params.applicationId, req.user.id, req.user.role],
    );
    const application = rows[0];
    if (!application) {
      return res.status(404).json({ error: "Application not found or unauthorized." });
    }

    let query = `
      UPDATE internship_applications
      SET status = ?,
          status_updated_by = ?,
          status_updated_at = NOW(),
          reviewed_at = NOW()
    `;
    const params = [status, req.user.id];

    if (notes !== undefined) {
      query += `, admin_notes = ?`;
      params.push(notes);
    }
    if (req.body.interviewScheduledAt !== undefined) {
      query += `, interview_scheduled_at = ?`;
      params.push(interviewScheduledAt);
    }
    if (req.body.interviewMeetingLink !== undefined) {
      query += `, interview_meeting_link = ?`;
      params.push(interviewMeetingLink);
    }
    if (req.body.interviewNote !== undefined) {
      query += `, interview_note = ?`;
      params.push(interviewNote);
    }

    query += ` WHERE id = ?`;
    params.push(application.id);

    await db.query(query, params);

    // Context-rich notification to student
    let notifTitle = "Application status updated";
    let notifMsg = `Your application for ${application.title} at ${application.company} is now ${status}.`;
    if (interviewScheduledAt && ["shortlisted", "reviewed"].includes(status)) {
      notifTitle = "Interview Scheduled!";
      notifMsg = `${application.company} scheduled an interview for ${application.title}.`;
    }

    await createNotification(req, {
      userId: application.student_id,
      type: "internship",
      title: notifTitle,
      message: notifMsg,
      link: "/my-applications",
      metadata: {
        applicationId: application.id,
        status,
        interviewScheduledAt,
      },
    });

    return res.json({
      message: `Application status updated to ${status}.`,
      status,
      interviewScheduledAt,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  applyInternship,
  createInternship,
  getCompanyProfile,
  getInternshipApplications,
  getInternships,
  getRecruiterInternships,
  updateApplicationStatus,
  updateInternshipStatus,
  uploadCompanyLogo,
  upsertCompanyProfile,
};
