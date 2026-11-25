const express = require("express");
const {
  webhookHandler,
  getAdminTelegramStatus,
  updateTelegramSettingEndpoint,
  sendTestAlertEndpoint,
  setupWebhookEndpoint,
} = require("../controllers/telegramController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Telegram webhook receiver (verified via X-Telegram-Bot-Api-Secret-Token)
router.post("/webhook", webhookHandler);

// Admin-only Telegram Security Bot management endpoints
router.get("/status", requireAuth, requireRole("admin"), getAdminTelegramStatus);
router.patch("/settings", requireAuth, requireRole("admin"), updateTelegramSettingEndpoint);
router.post("/test-alert", requireAuth, requireRole("admin"), sendTestAlertEndpoint);
router.post("/setup-webhook", requireAuth, requireRole("admin"), setupWebhookEndpoint);

module.exports = router;
