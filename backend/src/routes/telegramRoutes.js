const express = require("express");
const { webhookHandler, setupWebhookEndpoint } = require("../controllers/telegramController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Telegram webhook receiver (verified via X-Telegram-Bot-Api-Secret-Token)
router.post("/webhook", webhookHandler);

// Admin-only helper endpoint to register webhook & command menu
router.post("/setup-webhook", requireAuth, requireRole("admin"), setupWebhookEndpoint);

module.exports = router;
