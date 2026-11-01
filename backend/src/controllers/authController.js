const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const db = require("../config/db");
const { isEmailVerificationRequired } = require("../config/authFeatures");
const {
  demoPasswordForRole,
  hashPassword,
  isPlaceholderHash,
  normalizeRole,
  passwordHashNeedsUpgrade,
  sanitizeUser,
  signToken,
  validatePassword,
  verifyPassword,
} = require("../utils/auth");
const { consumeAuthToken, createAuthToken } = require("../utils/authTokens");
const {
  sendPasswordResetEmail,
  sendVerificationEmail,
} = require("../services/emailService");

const userColumns = `
  id, email, full_name, phone, role, bio, avatar_url, skills, profession,
  company, experience_years, location, github_url, linkedin_url, career_goal,
  interested_skills, is_verified, is_active, auth_provider, created_at
`;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const cleanUrl = (value) => {
  if (!value) return null;
  try {
    const url = new URL(String(value));
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

const buildAuthResponse = (row, rememberMe = false) => {
  const user = sanitizeUser(row);
  return {
    user,
    token: signToken(user, { rememberMe }),
    rememberMe,
  };
};

const developmentUrl = (key, delivery) =>
  process.env.NODE_ENV !== "production" && !delivery.delivered
    ? { [key]: delivery.url }
    : {};

const register = async (req, res, next) => {
  try {
    const verificationRequired = isEmailVerificationRequired();
    const {
      fullName,
      password,
      role,
      bio,
      skillsToTeach = [],
      skillsToLearn = [],
      candidateSkills = [],
      experienceLevel,
      availability,
      recruiterCompany,
      jobTitle,
      location,
    } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!String(fullName || "").trim() || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required." });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ error: passwordError });

    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) {
      return res
        .status(409)
        .json({ error: "An account already exists with this email." });
    }

    const requestedRole = normalizeRole(role);
    const normalizedRole = requestedRole === "mentor" ? "student" : requestedRole;
    const skills = JSON.stringify({
      teach: skillsToTeach,
      learn: skillsToLearn,
      candidate: candidateSkills,
      availability,
      experienceLevel,
    });
    const passwordHash = await hashPassword(password);
    const [result] = await db.query(
      `INSERT INTO users
       (email, password_hash, full_name, role, bio, skills, profession, company, location,
        is_verified, is_active, auth_provider, email_verified_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'local', ?)`,
      [
        email,
        passwordHash,
        String(fullName).trim(),
        normalizedRole,
        bio || null,
        skills,
        jobTitle || experienceLevel || null,
        recruiterCompany || null,
        location || null,
        verificationRequired ? 0 : 1,
        verificationRequired ? null : new Date(),
      ],
    );

    if (requestedRole === "mentor") {
      const expertise = [...skillsToTeach, ...candidateSkills]
        .map((item) => String(item).trim())
        .filter(Boolean);
      await db.query(
        `INSERT INTO mentor_applications
         (user_id, professional_title, company, expertise, experience_years,
          motivation, availability, status)
         VALUES (?, ?, ?, ?, 0, ?, ?, 'pending')`,
        [
          result.insertId,
          String(jobTitle || experienceLevel || "Community Mentor").slice(0, 150),
          recruiterCompany || null,
          JSON.stringify(expertise.length ? expertise : ["Mentorship"]),
          String(bio || "I would like to support community learners.").slice(0, 2000),
          String(availability || "Flexible schedule").slice(0, 150),
        ],
      );
    }

    if (requestedRole === "recruiter") {
      const companyName = String(recruiterCompany || `${fullName}'s Company`).trim().slice(0, 150);
      await db.query(
        `INSERT INTO company_profiles
         (owner_id, name, description, industry, contact_email, location, is_verified, verification_status)
         VALUES (?, ?, ?, ?, ?, ?, 0, 'pending')
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [
          result.insertId,
          companyName,
          bio || "Partner company offering internship and career opportunities.",
          jobTitle || "Technology",
          email,
          location || "Phnom Penh, Cambodia",
        ],
      );
    }

    if (!verificationRequired) {
      return res.status(201).json({
        message: "Account created. You can now log in.",
        email,
        requiresVerification: false,
      });
    }

    const token = await createAuthToken(result.insertId, "email_verification");
    const delivery = await sendVerificationEmail({
      email,
      fullName: String(fullName).trim(),
      token,
    });

    return res.status(201).json({
      message: delivery.delivered
        ? "Account created. Check your email to verify your account."
        : process.env.NODE_ENV === "production"
          ? "Account created, but email delivery is unavailable. Try resending verification later."
          : "Account created. Use the development verification link to continue.",
      email,
      requiresVerification: true,
      ...developmentUrl("devVerificationUrl", delivery),
    });
  } catch (err) {
    if (err.code === "WARN_DATA_TRUNCATED") {
      return res.status(500).json({
        error: "The users table is outdated. Run npm run migrate-db in backend.",
      });
    }
    return next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password, rememberMe = false } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const [rows] = await db.query(
      `SELECT ${userColumns}, password_hash FROM users WHERE email = ? AND is_active = 1`,
      [email],
    );
    const account = rows[0];
    if (!account) return res.status(401).json({ error: "Invalid email or password." });

    const user = sanitizeUser(account);
    const verificationRequired = isEmailVerificationRequired();
    const placeholder = isPlaceholderHash(account.password_hash);
    const allowDemoPasswords = process.env.NODE_ENV !== "production";
    const validPassword =
      (await verifyPassword(password, account.password_hash)) ||
      (allowDemoPasswords &&
        placeholder &&
        password === demoPasswordForRole(user.role));
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    if (verificationRequired && !user.isVerified) {
      return res.status(403).json({
        error: "Verify your email before logging in.",
        code: "EMAIL_NOT_VERIFIED",
        email,
      });
    }

    if (!verificationRequired && !user.isVerified) {
      await db.query(
        `UPDATE users
         SET is_verified = 1, email_verified_at = COALESCE(email_verified_at, NOW())
         WHERE id = ?`,
        [account.id],
      );
      account.is_verified = 1;
    }

    if (placeholder || passwordHashNeedsUpgrade(account.password_hash)) {
      await db.query("UPDATE users SET password_hash = ? WHERE id = ?", [
        await hashPassword(password),
        account.id,
      ]);
    }
    await db.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [
      account.id,
    ]);

    return res.json(buildAuthResponse(account, Boolean(rememberMe)));
  } catch (err) {
    return next(err);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    if (!isEmailVerificationRequired()) {
      return res.json({
        message: "Email verification is disabled for this environment.",
        requiresVerification: false,
      });
    }

    const email = normalizeEmail(req.body.email);
    const [rows] = await db.query(
      "SELECT id, email, full_name, is_verified, is_active FROM users WHERE email = ?",
      [email],
    );
    const account = rows[0];
    const response = {
      message: "If an unverified account exists, a new verification link has been created.",
    };
    if (!account || account.is_verified || !account.is_active) return res.json(response);

    const token = await createAuthToken(account.id, "email_verification");
    const delivery = await sendVerificationEmail({
      email: account.email,
      fullName: account.full_name,
      token,
    });
    return res.json({
      ...response,
      ...developmentUrl("devVerificationUrl", delivery),
    });
  } catch (err) {
    return next(err);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const record = await consumeAuthToken(req.body.token, "email_verification");
    if (!record) {
      return res.status(400).json({ error: "Verification link is invalid or expired." });
    }
    await db.query(
      `UPDATE users
       SET is_verified = 1, email_verified_at = COALESCE(email_verified_at, NOW())
       WHERE id = ?`,
      [record.user_id],
    );
    return res.json({ message: "Email verified. You can now log in." });
  } catch (err) {
    return next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const [rows] = await db.query(
      "SELECT id, email, full_name, is_active FROM users WHERE email = ?",
      [email],
    );
    const account = rows[0];
    const response = {
      message: "If an active account exists, a password reset link has been created.",
    };
    if (!account?.is_active) return res.json(response);

    const token = await createAuthToken(account.id, "password_reset");
    const delivery = await sendPasswordResetEmail({
      email: account.email,
      fullName: account.full_name,
      token,
    });
    return res.json({ ...response, ...developmentUrl("devResetUrl", delivery) });
  } catch (err) {
    return next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const passwordError = validatePassword(req.body.password);
    if (passwordError) return res.status(400).json({ error: passwordError });

    const record = await consumeAuthToken(req.body.token, "password_reset");
    if (!record) {
      return res.status(400).json({ error: "Reset link is invalid or expired." });
    }
    await db.query("UPDATE users SET password_hash = ? WHERE id = ?", [
      await hashPassword(req.body.password),
      record.user_id,
    ]);
    await db.query(
      "DELETE FROM user_auth_tokens WHERE user_id = ? AND type = 'password_reset'",
      [record.user_id],
    );
    return res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    return next(err);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(503).json({ error: "Google login is not configured yet." });
    }
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: req.body.credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ error: "Google could not verify this email." });
    }

    const email = normalizeEmail(payload.email);
    const [existing] = await db.query(
      `SELECT ${userColumns} FROM users WHERE email = ? LIMIT 1`,
      [email],
    );
    let account = existing[0];
    if (account && !account.is_active) {
      return res.status(403).json({ error: "This account has been disabled." });
    }

    if (account) {
      await db.query(
        `UPDATE users
         SET google_id = ?, is_verified = 1,
             email_verified_at = COALESCE(email_verified_at, NOW())
         WHERE id = ?`,
        [payload.sub, account.id],
      );
      account = { ...account, is_verified: 1 };
    } else {
      const unusablePassword = await hashPassword(crypto.randomBytes(32).toString("hex"));
      const [result] = await db.query(
        `INSERT INTO users
         (email, password_hash, full_name, avatar_url, role, is_verified, is_active,
          auth_provider, google_id, email_verified_at)
         VALUES (?, ?, ?, ?, 'student', 1, 1, 'google', ?, NOW())`,
        [email, unusablePassword, payload.name || email, payload.picture || null, payload.sub],
      );
      const [created] = await db.query(
        `SELECT ${userColumns} FROM users WHERE id = ?`,
        [result.insertId],
      );
      account = created[0];
    }

    await db.query("UPDATE users SET last_login = NOW() WHERE id = ?", [account.id]);
    return res.json(buildAuthResponse(account, Boolean(req.body.rememberMe)));
  } catch (err) {
    if (err.message?.toLowerCase().includes("token")) {
      return res.status(401).json({ error: "Google login token is invalid or expired." });
    }
    return next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { buildProfilePatch } = require("../utils/profilePatch");
    let updates;
    try {
      updates = buildProfilePatch(req.body, req.user.skills);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    await db.query(
      'UPDATE users SET ' + Object.keys(updates).map(column => column + ' = ?').join(', ') + ' WHERE id = ?',
      [...Object.values(updates), req.user.id],
    );
    const [rows] = await db.query(`SELECT ${userColumns} FROM users WHERE id = ?`, [
      req.user.id,
    ]);
    return res.json({ user: sanitizeUser(rows[0]) });
  } catch (err) {
    return next(err);
  }
};

const me = async (req, res) => res.json({ user: req.user });

module.exports = {
  forgotPassword,
  googleLogin,
  login,
  me,
  register,
  resendVerification,
  resetPassword,
  updateProfile,
  verifyEmail,
};
