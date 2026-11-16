// Remembers which browsers each account signs in from and emails the owner
// when a new one appears. The browser sends a random device id it keeps in
// local storage; only a hash of it is stored. Failures never block sign-in.
const db = require("../config/db");
const { hashToken } = require("../utils/totp");
const { sendLoginAlertEmail } = require("./emailService");

const describeDevice = (userAgent = "") => {
  const ua = String(userAgent);
  const browser = /Edg\//.test(ua) ? "Edge"
    : /OPR\//.test(ua) ? "Opera"
      : /Chrome\//.test(ua) ? "Chrome"
        : /Firefox\//.test(ua) ? "Firefox"
          : /Safari\//.test(ua) ? "Safari"
            : "Browser";
  const os = /Android/.test(ua) ? "Android"
    : /iPhone|iPad|iPod/.test(ua) ? "iPhone/iPad"
      : /Windows/.test(ua) ? "Windows"
        : /Mac OS X/.test(ua) ? "macOS"
          : /Linux/.test(ua) ? "Linux"
            : "unknown system";
  return `${browser} on ${os}`;
};

const clientIp = (req) =>
  String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim() || "unknown";

const recordSignIn = async (req, account) => {
  const deviceId = req.body?.deviceId;
  if (typeof deviceId !== "string" || deviceId.length < 16 || deviceId.length > 100) return { alerted: false };
  const deviceHash = hashToken(`${account.id}:${deviceId}`);
  const [[known]] = await db.query(
    "SELECT COUNT(*) AS total, COALESCE(SUM(device_hash = ?), 0) AS same FROM user_known_devices WHERE user_id = ?",
    [deviceHash, account.id],
  );
  const userAgent = String(req.headers["user-agent"] || "").slice(0, 255) || null;
  await db.query(
    `INSERT INTO user_known_devices (user_id, device_hash, user_agent, last_seen_at)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE last_seen_at = NOW(), user_agent = VALUES(user_agent)`,
    [account.id, deviceHash, userAgent],
  );
  // The first device recorded for an account gets no alert: it is usually the
  // one the account was made on, or the first sign-in after this feature.
  if (Number(known.same) > 0 || Number(known.total) === 0) return { alerted: false, firstOrKnown: true };
  const result = await sendLoginAlertEmail({
    email: account.email,
    fullName: account.full_name || account.fullName,
    when: new Date().toUTCString(),
    device: describeDevice(userAgent),
    ip: clientIp(req),
  });
  return { alerted: Boolean(result.delivered), attempted: true };
};

// Called after a session is issued; never throws and never delays the reply.
const noteSignIn = (req, account) => {
  recordSignIn(req, account).catch((error) => console.error("Login alert failed:", error.message));
};

module.exports = { noteSignIn, recordSignIn, describeDevice };
