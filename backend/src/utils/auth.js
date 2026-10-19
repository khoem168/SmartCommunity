const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === "production"
    ? ""
    : "local-development-secret-change-before-hosting");
const JWT_ISSUER = process.env.JWT_ISSUER || "smart-community-api";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "smart-community-web";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";
const JWT_REMEMBER_EXPIRES_IN =
  process.env.JWT_REMEMBER_EXPIRES_IN || "30d";
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

const HASH_ITERATIONS = 310000;
const HASH_KEY_LENGTH = 32;
const HASH_DIGEST = "sha256";

const safeCompare = (left, right) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const validatePassword = (password) => {
  const value = String(password || "");
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (Buffer.byteLength(value, "utf8") > 72) {
    return "Password must not exceed 72 UTF-8 bytes.";
  }
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    return "Password must include uppercase, lowercase, and number characters.";
  }
  return null;
};

const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);

const verifyLegacyPbkdf2Password = (password, storedHash) => {
  if (!storedHash?.startsWith("pbkdf2$")) return false;
  const [, iterationValue, salt, expectedHash] = storedHash.split("$");
  const iterations = Number(iterationValue);
  if (!iterations || !salt || !expectedHash) return false;

  const actualHash = crypto
    .pbkdf2Sync(password, salt, iterations, HASH_KEY_LENGTH, HASH_DIGEST)
    .toString("hex");
  return safeCompare(actualHash, expectedHash);
};

const verifyPassword = async (password, storedHash) => {
  if (!storedHash) return false;
  if (/^\$2[aby]\$/.test(storedHash)) {
    return bcrypt.compare(password, storedHash);
  }
  return verifyLegacyPbkdf2Password(password, storedHash);
};

const passwordHashNeedsUpgrade = (storedHash) =>
  Boolean(storedHash) && !/^\$2[aby]\$/.test(storedHash);

const isPlaceholderHash = (storedHash) =>
  typeof storedHash === "string" && storedHash.startsWith("$2a$10$rVqCqKqK");

const demoPasswordForRole = (role) => {
  if (role === "admin") return "admin123";
  if (role === "mentor") return "mentor123";
  return "student123";
};

const signToken = (user, { rememberMe = false } = {}) =>
  jwt.sign(
    { email: user.email, role: user.role },
    JWT_SECRET,
    {
      algorithm: "HS256",
      subject: String(user.id),
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn: rememberMe ? JWT_REMEMBER_EXPIRES_IN : JWT_EXPIRES_IN,
    },
  );

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  } catch {
    return null;
  }
};

const normalizeRole = (role, allowAdmin = false) => {
  const normalized = role === "user" ? "student" : role;
  const allowed = allowAdmin
    ? ["student", "mentor", "recruiter", "admin"]
    : ["student", "mentor", "recruiter"];

  return allowed.includes(normalized) ? normalized : "student";
};

const parseSkills = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const sanitizeUser = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name || row.fullName,
    phone: row.phone,
    role: normalizeRole(row.role, true),
    bio: row.bio,
    avatarUrl: row.avatar_url || row.avatarUrl || "",
    skills: parseSkills(row.skills),
    darkMode: Boolean(parseSkills(row.skills)?.preferences?.darkMode),
    availability: parseSkills(row.skills)?.availability || "Flexible schedule",
    profession: row.profession,
    company: row.company,
    experienceYears: row.experience_years || 0,
    location: row.location,
    githubUrl: row.github_url || row.githubUrl || "",
    linkedinUrl: row.linkedin_url || row.linkedinUrl || "",
    careerGoal: row.career_goal || row.careerGoal || "",
    interestedSkills: parseSkills(row.interested_skills || row.interestedSkills) || [],
    isVerified: Boolean(row.is_verified),
    isActive: Boolean(row.is_active),
    authProvider: row.auth_provider || "local",
    createdAt: row.created_at,
  };
};

module.exports = {
  demoPasswordForRole,
  hashPassword,
  isPlaceholderHash,
  normalizeRole,
  passwordHashNeedsUpgrade,
  sanitizeUser,
  signToken,
  validatePassword,
  verifyPassword,
  verifyToken,
};
