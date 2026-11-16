// Signed-in account settings for two-factor authentication, plus the
// administrator reset for members who lost both their phone and their
// recovery codes.
const db = require("../config/db");
const twoFactor = require("../services/twoFactorService");
const { verifyPassword } = require("../utils/auth");
const { twoFactorFailure } = require("./authController");

const logSecurityEvent = (req, userId, action, details = null) =>
  db.query(
    `INSERT INTO user_activity_logs (user_id, action, entity_type, entity_id, ip_address, user_agent, details)
     VALUES (?, ?, 'user', ?, ?, ?, ?)`,
    [
      req.user.id,
      action,
      userId,
      String(req.headers["x-forwarded-for"] || req.ip || "").slice(0, 45) || null,
      String(req.headers["user-agent"] || "").slice(0, 1000) || null,
      details ? JSON.stringify(details) : null,
    ],
  );

const getStatus = async (req, res, next) => {
  try {
    return res.json({
      ...(await twoFactor.status(req.user.id)),
      requiredForRole: req.user.role === "admin" && twoFactor.adminTwoFactorRequired(),
    });
  } catch (err) {
    return next(err);
  }
};

const startSetup = async (req, res, next) => {
  try {
    if (await twoFactor.isEnabled(req.user.id)) {
      return res.status(409).json({ error: "Two-factor authentication is already on.", code: "TWO_FACTOR_ALREADY_ENABLED" });
    }
    return res.json(await twoFactor.startSetup(req.user));
  } catch (err) {
    return next(err);
  }
};

const confirmSetup = async (req, res, next) => {
  try {
    const result = await twoFactor.confirmSetup(req.user.id, req.body.code);
    if (!result.ok) {
      return res.status(400).json(
        result.reason === "NO_PENDING_SETUP"
          ? { error: "Start the setup again.", code: "TWO_FACTOR_NO_SETUP" }
          : { error: "That code is not correct. Try the newest code from your app.", code: "TWO_FACTOR_INVALID_CODE" },
      );
    }
    await logSecurityEvent(req, req.user.id, "security.2fa.enabled");
    return res.json({ enabled: true, recoveryCodes: result.recoveryCodes });
  } catch (err) {
    return next(err);
  }
};

// Turning 2FA off needs a current code (or recovery code) and, for accounts
// with a password, the password too.
const disable = async (req, res, next) => {
  try {
    const [[account]] = await db.query("SELECT password_hash, auth_provider FROM users WHERE id = ?", [req.user.id]);
    if (account.auth_provider !== "google" && !(await verifyPassword(String(req.body.password || ""), account.password_hash))) {
      return res.status(400).json({ error: "Your password is not correct.", code: "INVALID_PASSWORD" });
    }
    const result = await twoFactor.verifySecondFactor(req.user.id, { code: req.body.code, recoveryCode: req.body.recoveryCode });
    if (!result.ok) return twoFactorFailure(res, result);
    await twoFactor.disable(req.user.id);
    await logSecurityEvent(req, req.user.id, "security.2fa.disabled");
    return res.json({ enabled: false });
  } catch (err) {
    return next(err);
  }
};

const regenerateRecoveryCodes = async (req, res, next) => {
  try {
    const result = await twoFactor.verifySecondFactor(req.user.id, { code: req.body.code });
    if (!result.ok) return twoFactorFailure(res, result);
    const recoveryCodes = await twoFactor.replaceRecoveryCodes(req.user.id);
    await logSecurityEvent(req, req.user.id, "security.2fa.recovery_codes_replaced");
    return res.json({ recoveryCodes });
  } catch (err) {
    return next(err);
  }
};

const adminReset = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ error: "Invalid user." });
    if (userId === req.user.id) {
      return res.status(400).json({ error: "Turn off your own two-factor authentication in Settings.", code: "CANNOT_RESET_SELF" });
    }
    await twoFactor.disable(userId);
    await logSecurityEvent(req, userId, "admin.user.2fa_reset");
    return res.json({ reset: true });
  } catch (err) {
    return next(err);
  }
};

// Admin tools stay locked until the administrator turns 2FA on, unless
// REQUIRE_ADMIN_2FA=false.
const requireAdminTwoFactor = async (req, res, next) => {
  try {
    if (!twoFactor.adminTwoFactorRequired() || (await twoFactor.isEnabled(req.user.id))) return next();
    return res.status(403).json({
      error: "Turn on two-factor authentication in Settings → Security before using admin tools.",
      code: "TWO_FACTOR_SETUP_REQUIRED",
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getStatus, startSetup, confirmSetup, disable, regenerateRecoveryCodes, adminReset, requireAdminTwoFactor };
