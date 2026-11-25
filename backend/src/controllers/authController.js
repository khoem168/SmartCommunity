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
const twoFactor = require("../services/twoFactorService");
const { noteSignIn } = require("../services/loginAlertService");
const securityAlerts = require("../services/securityAlertService");
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

// After the password (or Google) check: accounts with two-factor
// authentication get a short-lived challenge instead of a session, unless
// this browser was trusted within the last 30 days.
const finishLogin = async (req, res, account, rememberMe) => {
  const trusted = await twoFactor.isTrustedDevice(account.id, req.body.trustedDeviceToken);

  if ((await twoFactor.isEnabled(account.id)) && !trusted) {
    return res.json({
      twoFactorRequired: true,
      challengeToken: twoFactor.signChallenge(account.id, rememberMe),
      rememberMe,
    });
  }

  // Super Admin / Admin 1-Tap Telegram Verification on untrusted browsers
  if (
    account.role === "admin" &&
    !trusted &&
    (await securityAlerts.shouldRequireTelegramApproval())
  ) {
    const approval = await securityAlerts.createAdminLoginApproval({
      req,
      account,
      rememberMe,
      deviceId: req.body?.deviceId,
    });
    return res.json({
      telegramApprovalRequired: true,
      approvalToken: approval.approvalToken,
      expiresInSeconds: approval.expiresInSeconds,
      rememberMe: Boolean(rememberMe),
      email: account.email,
    });
  }

  if (account.role === "admin") {
    securityAlerts.triggerSecurityAlert({
      eventType: "ADMIN_LOGIN_SUCCESS",
      severity: "info",
      req,
      userId: account.id,
      email: account.email,
      title: "Super Admin បានចូលប្រព័ន្ធជោគជ័យ",
      details: { trustedDevice: trusted ? "Yes" : "No" },
      alertSettingKey: "admin_login_notify",
      cooldownKey: `admin_ok:${account.id}:${securityAlerts.extractClientIp(req)}`,
      cooldownMs: 5_000,
    });
  }

  noteSignIn(req, account);
  return res.json(buildAuthResponse(account, rememberMe));
};

const pollTelegramApproval = async (req, res, next) => {
  try {
    const { approvalToken, trustDevice = true } = req.body || {};
    const outcome = await securityAlerts.pollAdminLoginApproval(approvalToken);

    if (outcome.status === "pending") {
      return res.json({ status: "pending" });
    }
    if (outcome.status === "denied") {
      return res.status(403).json({
        status: "denied",
        error: "Sign-in was denied by the Super Admin via Telegram.",
        code: "TELEGRAM_LOGIN_DENIED",
      });
    }
    if (outcome.status !== "approved" || !outcome.record) {
      return res.status(410).json({
        status: "expired",
        error: "Telegram approval request expired. Please sign in again.",
        code: "TELEGRAM_APPROVAL_EXPIRED",
      });
    }

    const [rows] = await db.query(
      `SELECT ${userColumns} FROM users WHERE id = ? AND is_active = 1`,
      [outcome.record.user_id],
    );
    const account = rows[0];
    if (!account) {
      return res.status(401).json({ error: "Invalid account.", code: "TELEGRAM_APPROVAL_EXPIRED" });
    }

    const trustedDevice = trustDevice
      ? await twoFactor.createTrustedDevice(account.id, req.headers["user-agent"])
      : null;

    noteSignIn(req, account);
    return res.json({
      status: "approved",
      ...buildAuthResponse(account, Boolean(outcome.record.remember_me)),
      ...(trustedDevice ? { trustedDevice } : {}),
    });
  } catch (err) {
    return next(err);
  }
};

const twoFactorFailure = (res, result) => {
  if (result.reason === "LOCKED") {
    return res.status(429).json({
      error: "Too many wrong codes. Try again in 10 minutes.",
      code: "TWO_FACTOR_LOCKED",
      lockedUntil: result.lockedUntil || null,
    });
  }
  if (result.reason === "UNREADABLE_SECRET") {
    return res.status(409).json({
      error: "Two-factor authentication needs to be reset by an administrator.",
      code: "TWO_FACTOR_RESET_REQUIRED",
    });
  }
  return res.status(400).json({
    error: "That code is not correct. Check the time on your phone and try the newest code.",
    code: "TWO_FACTOR_INVALID_CODE",
    attemptsLeft: result.attemptsLeft,
  });
};

const verifyTwoFactorLogin = async (req, res, next) => {
  try {
    const challenge = twoFactor.verifyChallenge(req.body.challengeToken);
    if (!challenge) {
      return res.status(401).json({
        error: "This sign-in step expired. Sign in again.",
        code: "TWO_FACTOR_CHALLENGE_EXPIRED",
      });
    }
    const [rows] = await db.query(
      `SELECT ${userColumns} FROM users WHERE id = ? AND is_active = 1`,
      [challenge.sub],
    );
    const account = rows[0];
    if (!account) return res.status(401).json({ error: "Invalid sign-in.", code: "TWO_FACTOR_CHALLENGE_EXPIRED" });

    const result = await twoFactor.verifySecondFactor(account.id, {
      code: req.body.code,
      recoveryCode: req.body.recoveryCode,
    });
    if (!result.ok) return twoFactorFailure(res, result);

    const response = buildAuthResponse(account, Boolean(challenge.rememberMe));
    if (req.body.trustDevice === true) {
      response.trustedDevice = await twoFactor.createTrustedDevice(account.id, req.headers["user-agent"]);
    }
    if (result.usedRecovery) response.recoveryCodesLeft = result.recoveryCodesLeft;
    noteSignIn(req, account);
    return res.json(response);
  } catch (err) {
    return next(err);
  }
};

const developmentUrl = (key, delivery) =>
  process.env.NODE_ENV !== "production" && !delivery.delivered
    ? { [key]: delivery.url }
    : {};

const toSkillArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

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
      mentorExpertise = [],
      mentorTitle,
      mentorExperience,
      careerGoal,
      experienceLevel,
      availability,
      recruiterCompany,
      jobTitle,
      location,
    } = req.body;
    const email = normalizeEmail(req.body.email);

    if (String(role || "").trim().toLowerCase() === "admin") {
      return res.status(403).json({
        error: "Admin accounts cannot be registered publicly.",
      });
    }

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

    const teachList = toSkillArray(skillsToTeach);
    const learnList = toSkillArray(skillsToLearn);
    const candidateList = toSkillArray(candidateSkills);
    const mentorExpertiseList = toSkillArray(mentorExpertise);

    const requestedRole = normalizeRole(role, false);
    const normalizedRole = requestedRole === "mentor" ? "student" : requestedRole;
    const skills = JSON.stringify({
      teach: requestedRole === "mentor" && mentorExpertiseList.length ? mentorExpertiseList : teachList,
      learn: learnList,
      candidate: candidateList,
      availability,
      experienceLevel,
    });
    const passwordHash = await hashPassword(password);
    const resolvedProfession =
      mentorTitle || jobTitle || experienceLevel || careerGoal || null;
    const [result] = await db.query(
      `INSERT INTO users
       (email, password_hash, full_name, role, bio, skills, profession, company, location, career_goal,
        is_verified, is_active, auth_provider, email_verified_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'local', ?)`,
      [
        email,
        passwordHash,
        String(fullName).trim(),
        normalizedRole,
        bio || null,
        skills,
        resolvedProfession,
        recruiterCompany || null,
        location || null,
        careerGoal || null,
        verificationRequired ? 0 : 1,
        verificationRequired ? null : new Date(),
      ],
    );

    if (requestedRole === "mentor") {
      const expertise = Array.from(
        new Set([...mentorExpertiseList, ...teachList, ...candidateList]),
      );
      const parsedExpYears = Math.max(0, Number.parseInt(mentorExperience, 10) || 0);
      await db.query(
        `INSERT INTO mentor_applications
         (user_id, professional_title, company, expertise, experience_years,
          motivation, availability, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          result.insertId,
          String(mentorTitle || jobTitle || experienceLevel || "Community Mentor").slice(0, 150),
          recruiterCompany || null,
          JSON.stringify(expertise.length ? expertise : ["Mentorship"]),
          parsedExpYears,
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

    const onboardingStatus =
      requestedRole === "mentor" || requestedRole === "recruiter"
        ? "pending_verification"
        : "active";

    securityAlerts.notifyNewUserSignup({
      fullName: String(fullName).trim(),
      email,
      role: requestedRole,
      req,
    });

    if (!verificationRequired) {
      const [createdRows] = await db.query(
        `SELECT ${userColumns} FROM users WHERE id = ?`,
        [result.insertId],
      );
      const authPayload = createdRows[0]
        ? buildAuthResponse(createdRows[0], true)
        : {};
      return res.status(201).json({
        message: "Account created. You can now log in.",
        email,
        requestedRole,
        onboardingStatus,
        requiresVerification: false,
        ...authPayload,
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
      requestedRole,
      onboardingStatus,
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
    const allowDemoPasswords =
      process.env.NODE_ENV !== "production" &&
      process.env.ALLOW_DEMO_PASSWORDS === "true";
    const validPassword =
      (await verifyPassword(password, account.password_hash)) ||
      (allowDemoPasswords &&
        placeholder &&
        user.role !== "admin" &&
        password === demoPasswordForRole(user.role));
    if (!validPassword) {
      if (user.role === "admin") {
        securityAlerts.triggerSecurityAlert({
          eventType: "ADMIN_LOGIN_FAILED",
          severity: "critical",
          req,
          userId: account.id,
          email: account.email,
          title: "មានអ្នកព្យាយាមចូលគណនី Super Admin (ពាក្យសម្ងាត់ខុស!)",
          details: { targetRole: "admin", reason: "Invalid password" },
          alertSettingKey: "admin_login_notify",
          cooldownKey: `admin_fail:${securityAlerts.extractClientIp(req)}`,
          cooldownMs: 15_000,
        });
      }
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

    return await finishLogin(req, res, account, Boolean(rememberMe));
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
    return await finishLogin(req, res, account, Boolean(req.body.rememberMe));
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
  buildAuthResponse,
  userColumns,
  verifyTwoFactorLogin,
  pollTelegramApproval,
  twoFactorFailure,
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
