const db = require("../config/db");
const telegram = require("../services/telegramService");
const security = require("../services/securityAlertService");

const BOT_COMMANDS = [
  { command: "start", description: "ផ្ទាំងគ្រប់គ្រងសុវត្ថិភាព (Control Center)" },
  { command: "status", description: "មើលស្ថានភាពប្រព័ន្ធ និងសុវត្ថិភាព" },
  { command: "alerts", description: "មើលការវាយប្រហារ និង Alerts ចុងក្រោយ" },
  { command: "settings", description: "បើក/បិទការជូនដំណឹងតាមចិត្ត" },
  { command: "blocked", description: "បញ្ជី IP ដែលបានប្លុក" },
  { command: "blockip", description: "ប្លុក IP (/blockip 1.2.3.4)" },
  { command: "unblockip", description: "ដោះប្លុក IP (/unblockip 1.2.3.4)" },
  { command: "lockdown", description: "បើក/បិទរបៀបសង្គ្រោះបន្ទាន់ (on/off)" },
  { command: "users", description: "បញ្ជីសមាជិកចុះឈ្មោះថ្មីៗ" },
  { command: "find", description: "ស្វែងរកសមាជិក (/find email)" },
  { command: "ban", description: "ផ្អាកគណនី (/ban userId)" },
  { command: "unban", description: "បើកគណនីវិញ (/unban userId)" },
  { command: "pending", description: "ពិនិត្យសំណើ Mentor រង់ចាំអនុម័ត" },
  { command: "myid", description: "បង្ហាញ Telegram Chat ID របស់អ្នក" },
  { command: "help", description: "បង្ហាញពាក្យបញ្ជាទាំងអស់" },
];

const mainMenuKeyboard = () => ({
  inline_keyboard: [
    [
      { text: "📊 ស្ថានភាពប្រព័ន្ធ", callback_data: "cmd:status" },
      { text: "🚨 ប្រវត្តិ Alerts", callback_data: "cmd:alerts" },
    ],
    [
      { text: "⚙️ កំណត់ការជូនដំណឹង", callback_data: "cmd:settings" },
      { text: "🚫 IP បានប្លុក", callback_data: "cmd:blocked" },
    ],
    [
      { text: "👥 សមាជិកថ្មីៗ", callback_data: "cmd:users" },
      { text: "🎓 សំណើ Mentor", callback_data: "cmd:pending" },
    ],
  ],
});

const buildHelpMessage = () =>
  [
    `🛡️ <b>Smart Community — Security &amp; Admin Command Center</b>`,
    `គ្រប់គ្រងសុវត្ថិភាព ការវាយប្រហារ និងអ្នកប្រើប្រាស់ផ្ទាល់ពី Telegram៖`,
    ``,
    `<b>🔒 សុវត្ថិភាព (Security Ops)</b>`,
    `• /status — ស្ថានភាព Server, DB, សមាជិក និងការវាយប្រហារ 24h`,
    `• /alerts — ប្រវត្តិការវាយប្រហារ 8 ចុងក្រោយ`,
    `• /blocked — មើល &amp; ដោះប្លុក IP ដែលបានហាមឃាត់`,
    `• /blockip <code>1.2.3.4</code> — ប្លុក IP អ្នកវាយប្រហារភ្លាមៗ`,
    `• /unblockip <code>1.2.3.4</code> — ដោះប្លុក IP`,
    `• /lockdown <code>on|off</code> — បើក/បិទរបៀបសង្គ្រោះបន្ទាន់`,
    ``,
    `<b>👥 គ្រប់គ្រងអ្នកប្រើប្រាស់ (Platform Ops)</b>`,
    `• /users — សមាជិក 10 នាក់ចុងក្រោយ`,
    `• /find <code>email/name</code> — ស្វែងរកសមាជិក &amp; Ban/Unban`,
    `• /ban <code>userId</code> | /unban <code>userId</code> — ផ្អាក ឬបើកគណនី`,
    `• /pending — អនុម័ត/បដិសេធសំណើ Mentor`,
    `• /settings — បើក/បិទប្រភេទ Alert នីមួយៗតាមចិត្ត`,
  ].join("\n");

const buildStatusMessage = async () => {
  const startedAt = Date.now();
  await security.ensureSecurityTables();
  const [
    [[usersRow]],
    [[coursesRow]],
    [[events24Row]],
    [[critical24Row]],
    [[blockedRow]],
    [[pendingMentorsRow]],
    settings,
  ] = await Promise.all([
    db.query("SELECT COUNT(*) AS total, SUM(CASE WHEN created_at >= NOW() - INTERVAL 24 HOUR THEN 1 ELSE 0 END) AS today FROM users"),
    db.query("SELECT COUNT(*) AS total FROM courses WHERE is_published = 1"),
    db.query("SELECT COUNT(*) AS total FROM security_events WHERE created_at >= NOW() - INTERVAL 24 HOUR"),
    db.query("SELECT COUNT(*) AS total FROM security_events WHERE severity = 'critical' AND created_at >= NOW() - INTERVAL 24 HOUR"),
    db.query("SELECT COUNT(*) AS total FROM blocked_ips WHERE expires_at IS NULL OR expires_at > NOW()"),
    db.query("SELECT COUNT(*) AS total FROM mentor_applications WHERE status = 'pending'").catch(() => [[{ total: 0 }]]),
    security.getSettings(),
  ]);
  const dbLatencyMs = Date.now() - startedAt;

  return [
    `📊 <b>ស្ថានភាពប្រព័ន្ធ Smart Community</b>`,
    ``,
    `🟢 <b>API &amp; Database:</b> Online (${dbLatencyMs}ms)`,
    `🛡️ <b>Emergency Lockdown:</b> ${settings.maintenance_lockdown ? "🔴 ON (Active)" : "🟢 OFF (Normal)"}`,
    `🔐 <b>Admin 1-Tap Approval:</b> ${settings.admin_login_approval ? "✅ ON" : "⚪ OFF"}`,
    ``,
    `👥 <b>សមាជិកសរុប:</b> ${Number(usersRow?.total || 0)} (+${Number(usersRow?.today || 0)} ក្នុង 24h)`,
    `📚 <b>វគ្គសិក្សា:</b> ${Number(coursesRow?.total || 0)}`,
    `🎓 <b>សំណើ Mentor រង់ចាំ:</b> ${Number(pendingMentorsRow?.total || 0)}`,
    ``,
    `🚨 <b>Security Events (24h):</b> ${Number(events24Row?.total || 0)} (Critical: ${Number(critical24Row?.total || 0)})`,
    `🚫 <b>Blocked IPs សកម្ម:</b> ${Number(blockedRow?.total || 0)}`,
    `🕒 <b>Time (KH):</b> ${security.formatPhnomPenhTime()}`,
  ].join("\n");
};

const buildSettingsPayload = async () => {
  const settings = await security.getSettings();
  const rows = Object.entries(security.SETTING_META).map(([key, meta]) => {
    const isOn = Boolean(settings[key]);
    return [
      {
        text: `${isOn ? "✅ ON" : "⚪ OFF"} · ${meta.labelKm}`,
        callback_data: `toggle_setting:${key}`,
      },
    ];
  });
  rows.push([{ text: "🏠 ម៉ឺនុយដើម", callback_data: "cmd:menu" }]);

  const text = [
    `⚙️ <b>ការកំណត់ការជូនដំណឹង និងសុវត្ថិភាព</b>`,
    `ចុចលើប៊ូតុងខាងក្រោមដើម្បី <b>បើក (ON)</b> ឬ <b>បិទ (OFF)</b> មុខងារនីមួយៗភ្លាមៗ៖`,
  ].join("\n");

  return { text, reply_markup: { inline_keyboard: rows } };
};

const buildAlertsMessage = async () => {
  await security.ensureSecurityTables();
  const [rows] = await db.query(
    `SELECT id, event_type, severity, ip_address, email, request_path, created_at
     FROM security_events
     ORDER BY id DESC
     LIMIT 8`,
  );
  if (!rows.length) {
    return {
      text: `✅ <b>គ្មានព្រឹត្តិការណ៍សុវត្ថិភាពខុសប្រក្រតីទេ!</b>\nប្រព័ន្ធកំពុងដំណើរការដោយសុវត្ថិភាព។`,
      reply_markup: mainMenuKeyboard(),
    };
  }
  const iconFor = { critical: "🚨", warning: "⚠️", info: "🛡️" };
  const lines = [`🚨 <b>ប្រវត្តិសុវត្ថិភាព 8 ចុងក្រោយ</b>`, ``];
  for (const r of rows) {
    lines.push(
      `${iconFor[r.severity] || "•"} <b>#${r.id} ${telegram.escapeHtml(r.event_type)}</b>\n` +
        `   IP: <code>${telegram.escapeHtml(r.ip_address || "-")}</code>${r.email ? ` · ${telegram.escapeHtml(r.email)}` : ""}\n` +
        `   ${telegram.escapeHtml(r.request_path || "")} · ${security.formatPhnomPenhTime(r.created_at)}`,
    );
  }
  return { text: lines.join("\n"), reply_markup: mainMenuKeyboard() };
};

const buildBlockedPayload = async () => {
  const rows = await security.listBlockedIps();
  if (!rows.length) {
    return {
      text: `🟢 <b>បច្ចុប្បន្នគ្មាន IP ណាត្រូវបានប្លុកទេ។</b>\nប្រើ <code>/blockip 1.2.3.4</code> ដើម្បីប្លុក IP អ្នកវាយប្រហារ។`,
      reply_markup: mainMenuKeyboard(),
    };
  }
  const lines = [`🚫 <b>បញ្ជី IP ដែលកំពុងត្រូវបានប្លុក (${rows.length})</b>`, ``];
  const buttons = [];
  for (const r of rows.slice(0, 10)) {
    const exp = r.expires_at ? `ផុតកំណត់: ${security.formatPhnomPenhTime(r.expires_at)}` : "អចិន្ត្រៃយ៍";
    lines.push(`• <code>${telegram.escapeHtml(r.ip_address)}</code> — ${telegram.escapeHtml(r.reason || "-")} (${exp})`);
    buttons.push([
      { text: `✅ Unblock ${r.ip_address}`, callback_data: `unblock_ip:${r.ip_address}` },
    ]);
  }
  buttons.push([{ text: "🏠 ម៉ឺនុយដើម", callback_data: "cmd:menu" }]);
  return { text: lines.join("\n"), reply_markup: { inline_keyboard: buttons } };
};

const buildUsersPayload = async () => {
  const [rows] = await db.query(
    `SELECT id, full_name, email, role, is_active, created_at
     FROM users
     ORDER BY id DESC
     LIMIT 10`,
  );
  const lines = [`👥 <b>សមាជិកចុះឈ្មោះថ្មីៗ (${rows.length})</b>`, ``];
  for (const u of rows) {
    const state = u.is_active ? "🟢" : "🔴 BANNED";
    lines.push(
      `${state} <b>#${u.id} ${telegram.escapeHtml(u.full_name || "-")}</b> (${telegram.escapeHtml(u.role)})\n` +
        `   <code>${telegram.escapeHtml(u.email)}</code>`,
    );
  }
  lines.push(``, `ប្រើ <code>/find email</code> ដើម្បីស្វែងរក ឬ <code>/ban userId</code> ដើម្បីផ្អាកគណនី។`);
  return { text: lines.join("\n"), reply_markup: mainMenuKeyboard() };
};

const buildFindUserPayload = async (keyword) => {
  const q = String(keyword || "").trim();
  if (!q) {
    return {
      text: `ℹ️ សូមបញ្ចូលឈ្មោះ ឬ Email ឧទាហរណ៍៖ <code>/find student@example.com</code>`,
    };
  }
  const like = `%${q}%`;
  const [rows] = await db.query(
    `SELECT id, full_name, email, role, is_active, is_verified, last_login, created_at
     FROM users
     WHERE email LIKE ? OR full_name LIKE ? OR CAST(id AS CHAR) = ?
     ORDER BY id DESC
     LIMIT 5`,
    [like, like, q],
  );
  if (!rows.length) {
    return { text: `🔍 រកមិនឃើញសមាជិកត្រូវនឹង "<b>${telegram.escapeHtml(q)}</b>" ទេ។` };
  }
  const lines = [`🔍 <b>លទ្ធផលស្វែងរក "${telegram.escapeHtml(q)}"</b>`, ``];
  const keyboard = [];
  for (const u of rows) {
    lines.push(
      `${u.is_active ? "🟢 Active" : "🔴 BANNED"} · <b>#${u.id} ${telegram.escapeHtml(u.full_name)}</b>\n` +
        `   📧 <code>${telegram.escapeHtml(u.email)}</code>\n` +
        `   🏷️ Role: <code>${telegram.escapeHtml(u.role)}</code> · Last login: ${u.last_login ? security.formatPhnomPenhTime(u.last_login) : "Never"}`,
    );
    if (u.role !== "admin") {
      keyboard.push([
        u.is_active
          ? { text: `🚫 Ban #${u.id} (${u.full_name.slice(0, 14)})`, callback_data: `ban_user:${u.id}` }
          : { text: `✅ Unban #${u.id} (${u.full_name.slice(0, 14)})`, callback_data: `unban_user:${u.id}` },
      ]);
    }
  }
  keyboard.push([{ text: "🏠 ម៉ឺនុយដើម", callback_data: "cmd:menu" }]);
  return { text: lines.join("\n"), reply_markup: { inline_keyboard: keyboard } };
};

const buildPendingMentorsPayload = async () => {
  try {
    const [rows] = await db.query(
      `SELECT ma.id, ma.user_id, ma.professional_title, ma.company, ma.expertise, u.full_name, u.email
       FROM mentor_applications ma
       JOIN users u ON u.id = ma.user_id
       WHERE ma.status = 'pending'
       ORDER BY ma.created_at DESC
       LIMIT 6`,
    );
    if (!rows.length) {
      return {
        text: `✅ <b>គ្មានសំណើសុំធ្វើ Mentor រង់ចាំអនុម័តទេ។</b>`,
        reply_markup: mainMenuKeyboard(),
      };
    }
    const lines = [`🎓 <b>សំណើសុំធ្វើ Mentor រង់ចាំអនុម័ត (${rows.length})</b>`, ``];
    const keyboard = [];
    for (const r of rows) {
      lines.push(
        `• <b>#${r.id} ${telegram.escapeHtml(r.full_name)}</b> (<code>${telegram.escapeHtml(r.email)}</code>)\n` +
          `   ${telegram.escapeHtml(r.professional_title || "-")} @ ${telegram.escapeHtml(r.company || "-")}`,
      );
      keyboard.push([
        { text: `✅ Approve #${r.id}`, callback_data: `approve_mentor:${r.id}` },
        { text: `❌ Reject #${r.id}`, callback_data: `reject_mentor:${r.id}` },
      ]);
    }
    keyboard.push([{ text: "🏠 ម៉ឺនុយដើម", callback_data: "cmd:menu" }]);
    return { text: lines.join("\n"), reply_markup: { inline_keyboard: keyboard } };
  } catch {
    return {
      text: `ℹ️ មិនមានសំណើ Mentor រង់ចាំទេ។`,
      reply_markup: mainMenuKeyboard(),
    };
  }
};

const handleMessage = async (message) => {
  const chatId = message?.chat?.id;
  if (!chatId) return;
  const rawText = String(message.text || "").trim();
  if (!rawText) return;

  const [rawCmd, ...argParts] = rawText.split(/\s+/);
  const cmd = rawCmd.toLowerCase().replace(/@[a-z0-9_]+$/i, "");
  const argStr = argParts.join(" ").trim();
  const actorLabel = message.from?.username
    ? `@${message.from.username}`
    : `${message.from?.first_name || "Admin"} (${chatId})`;

  // /myid is always allowed so the owner can easily retrieve their numeric Chat ID
  if (cmd === "/myid") {
    await telegram.sendMessage(
      chatId,
      `🆔 <b>Telegram Chat ID របស់អ្នក:</b> <code>${chatId}</code>\n\n` +
        `ដាក់លេខនេះក្នុង Environment Variable <code>TELEGRAM_ADMIN_CHAT_ID=${chatId}</code> ឬផ្ញើ <code>/claim &lt;secret_code&gt;</code> ដើម្បីភ្ជាប់ជា Super Admin។`,
    );
    return;
  }

  // Secure one-time /claim <code> linking for initial setup
  if (cmd === "/claim") {
    const expectedClaim = telegram.getClaimCode();
    const expectedWebhook = telegram.getWebhookSecret();
    const valid =
      (expectedClaim && telegram.timingSafeEqualString(argStr, expectedClaim)) ||
      (expectedWebhook && telegram.timingSafeEqualString(argStr, expectedWebhook));

    if (!valid) {
      await security.recordSecurityEvent({
        eventType: "TELEGRAM_CLAIM_FAILED",
        severity: "critical",
        ip: `tg:${chatId}`,
        details: { username: message.from?.username || "", firstName: message.from?.first_name || "" },
        title: "Unauthorized Telegram /claim attempt",
        includeBlockIpButton: false,
      });
      await telegram.sendMessage(chatId, "⛔ លេខកូដភ្ជាប់មិនត្រឹមត្រូវទេ។");
      return;
    }

    await security.registerAdminChat({
      chatId,
      username: message.from?.username,
      firstName: message.from?.first_name,
    });
    await telegram.sendMessage(
      chatId,
      `✅ <b>ភ្ជាប់គណនី Super Admin Telegram ជោគជ័យ!</b>\n🆔 Chat ID: <code>${chatId}</code>\n\n` +
        buildHelpMessage(),
      { reply_markup: mainMenuKeyboard() },
    );
    return;
  }

  // Strictly enforce Super Admin whitelist for every other command
  const authorized = await security.isAuthorizedAdminChat(chatId);
  if (!authorized) {
    const existingAdmins = await security.getAdminChatIds();
    if (!existingAdmins.length && cmd === "/start") {
      await telegram.sendMessage(
        chatId,
        `🛡️ <b>Smart Community Security Bot</b>\n\n` +
          `🆔 Chat ID របស់អ្នកគឺ៖ <code>${chatId}</code>\n\n` +
          `ដើម្បីភ្ជាប់ជាម្ចាស់ Super Admin សូមដាក់ <code>TELEGRAM_ADMIN_CHAT_ID=${chatId}</code> ក្នុង Vercel / .env ឬប្រើពាក្យបញ្ជា <code>/claim &lt;claim_code&gt;</code>។`,
      );
      return;
    }

    security.triggerSecurityAlert({
      eventType: "TELEGRAM_UNAUTHORIZED_ACCESS",
      severity: "warning",
      ip: `tg:${chatId}`,
      details: {
        chatId: String(chatId),
        username: message.from?.username || "none",
        command: rawText.slice(0, 80),
      },
      title: "Unauthorized user messaged Admin Telegram Bot",
      includeBlockIpButton: false,
      cooldownKey: `tg_unauth:${chatId}`,
      cooldownMs: 300_000,
    });
    await telegram.sendMessage(
      chatId,
      "⛔ <b>Access Denied</b>\nBot នេះសម្រាប់តែ Super Admin របស់ Smart Community ប៉ុណ្ណោះ។",
    );
    return;
  }

  if (cmd === "/start" || cmd === "/help" || cmd === "/menu") {
    await telegram.sendMessage(chatId, buildHelpMessage(), { reply_markup: mainMenuKeyboard() });
    return;
  }

  if (cmd === "/status") {
    await telegram.sendMessage(chatId, await buildStatusMessage(), { reply_markup: mainMenuKeyboard() });
    return;
  }

  if (cmd === "/alerts") {
    const payload = await buildAlertsMessage();
    await telegram.sendMessage(chatId, payload.text, { reply_markup: payload.reply_markup });
    return;
  }

  if (cmd === "/settings") {
    const payload = await buildSettingsPayload();
    await telegram.sendMessage(chatId, payload.text, { reply_markup: payload.reply_markup });
    return;
  }

  if (cmd === "/blocked") {
    const payload = await buildBlockedPayload();
    await telegram.sendMessage(chatId, payload.text, { reply_markup: payload.reply_markup });
    return;
  }

  if (cmd === "/blockip") {
    const [ip, ...reasonParts] = argParts;
    if (!ip) {
      await telegram.sendMessage(chatId, "ℹ️ ប្រើប្រាស់៖ <code>/blockip 1.2.3.4 [ហេតុផល]</code>");
      return;
    }
    const res = await security.blockIp(ip, reasonParts.join(" ") || "Manual Telegram block", actorLabel);
    await telegram.sendMessage(
      chatId,
      res.ok
        ? `🚫 <b>បានប្លុក IP</b> <code>${telegram.escapeHtml(res.ip)}</code> ដោយជោគជ័យ!`
        : `⚠️ ${telegram.escapeHtml(res.reason)}`,
    );
    return;
  }

  if (cmd === "/unblockip") {
    const [ip] = argParts;
    if (!ip) {
      await telegram.sendMessage(chatId, "ℹ️ ប្រើប្រាស់៖ <code>/unblockip 1.2.3.4</code>");
      return;
    }
    const res = await security.unblockIp(ip);
    await telegram.sendMessage(
      chatId,
      res.ok
        ? `✅ <b>បានដោះប្លុក IP</b> <code>${telegram.escapeHtml(res.ip)}</code> ហើយ។`
        : `ℹ️ រកមិនឃើញ IP <code>${telegram.escapeHtml(ip)}</code> ក្នុងបញ្ជីប្លុកទេ។`,
    );
    return;
  }

  if (cmd === "/lockdown") {
    const mode = String(argParts[0] || "").toLowerCase();
    if (!["on", "off"].includes(mode)) {
      const current = await security.isLockdownActive();
      await telegram.sendMessage(
        chatId,
        `🛡️ របៀប Lockdown បច្ចុប្បន្ន៖ <b>${current ? "🔴 ON" : "🟢 OFF"}</b>\nប្រើ <code>/lockdown on</code> ឬ <code>/lockdown off</code>`,
      );
      return;
    }
    await security.setSetting("maintenance_lockdown", mode === "on");
    await telegram.sendMessage(
      chatId,
      mode === "on"
        ? `🔴 <b>EMERGENCY LOCKDOWN: ON</b>\nរាល់សកម្មភាពសរសេរទិន្នន័យសាធារណៈត្រូវបានបិទជាបណ្តោះអាសន្ន។ Admin និង Telegram Bot នៅដំណើរការធម្មតា។`
        : `🟢 <b>EMERGENCY LOCKDOWN: OFF</b>\nវេបសាយត្រឡប់មកដំណើរការធម្មតាវិញហើយ។`,
    );
    return;
  }

  if (cmd === "/users") {
    const payload = await buildUsersPayload();
    await telegram.sendMessage(chatId, payload.text, { reply_markup: payload.reply_markup });
    return;
  }

  if (cmd === "/find") {
    const payload = await buildFindUserPayload(argStr);
    await telegram.sendMessage(chatId, payload.text, payload.reply_markup ? { reply_markup: payload.reply_markup } : {});
    return;
  }

  if (cmd === "/ban" || cmd === "/unban") {
    const userId = Number(argParts[0]);
    if (!Number.isInteger(userId) || userId <= 0) {
      await telegram.sendMessage(chatId, `ℹ️ ប្រើប្រាស់៖ <code>${cmd} &lt;userId&gt;</code>`);
      return;
    }
    const [rows] = await db.query("SELECT id, full_name, email, role FROM users WHERE id = ?", [userId]);
    const target = rows[0];
    if (!target) {
      await telegram.sendMessage(chatId, `❌ រកមិនឃើញសមាជិកលេខ #${userId} ទេ។`);
      return;
    }
    if (target.role === "admin" && cmd === "/ban") {
      await telegram.sendMessage(chatId, "⛔ មិនអាច Ban គណនី Admin តាមពាក្យបញ្ជានេះបានទេ។");
      return;
    }
    const nextActive = cmd === "/unban" ? 1 : 0;
    await db.query("UPDATE users SET is_active = ? WHERE id = ?", [nextActive, userId]);
    await telegram.sendMessage(
      chatId,
      nextActive
        ? `✅ <b>បានបើកគណនីឡើងវិញ:</b> #${target.id} ${telegram.escapeHtml(target.full_name)} (<code>${telegram.escapeHtml(target.email)}</code>)`
        : `🚫 <b>បានផ្អាកគណនី (BANNED):</b> #${target.id} ${telegram.escapeHtml(target.full_name)} (<code>${telegram.escapeHtml(target.email)}</code>)`,
    );
    return;
  }

  if (cmd === "/pending") {
    const payload = await buildPendingMentorsPayload();
    await telegram.sendMessage(chatId, payload.text, { reply_markup: payload.reply_markup });
    return;
  }

  await telegram.sendMessage(chatId, `❓ មិនស្គាល់ពាក្យបញ្ជា <code>${telegram.escapeHtml(cmd)}</code>។ ចុច /help ដើម្បីមើលបញ្ជី។`, {
    reply_markup: mainMenuKeyboard(),
  });
};

const handleCallbackQuery = async (callbackQuery) => {
  const cbId = callbackQuery?.id;
  const chatId = callbackQuery?.message?.chat?.id;
  const messageId = callbackQuery?.message?.message_id;
  const data = String(callbackQuery?.data || "");
  if (!cbId || !chatId) return;

  const authorized = await security.isAuthorizedAdminChat(chatId);
  if (!authorized) {
    await telegram.answerCallbackQuery(cbId, "⛔ Access denied.", true);
    return;
  }

  const actorLabel = callbackQuery.from?.username
    ? `@${callbackQuery.from.username}`
    : `${callbackQuery.from?.first_name || "Admin"} (${chatId})`;

  const [action, param] = data.split(":");

  if (action === "approve_login" || action === "deny_login") {
    const decision = action === "approve_login" ? "approve" : "deny";
    const result = await security.decideAdminLoginApproval(param, decision, actorLabel);
    if (!result.ok) {
      await telegram.answerCallbackQuery(
        cbId,
        result.reason === "EXPIRED"
          ? "⏳ សំណើនេះផុតកំណត់ហើយ។"
          : `ℹ️ សំណើនេះត្រូវបានសម្រេចរួចហើយ (${result.status || result.reason})។`,
        true,
      );
      return;
    }

    const r = result.record;
    const statusLine =
      decision === "approve"
        ? `✅ <b>APPROVED BY ${telegram.escapeHtml(actorLabel)}</b>\nអ្នកអាចបន្តចូលប្រើផ្ទាំង Admin លើ Browser បានភ្លាមៗ!`
        : `🚨 <b>DENIED &amp; IP BLOCKED (24h) BY ${telegram.escapeHtml(actorLabel)}</b>\nIP <code>${telegram.escapeHtml(r.ip_address)}</code> ត្រូវបានប្លុកភ្លាមៗ!`;

    await telegram.answerCallbackQuery(
      cbId,
      decision === "approve" ? "✅ បានអនុញ្ញាតការចូលប្រព័ន្ធ!" : "🚨 បានបដិសេធ និងប្លុក IP រួចរាល់!",
      false,
    );
    await telegram.editMessageText(
      chatId,
      messageId,
      [
        `🔐 <b>សំណើចូលគណនី SUPER ADMIN (#${r.id})</b>`,
        `👤 <b>Admin:</b> <code>${telegram.escapeHtml(r.email)}</code>`,
        `🌐 <b>IP:</b> <code>${telegram.escapeHtml(r.ip_address || "-")}</code>`,
        `💻 <b>Device:</b> ${telegram.escapeHtml(r.device_label || "-")}`,
        ``,
        statusLine,
      ].join("\n"),
    );
    return;
  }

  if (action === "block_ip") {
    const res = await security.blockIp(param, "1-Tap Telegram block from alert", actorLabel);
    await telegram.answerCallbackQuery(
      cbId,
      res.ok ? `🚫 Blocked ${res.ip}` : res.reason,
      !res.ok,
    );
    if (res.ok) {
      await telegram.sendMessage(
        chatId,
        `🚫 <b>បានប្លុក IP</b> <code>${telegram.escapeHtml(res.ip)}</code> ដោយជោគជ័យ (ដោយ ${telegram.escapeHtml(actorLabel)})។`,
      );
    }
    return;
  }

  if (action === "unblock_ip") {
    await security.unblockIp(param);
    await telegram.answerCallbackQuery(cbId, `✅ Unblocked ${param}`);
    const payload = await buildBlockedPayload();
    await telegram.editMessageText(chatId, messageId, payload.text, { reply_markup: payload.reply_markup });
    return;
  }

  if (action === "toggle_setting") {
    const current = await security.getSettings();
    if (param in security.DEFAULT_SETTINGS) {
      const nextVal = !current[param];
      await security.setSetting(param, nextVal);
      await telegram.answerCallbackQuery(cbId, `${nextVal ? "✅ ON" : "⚪ OFF"}: ${param}`);
      const payload = await buildSettingsPayload();
      await telegram.editMessageText(chatId, messageId, payload.text, { reply_markup: payload.reply_markup });
    }
    return;
  }

  if (action === "ban_user" || action === "unban_user") {
    const userId = Number(param);
    const nextActive = action === "unban_user" ? 1 : 0;
    const [rows] = await db.query("SELECT id, full_name, email, role FROM users WHERE id = ?", [userId]);
    const target = rows[0];
    if (!target || (target.role === "admin" && !nextActive)) {
      await telegram.answerCallbackQuery(cbId, "⛔ មិនអាចធ្វើប្រតិបត្តិការនេះបានទេ។", true);
      return;
    }
    await db.query("UPDATE users SET is_active = ? WHERE id = ?", [nextActive, userId]);
    await telegram.answerCallbackQuery(cbId, nextActive ? "✅ Unbanned" : "🚫 Banned");
    await telegram.sendMessage(
      chatId,
      nextActive
        ? `✅ <b>បានបើកគណនី #${target.id}</b> (${telegram.escapeHtml(target.email)}) ឡើងវិញ។`
        : `🚫 <b>បានផ្អាកគណនី #${target.id}</b> (${telegram.escapeHtml(target.email)}) ហើយ។`,
    );
    return;
  }

  if (action === "approve_mentor" || action === "reject_mentor") {
    const appId = Number(param);
    const approve = action === "approve_mentor";
    const [rows] = await db.query(
      "SELECT id, user_id, status FROM mentor_applications WHERE id = ?",
      [appId],
    );
    const appRow = rows[0];
    if (!appRow || appRow.status !== "pending") {
      await telegram.answerCallbackQuery(cbId, "ℹ️ សំណើនេះត្រូវបានពិនិត្យរួចហើយ។", true);
      return;
    }
    await db.query(
      "UPDATE mentor_applications SET status = ?, reviewed_at = NOW() WHERE id = ?",
      [approve ? "approved" : "rejected", appId],
    );
    if (approve) {
      await db.query("UPDATE users SET role = 'mentor' WHERE id = ? AND role != 'admin'", [appRow.user_id]);
    }
    await telegram.answerCallbackQuery(cbId, approve ? "✅ Approved Mentor!" : "❌ Rejected Mentor");
    const payload = await buildPendingMentorsPayload();
    await telegram.editMessageText(chatId, messageId, payload.text, { reply_markup: payload.reply_markup });
    return;
  }

  if (action === "cmd") {
    await telegram.answerCallbackQuery(cbId);
    if (param === "menu") {
      await telegram.editMessageText(chatId, messageId, buildHelpMessage(), { reply_markup: mainMenuKeyboard() });
    } else if (param === "status") {
      await telegram.editMessageText(chatId, messageId, await buildStatusMessage(), { reply_markup: mainMenuKeyboard() });
    } else if (param === "alerts") {
      const payload = await buildAlertsMessage();
      await telegram.editMessageText(chatId, messageId, payload.text, { reply_markup: payload.reply_markup });
    } else if (param === "settings") {
      const payload = await buildSettingsPayload();
      await telegram.editMessageText(chatId, messageId, payload.text, { reply_markup: payload.reply_markup });
    } else if (param === "blocked") {
      const payload = await buildBlockedPayload();
      await telegram.editMessageText(chatId, messageId, payload.text, { reply_markup: payload.reply_markup });
    } else if (param === "users") {
      const payload = await buildUsersPayload();
      await telegram.editMessageText(chatId, messageId, payload.text, { reply_markup: payload.reply_markup });
    } else if (param === "pending") {
      const payload = await buildPendingMentorsPayload();
      await telegram.editMessageText(chatId, messageId, payload.text, { reply_markup: payload.reply_markup });
    }
  }
};

const webhookHandler = async (req, res) => {
  if (!telegram.isConfigured()) {
    return res.status(503).json({ ok: false, error: "Telegram bot is not configured." });
  }

  const providedSecret = req.headers["x-telegram-bot-api-secret-token"];
  if (!telegram.verifyWebhookSecret(providedSecret)) {
    security.triggerSecurityAlert({
      eventType: "TELEGRAM_WEBHOOK_FORGERY",
      severity: "critical",
      req,
      title: "Invalid Telegram webhook secret token",
      cooldownMs: 120_000,
    });
    return res.status(401).json({ ok: false, error: "Invalid webhook secret." });
  }

  try {
    const update = req.body || {};
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    } else if (update.message) {
      await handleMessage(update.message);
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return res.json({ ok: true });
  }
};

const getAdminTelegramStatus = async (req, res, next) => {
  try {
    await security.ensureSecurityTables();
    const configured = telegram.isConfigured();
    const [settings, adminChatIds, [[evRow]], [[critRow]], [[blkRow]]] = await Promise.all([
      security.getSettings(),
      security.getAdminChatIds(),
      db.query("SELECT COUNT(*) AS total FROM security_events WHERE created_at >= NOW() - INTERVAL 24 HOUR"),
      db.query("SELECT COUNT(*) AS total FROM security_events WHERE severity = 'critical' AND created_at >= NOW() - INTERVAL 24 HOUR"),
      db.query("SELECT COUNT(*) AS total FROM blocked_ips WHERE expires_at IS NULL OR expires_at > NOW()"),
    ]);

    let botUsername = null;
    let webhookInfo = null;
    if (configured) {
      const [meRes, whInfo] = await Promise.all([
        telegram.getMe(),
        telegram.callTelegramApi("getWebhookInfo"),
      ]);
      if (meRes?.ok && meRes.result?.username) {
        botUsername = meRes.result.username;
      }
      if (whInfo?.ok && whInfo.result) {
        webhookInfo = {
          url: whInfo.result.url || "",
          pendingUpdateCount: Number(whInfo.result.pending_update_count || 0),
          lastErrorMessage: whInfo.result.last_error_message || null,
        };
      }
    }

    return res.json({
      configured,
      botUsername,
      webhookInfo,
      adminChatCount: adminChatIds.length,
      claimCode: configured ? telegram.getClaimCode() : null,
      settings,
      settingMeta: security.SETTING_META,
      stats24h: {
        events: Number(evRow?.total || 0),
        critical: Number(critRow?.total || 0),
        blockedIps: Number(blkRow?.total || 0),
      },
    });
  } catch (err) {
    return next(err);
  }
};

const updateTelegramSettingEndpoint = async (req, res, next) => {
  try {
    const { key, enabled } = req.body || {};
    if (!key || !(key in security.DEFAULT_SETTINGS)) {
      return res.status(400).json({ error: "Invalid Telegram alert setting key." });
    }
    const settings = await security.setSetting(key, Boolean(enabled));
    return res.json({ ok: true, settings });
  } catch (err) {
    return next(err);
  }
};

const sendTestAlertEndpoint = async (req, res, next) => {
  try {
    if (!telegram.isConfigured()) {
      return res.status(400).json({ error: "TELEGRAM_BOT_TOKEN is not configured on the server." });
    }
    const adminIds = await security.getAdminChatIds();
    if (!adminIds.length) {
      return res.status(400).json({
        error: "No Super Admin Telegram chat is linked yet. Send /claim <code> to the bot first.",
      });
    }
    const { sent } = await security.sendToAllAdmins(
      [
        `✅ <b>Test Alert — Smart Community Security SOC</b>`,
        `ការភ្ជាប់រវាងវេបសាយ និង Telegram Bot កំពុងដំណើរការ ១០០%!`,
        ``,
        `👤 <b>Triggered by:</b> ${telegram.escapeHtml(req.user?.email || "Super Admin")}`,
        `🕒 <b>Time (KH):</b> ${security.formatPhnomPenhTime()}`,
      ].join("\n"),
      { reply_markup: mainMenuKeyboard() },
    );
    return res.json({ ok: sent > 0, sent });
  } catch (err) {
    return next(err);
  }
};

const setupWebhookEndpoint = async (req, res, next) => {
  try {
    if (!telegram.isConfigured()) {
      return res.status(400).json({ error: "TELEGRAM_BOT_TOKEN is not configured." });
    }
    const originHeader = req.headers?.origin && /^https:\/\//i.test(req.headers.origin)
      ? req.headers.origin
      : "";
    const baseUrl = String(
      req.body?.publicUrl ||
        process.env.PUBLIC_APP_URL ||
        originHeader ||
        process.env.APP_URL ||
        "https://smartcommunity-one.vercel.app",
    ).replace(/\/+$/, "");
    const webhookUrl = `${baseUrl}/api/telegram/webhook`;
    const [meRes, whRes, cmdRes] = await Promise.all([
      telegram.getMe(),
      telegram.setWebhook(webhookUrl, telegram.getWebhookSecret()),
      telegram.setMyCommands(BOT_COMMANDS),
    ]);
    return res.json({
      ok: Boolean(whRes.ok),
      webhookUrl,
      botUsername: meRes?.ok ? meRes.result?.username : null,
      claimCode: telegram.getClaimCode(),
      webhook: whRes,
      commands: cmdRes,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  BOT_COMMANDS,
  webhookHandler,
  getAdminTelegramStatus,
  updateTelegramSettingEndpoint,
  sendTestAlertEndpoint,
  setupWebhookEndpoint,
};
