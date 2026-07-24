const crypto = require("crypto");
const db = require("../config/db");

const TOKEN_TTL_MINUTES = {
  email_verification: Number(process.env.EMAIL_VERIFY_TTL_MINUTES || 1440),
  password_reset: Number(process.env.PASSWORD_RESET_TTL_MINUTES || 30),
};

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const createAuthToken = async (userId, type) => {
  const ttlMinutes = TOKEN_TTL_MINUTES[type];
  if (!ttlMinutes) throw new Error("Unsupported authentication token type.");

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await db.query(
    "DELETE FROM user_auth_tokens WHERE user_id = ? AND type = ?",
    [userId, type],
  );
  await db.query(
    `INSERT INTO user_auth_tokens (user_id, type, token_hash, expires_at)
     VALUES (?, ?, ?, ?)`,
    [userId, type, tokenHash, expiresAt],
  );

  return token;
};

const consumeAuthToken = async (token, type) => {
  const tokenHash = hashToken(String(token || ""));
  const [rows] = await db.query(
    `SELECT id, user_id
     FROM user_auth_tokens
     WHERE token_hash = ? AND type = ? AND used_at IS NULL AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash, type],
  );
  const record = rows[0];
  if (!record) return null;

  const [result] = await db.query(
    `UPDATE user_auth_tokens SET used_at = NOW()
     WHERE id = ? AND used_at IS NULL`,
    [record.id],
  );
  return result.affectedRows ? record : null;
};

module.exports = {
  consumeAuthToken,
  createAuthToken,
};
