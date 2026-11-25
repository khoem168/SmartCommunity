const crypto = require("crypto");
const db = require("../config/db");
const { describeDevice } = require("./loginAlertService");
const telegram = require("./telegramService");

const DEFAULT_SETTINGS = {
  attack_alerts: true,
  rate_limit_alerts: true,
  admin_login_notify: true,
  admin_login_approval: true,
  new_user_alerts: false,
  payment_alerts: true,
  maintenance_lockdown: false,
};

const SETTING_META = {
  attack_alerts: {
    labelKm: "ដាស់តឿនការវាយប្រហារ (XSS/SQLi/Upload)",
    labelEn: "Attack Detection Alerts",
  },
  rate_limit_alerts: {
    labelKm: "ដាស់តឿន Brute-Force & Rate Limit",
    labelEn: "Brute-Force & Rate Limit Alerts",
  },
  admin_login_notify: {
    labelKm: "ដំណឹងពេល Login គណនី Super Admin",
    labelEn: "Admin Login Notifications",
  },
  admin_login_approval: {
    labelKm: "ផ្ទៀងផ្ទាត់ 1-Tap Approve ពេល Admin Login",
    labelEn: "1-Tap Admin Login Approval",
  },
  new_user_alerts: {
    labelKm: "ដំណឹងពេលមានសមាជិកចុះឈ្មោះថ្មី",
    labelEn: "New Member Signup Alerts",
  },
  payment_alerts: {
    labelKm: "ដំណឹងការទូទាត់ Bakong KHQR",
    labelEn: "Bakong Payment Alerts",
  },
  maintenance_lockdown: {
    labelKm: "របៀបបិទបន្ទាន់ (Emergency Lockdown)",
    labelEn: "Emergency Lockdown Mode",
  },
};

const APPROVAL_TTL_SECONDS = 300; // 5 minutes
const CACHE_TTL_MS = 5000;

let tablesReadyPromise = null;
let settingsCache = { data: null, expiresAt: 0 };
let blockedIpsCache = { set: null, expiresAt: 0 };
let adminChatsCache = { ids: null, expiresAt: 0 };
const alertCooldowns = new Map();

const sha256 = (value) =>
  crypto.createHash("sha256").update(String(value || "")).digest("hex");

const extractClientIp = (req) => {
  if (!req) return "unknown";
  const forwarded = String(req.headers?.["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  const raw = forwarded || req.ip || req.socket?.remoteAddress || "unknown";
  return raw.replace(/^::ffff:/, "").slice(0, 64);
};

const formatPhnomPenhTime = (date = new Date()) => {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Phnom_Penh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return new Date(date).toISOString();
  }
};

const ensureSecurityTables = async () => {
  if (!tablesReadyPromise) {
    tablesReadyPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS security_events (
          id bigint NOT NULL AUTO_INCREMENT,
          event_type varchar(64) NOT NULL,
          severity enum('info','warning','critical') NOT NULL DEFAULT 'warning',
          ip_address varchar(64) DEFAULT NULL,
          user_id int(11) DEFAULT NULL,
          email varchar(255) DEFAULT NULL,
          request_path varchar(255) DEFAULT NULL,
          user_agent varchar(255) DEFAULT NULL,
          details_json text DEFAULT NULL,
          telegram_sent tinyint(1) NOT NULL DEFAULT 0,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_sec_created (created_at),
          KEY idx_sec_type_ip (event_type, ip_address)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS blocked_ips (
          ip_address varchar(64) NOT NULL,
          reason varchar(255) DEFAULT NULL,
          blocked_by varchar(120) DEFAULT 'telegram-admin',
          expires_at datetime DEFAULT NULL,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (ip_address),
          KEY idx_blocked_expires (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS telegram_alert_settings (
          setting_key varchar(64) NOT NULL,
          enabled tinyint(1) NOT NULL DEFAULT 1,
          updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (setting_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS telegram_admin_chats (
          chat_id varchar(64) NOT NULL,
          username varchar(120) DEFAULT NULL,
          first_name varchar(120) DEFAULT NULL,
          is_active tinyint(1) NOT NULL DEFAULT 1,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (chat_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS admin_login_approvals (
          id bigint NOT NULL AUTO_INCREMENT,
          token_hash char(64) NOT NULL,
          user_id int(11) NOT NULL,
          email varchar(255) NOT NULL,
          ip_address varchar(64) DEFAULT NULL,
          user_agent varchar(255) DEFAULT NULL,
          device_label varchar(120) DEFAULT NULL,
          device_id varchar(120) DEFAULT NULL,
          remember_me tinyint(1) NOT NULL DEFAULT 0,
          status enum('pending','approved','denied','consumed','expired') NOT NULL DEFAULT 'pending',
          telegram_message_id bigint DEFAULT NULL,
          decided_by varchar(120) DEFAULT NULL,
          expires_at datetime NOT NULL,
          decided_at datetime DEFAULT NULL,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_admin_approval_hash (token_hash),
          KEY idx_admin_approval_status (status, expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);

      for (const [key, enabled] of Object.entries(DEFAULT_SETTINGS)) {
        await db.query(
          `INSERT IGNORE INTO telegram_alert_settings (setting_key, enabled) VALUES (?, ?)`,
          [key, enabled ? 1 : 0],
        );
      }
    })().catch((err) => {
      tablesReadyPromise = null;
      throw err;
    });
  }
  return tablesReadyPromise;
};

const getSettings = async () => {
  const now = Date.now();
  if (settingsCache.data && now < settingsCache.expiresAt) {
    return settingsCache.data;
  }
  try {
    await ensureSecurityTables();
    const [rows] = await db.query(
      "SELECT setting_key, enabled FROM telegram_alert_settings",
    );
    const merged = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      if (row.setting_key in DEFAULT_SETTINGS) {
        merged[row.setting_key] = Boolean(Number(row.enabled));
      }
    }
    settingsCache = { data: merged, expiresAt: now + CACHE_TTL_MS };
    return merged;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

const setSetting = async (key, enabled) => {
  if (!(key in DEFAULT_SETTINGS)) {
    throw new Error(`Unknown setting key: ${key}`);
  }
  await ensureSecurityTables();
  await db.query(
    `INSERT INTO telegram_alert_settings (setting_key, enabled)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE enabled = VALUES(enabled)`,
    [key, enabled ? 1 : 0],
  );
  settingsCache = { data: null, expiresAt: 0 };
  return getSettings();
};

const getAdminChatIds = async () => {
  const now = Date.now();
  if (adminChatsCache.ids && now < adminChatsCache.expiresAt) {
    return adminChatsCache.ids;
  }
  const combined = new Set(telegram.getEnvAdminChatIds());
  try {
    await ensureSecurityTables();
    const [rows] = await db.query(
      "SELECT chat_id FROM telegram_admin_chats WHERE is_active = 1",
    );
    for (const row of rows) {
      if (row.chat_id) combined.add(String(row.chat_id).trim());
    }
  } catch {
    // Fallback cleanly to env chat IDs
  }
  const list = [...combined];
  adminChatsCache = { ids: list, expiresAt: now + CACHE_TTL_MS };
  return list;
};

const isAuthorizedAdminChat = async (chatId) => {
  if (chatId === undefined || chatId === null) return false;
  const ids = await getAdminChatIds();
  return ids.includes(String(chatId).trim());
};

const registerAdminChat = async ({ chatId, username, firstName }) => {
  await ensureSecurityTables();
  await db.query(
    `INSERT INTO telegram_admin_chats (chat_id, username, first_name, is_active)
     VALUES (?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE username = VALUES(username), first_name = VALUES(first_name), is_active = 1`,
    [
      String(chatId).trim(),
      username ? String(username).slice(0, 120) : null,
      firstName ? String(firstName).slice(0, 120) : null,
    ],
  );
  adminChatsCache = { ids: null, expiresAt: 0 };
};

const sendToAllAdmins = async (htmlText, options = {}) => {
  if (!telegram.isConfigured()) return { sent: 0, results: [] };
  const chatIds = await getAdminChatIds();
  if (!chatIds.length) return { sent: 0, results: [] };

  const results = await Promise.all(
    chatIds.map((chatId) => telegram.sendMessage(chatId, htmlText, options)),
  );
  const sent = results.filter((r) => r && r.ok).length;
  return { sent, results };
};

const isIpBlocked = async (ip) => {
  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip === "::1") return false;
  const now = Date.now();
  if (!blockedIpsCache.set || now >= blockedIpsCache.expiresAt) {
    try {
      await ensureSecurityTables();
      const [rows] = await db.query(
        "SELECT ip_address FROM blocked_ips WHERE expires_at IS NULL OR expires_at > NOW()",
      );
      blockedIpsCache = {
        set: new Set(rows.map((r) => String(r.ip_address))),
        expiresAt: now + CACHE_TTL_MS,
      };
    } catch {
      return false;
    }
  }
  return blockedIpsCache.set.has(String(ip));
};

const blockIp = async (ip, reason = "Blocked by Super Admin", blockedBy = "telegram-admin", durationMinutes = null) => {
  const cleanIp = String(ip || "").trim().replace(/^::ffff:/, "").slice(0, 64);
  if (!cleanIp || cleanIp === "unknown" || cleanIp === "127.0.0.1" || cleanIp === "::1") {
    return { ok: false, reason: "Cannot block localhost or unknown IP." };
  }
  await ensureSecurityTables();
  const safeReason = String(reason || "Blocked by Super Admin").slice(0, 250);
  if (durationMinutes && Number(durationMinutes) > 0) {
    await db.query(
      `INSERT INTO blocked_ips (ip_address, reason, blocked_by, expires_at)
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))
       ON DUPLICATE KEY UPDATE reason = VALUES(reason), blocked_by = VALUES(blocked_by), expires_at = VALUES(expires_at)`,
      [cleanIp, safeReason, String(blockedBy).slice(0, 120), Math.floor(Number(durationMinutes))],
    );
  } else {
    await db.query(
      `INSERT INTO blocked_ips (ip_address, reason, blocked_by, expires_at)
       VALUES (?, ?, ?, NULL)
       ON DUPLICATE KEY UPDATE reason = VALUES(reason), blocked_by = VALUES(blocked_by), expires_at = NULL`,
      [cleanIp, safeReason, String(blockedBy).slice(0, 120)],
    );
  }
  blockedIpsCache = { set: null, expiresAt: 0 };
  return { ok: true, ip: cleanIp };
};

const unblockIp = async (ip) => {
  const cleanIp = String(ip || "").trim().replace(/^::ffff:/, "");
  await ensureSecurityTables();
  const [result] = await db.query("DELETE FROM blocked_ips WHERE ip_address = ?", [cleanIp]);
  blockedIpsCache = { set: null, expiresAt: 0 };
  return { ok: result.affectedRows > 0, ip: cleanIp };
};

const listBlockedIps = async () => {
  await ensureSecurityTables();
  const [rows] = await db.query(
    `SELECT ip_address, reason, blocked_by, expires_at, created_at
     FROM blocked_ips
     WHERE expires_at IS NULL OR expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 30`,
  );
  return rows;
};

const isLockdownActive = async () => {
  const settings = await getSettings();
  return Boolean(settings.maintenance_lockdown);
};

const shouldThrottleCooldown = (cooldownKey, cooldownMs) => {
  if (!cooldownKey || !cooldownMs) return false;
  const now = Date.now();
  const last = alertCooldowns.get(cooldownKey) || 0;
  if (now - last < cooldownMs) return true;
  alertCooldowns.set(cooldownKey, now);
  if (alertCooldowns.size > 500) {
    for (const [k, ts] of alertCooldowns.entries()) {
      if (now - ts > 10 * 60 * 1000) alertCooldowns.delete(k);
    }
  }
  return false;
};

const SEVERITY_BADGE = {
  critical: "🚨 <b>CRITICAL SECURITY ALERT</b>",
  warning: "⚠️ <b>SECURITY WARNING</b>",
  info: "🛡️ <b>SECURITY NOTICE</b>",
};

const recordSecurityEvent = async ({
  eventType,
  severity = "warning",
  req = null,
  ip = null,
  userId = null,
  email = null,
  path = null,
  details = {},
  title = null,
  alertSettingKey = "attack_alerts",
  cooldownKey = null,
  cooldownMs = 60_000,
  includeBlockIpButton = true,
}) => {
  const clientIp = ip || extractClientIp(req);
  const requestPath = path || (req ? `${req.method || "REQ"} ${req.originalUrl || req.url || ""}`.slice(0, 250) : null);
  const userAgent = req ? String(req.headers?.["user-agent"] || "").slice(0, 255) : null;
  const deviceLabel = userAgent ? describeDevice(userAgent) : "Unknown client";

  let eventId = null;
  try {
    await ensureSecurityTables();
    const [result] = await db.query(
      `INSERT INTO security_events
         (event_type, severity, ip_address, user_id, email, request_path, user_agent, details_json, telegram_sent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        String(eventType || "UNKNOWN").slice(0, 64),
        ["info", "warning", "critical"].includes(severity) ? severity : "warning",
        clientIp,
        userId || null,
        email ? String(email).slice(0, 255) : null,
        requestPath,
        userAgent,
        JSON.stringify(details || {}).slice(0, 2000),
      ],
    );
    eventId = result.insertId;
  } catch (err) {
    console.error("Failed to record security event:", err.message);
  }

  try {
    const settings = await getSettings();
    if (alertSettingKey && settings[alertSettingKey] === false) {
      return { eventId, alerted: false, reason: "SETTING_DISABLED" };
    }
    const throttleKey = cooldownKey || `${eventType}:${clientIp}`;
    if (shouldThrottleCooldown(throttleKey, cooldownMs)) {
      return { eventId, alerted: false, reason: "COOLDOWN" };
    }

    const lines = [
      SEVERITY_BADGE[severity] || SEVERITY_BADGE.warning,
      title ? `📌 <b>${telegram.escapeHtml(title)}</b>` : `📌 <b>${telegram.escapeHtml(eventType)}</b>`,
      ``,
      `🌐 <b>IP:</b> <code>${telegram.escapeHtml(clientIp)}</code>`,
      `💻 <b>Device:</b> ${telegram.escapeHtml(deviceLabel)}`,
    ];
    if (email) lines.push(`👤 <b>Account:</b> <code>${telegram.escapeHtml(email)}</code>`);
    if (requestPath) lines.push(`🔗 <b>Path:</b> <code>${telegram.escapeHtml(requestPath)}</code>`);
    if (details && typeof details === "object") {
      const summaryEntries = Object.entries(details)
        .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
        .slice(0, 5);
      for (const [k, v] of summaryEntries) {
        lines.push(`• <b>${telegram.escapeHtml(k)}:</b> ${telegram.escapeHtml(String(v).slice(0, 180))}`);
      }
    }
    lines.push(`🕒 <b>Time (KH):</b> ${formatPhnomPenhTime()}`);

    const inlineRow = [];
    if (
      includeBlockIpButton &&
      clientIp &&
      clientIp !== "unknown" &&
      clientIp !== "127.0.0.1" &&
      clientIp !== "::1"
    ) {
      inlineRow.push({
        text: `🚫 Block IP (${clientIp})`,
        callback_data: `block_ip:${clientIp}`,
      });
    }
    inlineRow.push({ text: "📋 Alerts", callback_data: "cmd:alerts" });

    const { sent } = await sendToAllAdmins(lines.join("\n"), {
      reply_markup: { inline_keyboard: [inlineRow] },
    });

    if (sent > 0 && eventId) {
      await db.query("UPDATE security_events SET telegram_sent = 1 WHERE id = ?", [eventId]).catch(() => {});
    }
    return { eventId, alerted: sent > 0 };
  } catch (err) {
    console.error("Failed to dispatch Telegram security alert:", err.message);
    return { eventId, alerted: false };
  }
};

// Fire-and-forget wrapper so security alerts never block or crash user requests
const triggerSecurityAlert = (payload) => {
  recordSecurityEvent(payload).catch((err) => {
    console.error("triggerSecurityAlert error:", err.message);
  });
};

// ============================================================================
// 1-TAP SUPER ADMIN TELEGRAM LOGIN APPROVAL
// ============================================================================

const shouldRequireTelegramApproval = async () => {
  if (!telegram.isConfigured()) return false;
  const chatIds = await getAdminChatIds();
  if (!chatIds.length) return false;
  const settings = await getSettings();
  return Boolean(settings.admin_login_approval);
};

const createAdminLoginApproval = async ({ req, account, rememberMe = false, deviceId = null }) => {
  await ensureSecurityTables();
  const approvalToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = sha256(approvalToken);
  const ip = extractClientIp(req);
  const userAgent = String(req.headers?.["user-agent"] || "").slice(0, 255);
  const deviceLabel = describeDevice(userAgent);

  const [result] = await db.query(
    `INSERT INTO admin_login_approvals
       (token_hash, user_id, email, ip_address, user_agent, device_label, device_id, remember_me, status, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL ? SECOND))`,
    [
      tokenHash,
      account.id,
      account.email,
      ip,
      userAgent || null,
      deviceLabel,
      deviceId ? String(deviceId).slice(0, 120) : null,
      rememberMe ? 1 : 0,
      APPROVAL_TTL_SECONDS,
    ],
  );
  const approvalId = result.insertId;

  const text = [
    `🔐 <b>សំណើចូលគណនី SUPER ADMIN (1-Tap Verify)</b>`,
    `មានការព្យាយាម Login ចូលគណនី Admin ដោយប្រើពាក្យសម្ងាត់ត្រឹមត្រូវ៖`,
    ``,
    `👤 <b>Admin:</b> ${telegram.escapeHtml(account.full_name || account.email)} (<code>${telegram.escapeHtml(account.email)}</code>)`,
    `🌐 <b>IP:</b> <code>${telegram.escapeHtml(ip)}</code>`,
    `💻 <b>Device:</b> ${telegram.escapeHtml(deviceLabel)}`,
    `🕒 <b>Time (KH):</b> ${formatPhnomPenhTime()}`,
    `⏳ <b>ផុតកំណត់ក្នុង:</b> 5 នាទី`,
    ``,
    `តើនេះជាបងផ្ទាល់មែនទេ?`,
  ].join("\n");

  const { results } = await sendToAllAdmins(text, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ ជាខ្ញុំផ្ទាល់ (Approve)", callback_data: `approve_login:${approvalId}` },
          { text: "🚨 មិនមែនខ្ញុំទេ (Deny & Block)", callback_data: `deny_login:${approvalId}` },
        ],
      ],
    },
  });

  const firstMsgId = results.find((r) => r?.ok && r.result?.message_id)?.result?.message_id || null;
  if (firstMsgId) {
    await db.query(
      "UPDATE admin_login_approvals SET telegram_message_id = ? WHERE id = ?",
      [firstMsgId, approvalId],
    ).catch(() => {});
  }

  return {
    approvalId,
    approvalToken,
    expiresInSeconds: APPROVAL_TTL_SECONDS,
  };
};

const pollAdminLoginApproval = async (approvalToken) => {
  if (!approvalToken || typeof approvalToken !== "string" || approvalToken.length < 20) {
    return { status: "invalid" };
  }
  await ensureSecurityTables();
  const tokenHash = sha256(approvalToken);
  const [rows] = await db.query(
    `SELECT *, (expires_at <= NOW()) AS is_expired
     FROM admin_login_approvals
     WHERE token_hash = ?
     LIMIT 1`,
    [tokenHash],
  );
  const row = rows[0];
  if (!row) return { status: "invalid" };

  if (row.status === "consumed") return { status: "expired" };
  if (row.status === "denied") return { status: "denied", record: row };
  if (Number(row.is_expired) === 1) {
    if (row.status === "pending") {
      await db.query("UPDATE admin_login_approvals SET status = 'expired' WHERE id = ?", [row.id]).catch(() => {});
    }
    return { status: "expired", record: row };
  }
  if (row.status === "approved") {
    const [consumed] = await db.query(
      "UPDATE admin_login_approvals SET status = 'consumed' WHERE id = ? AND status = 'approved'",
      [row.id],
    );
    if (consumed.affectedRows !== 1) return { status: "expired" };
    return { status: "approved", record: row };
  }
  return { status: "pending", record: row };
};

const decideAdminLoginApproval = async (approvalId, decision, actorLabel = "telegram-admin") => {
  await ensureSecurityTables();
  const [rows] = await db.query(
    `SELECT *, (expires_at <= NOW()) AS is_expired
     FROM admin_login_approvals
     WHERE id = ?
     LIMIT 1`,
    [Number(approvalId)],
  );
  const row = rows[0];
  if (!row) return { ok: false, reason: "NOT_FOUND" };
  if (row.status !== "pending") return { ok: false, reason: "ALREADY_DECIDED", status: row.status, record: row };
  if (Number(row.is_expired) === 1) {
    await db.query("UPDATE admin_login_approvals SET status = 'expired' WHERE id = ?", [row.id]);
    return { ok: false, reason: "EXPIRED", record: row };
  }

  const nextStatus = decision === "approve" ? "approved" : "denied";
  await db.query(
    `UPDATE admin_login_approvals
     SET status = ?, decided_by = ?, decided_at = NOW()
     WHERE id = ? AND status = 'pending'`,
    [nextStatus, String(actorLabel).slice(0, 120), row.id],
  );

  if (nextStatus === "denied") {
    if (row.ip_address) {
      await blockIp(row.ip_address, `Denied Super Admin login (#${row.id})`, actorLabel, 1440).catch(() => {});
    }
    await db.query(
      `INSERT INTO security_events
         (event_type, severity, ip_address, user_id, email, request_path, user_agent, details_json, telegram_sent)
       VALUES ('ADMIN_LOGIN_DENIED', 'critical', ?, ?, ?, 'POST /api/auth/login', ?, ?, 1)`,
      [
        row.ip_address,
        row.user_id,
        row.email,
        row.user_agent,
        JSON.stringify({ approvalId: row.id, decidedBy: actorLabel, ipBlocked24h: true }),
      ],
    ).catch(() => {});
  }

  return { ok: true, status: nextStatus, record: row };
};

const notifyPaymentSuccess = async ({ userName, userEmail, courseTitle, amount, currency = "USD", orderId }) => {
  try {
    const settings = await getSettings();
    if (!settings.payment_alerts) return;
    const text = [
      `💰 <b>ការទូទាត់ Bakong KHQR ជោគជ័យ!</b>`,
      ``,
      `👤 <b>សមាជិក:</b> ${telegram.escapeHtml(userName || "Member")} (<code>${telegram.escapeHtml(userEmail || "-")}</code>)`,
      `📚 <b>វគ្គសិក្សា:</b> ${telegram.escapeHtml(courseTitle || "-")}`,
      `💵 <b>ចំនួនទឹកប្រាក់:</b> <b>$${telegram.escapeHtml(amount)} ${telegram.escapeHtml(currency)}</b>`,
      `🧾 <b>Order ID:</b> <code>${telegram.escapeHtml(orderId)}</code>`,
      `🕒 <b>Time (KH):</b> ${formatPhnomPenhTime()}`,
    ].join("\n");
    await sendToAllAdmins(text);
  } catch (err) {
    console.error("notifyPaymentSuccess error:", err.message);
  }
};

const notifyNewUserSignup = async ({ fullName, email, role, req }) => {
  try {
    const settings = await getSettings();
    if (!settings.new_user_alerts) return;
    const ip = extractClientIp(req);
    const text = [
      `🎉 <b>សមាជិកថ្មីទើបចុះឈ្មោះ!</b>`,
      ``,
      `👤 <b>ឈ្មោះ:</b> ${telegram.escapeHtml(fullName)}`,
      `📧 <b>Email:</b> <code>${telegram.escapeHtml(email)}</code>`,
      `🏷️ <b>Role:</b> <code>${telegram.escapeHtml(role)}</code>`,
      `🌐 <b>IP:</b> <code>${telegram.escapeHtml(ip)}</code>`,
      `🕒 <b>Time (KH):</b> ${formatPhnomPenhTime()}`,
    ].join("\n");
    await sendToAllAdmins(text);
  } catch (err) {
    console.error("notifyNewUserSignup error:", err.message);
  }
};

module.exports = {
  DEFAULT_SETTINGS,
  SETTING_META,
  extractClientIp,
  formatPhnomPenhTime,
  ensureSecurityTables,
  getSettings,
  setSetting,
  getAdminChatIds,
  isAuthorizedAdminChat,
  registerAdminChat,
  sendToAllAdmins,
  isIpBlocked,
  blockIp,
  unblockIp,
  listBlockedIps,
  isLockdownActive,
  recordSecurityEvent,
  triggerSecurityAlert,
  shouldRequireTelegramApproval,
  createAdminLoginApproval,
  pollAdminLoginApproval,
  decideAdminLoginApproval,
  notifyPaymentSuccess,
  notifyNewUserSignup,
};
