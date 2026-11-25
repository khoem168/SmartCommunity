const crypto = require("crypto");

const TELEGRAM_API_BASE = "https://api.telegram.org";

const getBotToken = () => String(process.env.TELEGRAM_BOT_TOKEN || "").trim();

const getEnvAdminChatIds = () =>
  String(process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

const getWebhookSecret = () => {
  const configured = String(process.env.TELEGRAM_WEBHOOK_SECRET || "").trim();
  if (configured) return configured;
  const token = getBotToken();
  if (!token) return "";
  return crypto
    .createHash("sha256")
    .update(`${token}:smart-community-webhook-secret`)
    .digest("hex")
    .slice(0, 48);
};

const getClaimCode = () => {
  const configured = String(process.env.TELEGRAM_ADMIN_CLAIM_CODE || "").trim();
  if (configured) return configured;
  const secret = getWebhookSecret();
  return secret ? secret.slice(0, 16) : "";
};

const timingSafeEqualString = (a, b) => {
  const bufA = Buffer.from(String(a || ""), "utf8");
  const bufB = Buffer.from(String(b || ""), "utf8");
  if (!bufA.length || bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

const verifyWebhookSecret = (providedHeader) => {
  const expected = getWebhookSecret();
  if (!expected) return false;
  return timingSafeEqualString(providedHeader, expected);
};

const isConfigured = () => Boolean(getBotToken());

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const callTelegramApi = async (method, payload = {}) => {
  const token = getBotToken();
  if (!token) {
    return { ok: false, skipped: true, description: "TELEGRAM_BOT_TOKEN is not set." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8500);

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({ ok: false }));
    if (!response.ok || !data.ok) {
      return {
        ok: false,
        status: response.status,
        description: data.description || "Telegram API error",
      };
    }
    return data;
  } catch (err) {
    return { ok: false, description: err.message || "Telegram network error" };
  } finally {
    clearTimeout(timeout);
  }
};

const sendMessage = (chatId, text, options = {}) =>
  callTelegramApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...options,
  });

const editMessageText = (chatId, messageId, text, options = {}) =>
  callTelegramApi("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...options,
  });

const answerCallbackQuery = (callbackQueryId, text = "", showAlert = false) =>
  callTelegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text: String(text || "").slice(0, 180),
    show_alert: Boolean(showAlert),
  });

const setWebhook = (url, secretToken = getWebhookSecret()) =>
  callTelegramApi("setWebhook", {
    url,
    secret_token: secretToken,
    allowed_updates: ["message", "callback_query"],
  });

const setMyCommands = (commands) =>
  callTelegramApi("setMyCommands", { commands });

const getMe = () => callTelegramApi("getMe");

module.exports = {
  isConfigured,
  getBotToken,
  getEnvAdminChatIds,
  getWebhookSecret,
  getClaimCode,
  timingSafeEqualString,
  verifyWebhookSecret,
  escapeHtml,
  callTelegramApi,
  sendMessage,
  editMessageText,
  answerCallbackQuery,
  setWebhook,
  setMyCommands,
  getMe,
};
