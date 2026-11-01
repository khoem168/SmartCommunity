const db = require("../config/db");
const { sanitizeUser, verifyToken } = require("../utils/auth");

const selectUser = `
  SELECT id, email, full_name, phone, role, bio, avatar_url, skills, profession,
         company, experience_years, location, github_url, linkedin_url, career_goal,
         interested_skills, is_verified, is_active, auth_provider, created_at
  FROM users
  WHERE id = ? AND is_active = 1
`;

const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    const payload = verifyToken(token);

    if (!payload?.sub) {
      return res.status(401).json({ error: "Please login to continue." });
    }

    const [rows] = await db.query(selectUser, [payload.sub]);
    const user = sanitizeUser(rows[0]);

    if (!user) {
      return res.status(401).json({ error: "Your account could not be found." });
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return next();
    const payload = verifyToken(token);
    if (!payload?.sub) return next();
    const [rows] = await db.query(selectUser, [payload.sub]);
    req.user = sanitizeUser(rows[0]) || null;
    return next();
  } catch {
    return next();
  }
};

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: "You do not have access to this action." });
    }

    return next();
  };

const requireVerifiedCompany = async (req, res, next) => {
  if (req.user?.role === "admin") return next();

  if (req.user?.role !== "recruiter") {
    return res.status(403).json({ error: "Only recruiters can perform this action." });
  }

  const [rows] = await db.query(
    "SELECT id, name, verification_status, is_verified FROM company_profiles WHERE owner_id = ?",
    [req.user.id],
  );
  const company = rows[0];

  if (!company) {
    return res.status(403).json({
      error: "Please complete your company profile before posting jobs.",
      code: "COMPANY_PROFILE_REQUIRED",
    });
  }

  const isVerified = Boolean(company.is_verified) || company.verification_status === "verified";
  if (!isVerified) {
    return res.status(403).json({
      error: "Your company account is pending verification by an administrator.",
      code: "COMPANY_NOT_VERIFIED",
      verificationStatus: company.verification_status || "pending",
    });
  }

  req.company = company;
  return next();
};

const requireVerifiedMentor = async (req, res, next) => {
  if (req.user?.role === "admin") return next();

  if (req.user?.role !== "mentor") {
    return res.status(403).json({
      error: "Only verified mentors can perform this action.",
      code: "MENTOR_ROLE_REQUIRED",
    });
  }

  return next();
};

module.exports = {
  optionalAuth,
  requireAuth,
  requireRole,
  requireVerifiedCompany,
  requireVerifiedMentor,
};
