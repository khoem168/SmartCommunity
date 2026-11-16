// Two-factor authentication with authenticator-app codes (TOTP): setup,
// login challenges, recovery codes, trusted devices and lockout after
// repeated wrong codes.
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const totp = require("../utils/totp");

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 10;
const TRUSTED_DEVICE_DAYS = 30;
const CHALLENGE_MINUTES = 5;

const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === "production" ? "" : "local-development-secret-change-before-hosting");
const JWT_ISSUER = process.env.JWT_ISSUER || "smart-community-api";
// A different audience from session tokens, so a challenge token can never be
// used as a login session.
const CHALLENGE_AUDIENCE = `${process.env.JWT_AUDIENCE || "smart-community-web"}:2fa-challenge`;

const getState = async (userId) => {
  // The database compares the lock time itself: the app server and MySQL
  // can run in different time zones.
  const [rows] = await db.query(
    "SELECT *, (locked_until IS NOT NULL AND locked_until > NOW()) AS is_locked FROM user_two_factor WHERE user_id = ?",
    [userId],
  );
  return rows[0] || null;
};

const isEnabled = async (userId) => Boolean((await getState(userId))?.enabled_at);

const remainingRecoveryCodes = async (userId) => {
  const [[row]] = await db.query(
    "SELECT COUNT(*) AS n FROM user_two_factor_recovery WHERE user_id = ? AND used_at IS NULL",
    [userId],
  );
  return Number(row.n);
};

const status = async (userId) => {
  const state = await getState(userId);
  return {
    enabled: Boolean(state?.enabled_at),
    enabledAt: state?.enabled_at || null,
    recoveryCodesLeft: state?.enabled_at ? await remainingRecoveryCodes(userId) : 0,
  };
};

// Step 1 of setup: a new secret waits as "pending" until the user proves
// their app shows the right code. An already-enabled secret is untouched.
const startSetup = async (user) => {
  const secret = totp.generateSecret();
  await db.query(
    `INSERT INTO user_two_factor (user_id, pending_secret_enc)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE pending_secret_enc = VALUES(pending_secret_enc)`,
    [user.id, totp.encryptSecret(secret)],
  );
  return { secret, otpauthUrl: totp.otpauthUrl({ secret, account: user.email }) };
};

const replaceRecoveryCodes = async (userId) => {
  const codes = totp.generateRecoveryCodes();
  await db.query("DELETE FROM user_two_factor_recovery WHERE user_id = ?", [userId]);
  await db.query(
    "INSERT INTO user_two_factor_recovery (user_id, code_hash) VALUES ?",
    [codes.map((code) => [userId, totp.hashToken(totp.normaliseRecoveryCode(code))])],
  );
  return codes;
};

// Step 2 of setup: confirm the first code, switch 2FA on, issue recovery codes.
const confirmSetup = async (userId, code) => {
  const state = await getState(userId);
  if (!state?.pending_secret_enc) return { ok: false, reason: "NO_PENDING_SETUP" };
  const secret = totp.decryptSecret(state.pending_secret_enc);
  const step = totp.verifyCode(secret, code);
  if (step === null) return { ok: false, reason: "INVALID_CODE" };
  await db.query(
    `UPDATE user_two_factor
     SET secret_enc = pending_secret_enc, pending_secret_enc = NULL, enabled_at = NOW(),
         last_used_step = ?, failed_attempts = 0, locked_until = NULL
     WHERE user_id = ?`,
    [step, userId],
  );
  return { ok: true, recoveryCodes: await replaceRecoveryCodes(userId) };
};

/**
 * Checks a 6-digit code or a recovery code for an account with 2FA on.
 * Counts failures and locks the account's 2FA for a while after too many.
 */
const verifySecondFactor = async (userId, { code, recoveryCode }) => {
  const state = await getState(userId);
  if (!state?.enabled_at) return { ok: false, reason: "NOT_ENABLED" };
  if (Number(state.is_locked) === 1) {
    return { ok: false, reason: "LOCKED", lockedUntil: state.locked_until };
  }

  let ok = false;
  let usedRecovery = false;
  if (recoveryCode) {
    const hash = totp.hashToken(totp.normaliseRecoveryCode(recoveryCode));
    const [result] = await db.query(
      `UPDATE user_two_factor_recovery SET used_at = NOW()
       WHERE user_id = ? AND code_hash = ? AND used_at IS NULL LIMIT 1`,
      [userId, hash],
    );
    ok = result.affectedRows === 1;
    usedRecovery = ok;
  } else {
    let secret;
    try {
      secret = totp.decryptSecret(state.secret_enc);
    } catch {
      return { ok: false, reason: "UNREADABLE_SECRET" };
    }
    const step = totp.verifyCode(secret, code, { lastUsedStep: state.last_used_step });
    if (step !== null) {
      ok = true;
      await db.query("UPDATE user_two_factor SET last_used_step = ? WHERE user_id = ?", [step, userId]);
    }
  }

  if (ok) {
    await db.query("UPDATE user_two_factor SET failed_attempts = 0, locked_until = NULL WHERE user_id = ?", [userId]);
    return { ok: true, usedRecovery, recoveryCodesLeft: await remainingRecoveryCodes(userId) };
  }
  const failures = Number(state.failed_attempts || 0) + 1;
  const lock = failures >= MAX_FAILED_ATTEMPTS;
  await db.query(
    `UPDATE user_two_factor
     SET failed_attempts = ?, locked_until = ${lock ? `DATE_ADD(NOW(), INTERVAL ${LOCK_MINUTES} MINUTE)` : "NULL"}
     WHERE user_id = ?`,
    [lock ? 0 : failures, userId],
  );
  return { ok: false, reason: lock ? "LOCKED" : "INVALID_CODE", attemptsLeft: lock ? 0 : MAX_FAILED_ATTEMPTS - failures };
};

const disable = async (userId) => {
  await db.query("DELETE FROM user_two_factor WHERE user_id = ?", [userId]);
  await db.query("DELETE FROM user_two_factor_recovery WHERE user_id = ?", [userId]);
  await db.query("DELETE FROM user_trusted_devices WHERE user_id = ?", [userId]);
};

// Trusted devices: a random token kept by the browser; only its hash is stored.
const createTrustedDevice = async (userId, userAgent) => {
  const token = crypto.randomBytes(32).toString("base64url");
  await db.query(
    `INSERT INTO user_trusted_devices (user_id, token_hash, user_agent, expires_at)
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ${TRUSTED_DEVICE_DAYS} DAY))`,
    [userId, totp.hashToken(token), String(userAgent || "").slice(0, 255) || null],
  );
  return { token, days: TRUSTED_DEVICE_DAYS };
};

const isTrustedDevice = async (userId, token) => {
  if (typeof token !== "string" || token.length < 20 || token.length > 100) return false;
  const [rows] = await db.query(
    "SELECT id FROM user_trusted_devices WHERE user_id = ? AND token_hash = ? AND expires_at > NOW() LIMIT 1",
    [userId, totp.hashToken(token)],
  );
  return rows.length > 0;
};

const signChallenge = (userId, rememberMe) =>
  jwt.sign({ purpose: "2fa", rememberMe: Boolean(rememberMe) }, JWT_SECRET, {
    algorithm: "HS256",
    subject: String(userId),
    issuer: JWT_ISSUER,
    audience: CHALLENGE_AUDIENCE,
    expiresIn: `${CHALLENGE_MINUTES}m`,
  });

const verifyChallenge = (token) => {
  try {
    const payload = jwt.verify(String(token || ""), JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: CHALLENGE_AUDIENCE,
    });
    return payload.purpose === "2fa" ? payload : null;
  } catch {
    return null;
  }
};

const adminTwoFactorRequired = () => process.env.REQUIRE_ADMIN_2FA !== "false";

module.exports = {
  status,
  isEnabled,
  startSetup,
  confirmSetup,
  verifySecondFactor,
  replaceRecoveryCodes,
  disable,
  createTrustedDevice,
  isTrustedDevice,
  signChallenge,
  verifyChallenge,
  adminTwoFactorRequired,
  MAX_FAILED_ATTEMPTS,
  TRUSTED_DEVICE_DAYS,
};
