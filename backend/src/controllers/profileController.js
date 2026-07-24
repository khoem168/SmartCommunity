const db = require("../config/db");
const { sanitizeUser } = require("../utils/auth");
const { uploadImage } = require("../services/imageUploadService");

const userColumns = `
  id, email, full_name, phone, role, bio, avatar_url, skills, profession,
  company, experience_years, location, github_url, linkedin_url, career_goal,
  interested_skills, is_verified, is_active, auth_provider, created_at
`;

const resourceConfigs = {
  education: {
    table: "profile_education",
    fields: {
      institution: "institution",
      degree: "degree",
      fieldOfStudy: "field_of_study",
      startDate: "start_date",
      endDate: "end_date",
      description: "description",
    },
    required: ["institution"],
  },
  experiences: {
    table: "profile_experiences",
    fields: {
      company: "company",
      title: "title",
      employmentType: "employment_type",
      startDate: "start_date",
      endDate: "end_date",
      isCurrent: "is_current",
      description: "description",
    },
    required: ["company", "title"],
    booleanFields: ["isCurrent"],
  },
  certificates: {
    table: "profile_certificates",
    fields: {
      name: "name",
      issuer: "issuer",
      issueDate: "issue_date",
      credentialUrl: "credential_url",
      certificateUrl: "certificate_url",
    },
    required: ["name"],
    urlFields: ["credentialUrl", "certificateUrl"],
  },
  projects: {
    table: "portfolio_projects",
    fields: {
      title: "title",
      description: "description",
      projectUrl: "project_url",
      githubUrl: "github_url",
      imageUrl: "image_url",
      technologies: "technologies",
    },
    required: ["title"],
    urlFields: ["projectUrl", "githubUrl", "imageUrl"],
    jsonFields: ["technologies"],
  },
};

const cleanUrl = (value) => {
  if (!value) return null;
  try {
    const url = new URL(String(value));
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

const buildValues = (config, body, isCreate) => {
  for (const field of config.required || []) {
    if (isCreate && !String(body[field] || "").trim()) {
      const error = new Error(`${field} is required.`);
      error.statusCode = 400;
      throw error;
    }
  }

  const entries = Object.entries(config.fields)
    .filter(([field]) => Object.hasOwn(body, field))
    .map(([field, column]) => {
      let value = body[field];
      if (config.urlFields?.includes(field)) {
        value = cleanUrl(value);
        if (body[field] && !value) {
          const error = new Error(`${field} must be a valid HTTP or HTTPS URL.`);
          error.statusCode = 400;
          throw error;
        }
      } else if (config.booleanFields?.includes(field)) {
        value = value ? 1 : 0;
      } else if (config.jsonFields?.includes(field)) {
        value = JSON.stringify(Array.isArray(value) ? value : []);
      } else if (typeof value === "string") {
        value = value.trim() || null;
      }
      return { column, value };
    });

  if (!entries.length) {
    const error = new Error("No profile fields were provided.");
    error.statusCode = 400;
    throw error;
  }
  return entries;
};

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [[users], [education], [experiences], [certificates], [projects]] =
      await Promise.all([
        db.query(`SELECT ${userColumns} FROM users WHERE id = ?`, [userId]),
        db.query(
          `SELECT id, institution, degree, field_of_study AS fieldOfStudy,
                  start_date AS startDate, end_date AS endDate, description
           FROM profile_education WHERE user_id = ? ORDER BY start_date DESC, id DESC`,
          [userId],
        ),
        db.query(
          `SELECT id, company, title, employment_type AS employmentType,
                  start_date AS startDate, end_date AS endDate,
                  is_current AS isCurrent, description
           FROM profile_experiences WHERE user_id = ?
           ORDER BY is_current DESC, start_date DESC, id DESC`,
          [userId],
        ),
        db.query(
          `SELECT id, name, issuer, issue_date AS issueDate,
                  credential_url AS credentialUrl, certificate_url AS certificateUrl
           FROM profile_certificates WHERE user_id = ? ORDER BY issue_date DESC, id DESC`,
          [userId],
        ),
        db.query(
          `SELECT id, title, description, project_url AS projectUrl,
                  github_url AS githubUrl, image_url AS imageUrl,
                  technologies, created_at AS createdAt
           FROM portfolio_projects WHERE user_id = ? ORDER BY created_at DESC, id DESC`,
          [userId],
        ),
      ]);

    const normalizedProjects = projects.map((project) => {
      try {
        return { ...project, technologies: JSON.parse(project.technologies || "[]") };
      } catch {
        return { ...project, technologies: [] };
      }
    });

    return res.json({
      user: sanitizeUser(users[0]),
      education,
      experiences: experiences.map((item) => ({ ...item, isCurrent: Boolean(item.isCurrent) })),
      certificates,
      projects: normalizedProjects,
    });
  } catch (err) {
    return next(err);
  }
};

const createProfileItem = (resourceName) => async (req, res, next) => {
  try {
    const config = resourceConfigs[resourceName];
    const entries = buildValues(config, req.body, true);
    const columns = entries.map(({ column }) => `\`${column}\``).join(", ");
    const placeholders = entries.map(() => "?").join(", ");
    const values = entries.map(({ value }) => value);
    const [result] = await db.query(
      `INSERT INTO \`${config.table}\` (user_id, ${columns}) VALUES (?, ${placeholders})`,
      [req.user.id, ...values],
    );
    return res.status(201).json({ id: result.insertId, message: "Profile item added." });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    return next(err);
  }
};

const updateProfileItem = (resourceName) => async (req, res, next) => {
  try {
    const config = resourceConfigs[resourceName];
    const entries = buildValues(config, req.body, false);
    const setClause = entries.map(({ column }) => `\`${column}\` = ?`).join(", ");
    const values = entries.map(({ value }) => value);
    const [result] = await db.query(
      `UPDATE \`${config.table}\` SET ${setClause} WHERE id = ? AND user_id = ?`,
      [...values, req.params.itemId, req.user.id],
    );
    if (!result.affectedRows) return res.status(404).json({ error: "Profile item not found." });
    return res.json({ message: "Profile item updated." });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    return next(err);
  }
};

const deleteProfileItem = (resourceName) => async (req, res, next) => {
  try {
    const config = resourceConfigs[resourceName];
    const [result] = await db.query(
      `DELETE FROM \`${config.table}\` WHERE id = ? AND user_id = ?`,
      [req.params.itemId, req.user.id],
    );
    if (!result.affectedRows) return res.status(404).json({ error: "Profile item not found." });
    return res.json({ message: "Profile item removed." });
  } catch (err) {
    return next(err);
  }
};

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Choose an image to upload." });
    const upload = await uploadImage(req.file, {
      folder: "avatars",
      publicId: `user-${req.user.id}-${Date.now()}`,
    });
    await db.query("UPDATE users SET avatar_url = ? WHERE id = ?", [
      upload.url,
      req.user.id,
    ]);
    return res.json({ avatarUrl: upload.url, provider: upload.provider });
  } catch (err) {
    return next(err);
  }
};

const uploadProjectImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Choose an image to upload." });
    const upload = await uploadImage(req.file, {
      folder: "projects",
      publicId: `user-${req.user.id}-project-${Date.now()}`,
    });
    return res.json({ imageUrl: upload.url, provider: upload.provider });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createProfileItem,
  deleteProfileItem,
  getProfile,
  updateProfileItem,
  uploadAvatar,
  uploadProjectImage,
};
