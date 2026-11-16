const express = require("express");
const { ipKeyGenerator } = require("express-rate-limit");
const AnthropicModule = require("@anthropic-ai/sdk");
const db = require("../config/db");
const { optionalAuth } = require("../middleware/auth");
const { runAssistantTurn } = require("../services/assistant/agent");

const Anthropic = AnthropicModule.default || AnthropicModule;
const router = express.Router();

// Daily question limits, counted in the database so they hold across
// serverless instances. The site-wide cap bounds the total daily bill.
const LIMITS = {
  member: Number(process.env.ASSISTANT_DAILY_LIMIT_MEMBER || 30),
  guest: Number(process.env.ASSISTANT_DAILY_LIMIT_GUEST || 10),
  site: Number(process.env.ASSISTANT_DAILY_LIMIT_SITE || 200),
};

const countUse = async (key) => {
  await db.query(
    `INSERT INTO assistant_usage (usage_key, usage_day, question_count)
     VALUES (?, UTC_DATE(), 1)
     ON DUPLICATE KEY UPDATE question_count = question_count + 1`,
    [key],
  );
  const [[row]] = await db.query(
    "SELECT question_count FROM assistant_usage WHERE usage_key = ? AND usage_day = UTC_DATE()",
    [key],
  );
  return Number(row.question_count);
};

router.get("/status", (req, res) => {
  res.json({ available: Boolean(process.env.ANTHROPIC_API_KEY) });
});

router.post("/chat", optionalAuth, async (req, res, next) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message || message.length > 2000) {
    return res.status(400).json({ error: "Write a message of up to 2000 characters.", code: "INVALID_MESSAGE" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "The assistant is not set up yet.", code: "ASSISTANT_NOT_CONFIGURED" });
  }

  try {
    const personal = req.user ? `user:${req.user.id}` : `ip:${ipKeyGenerator(req.ip)}`;
    const used = await countUse(personal);
    const siteUsed = await countUse("site");
    if (used > (req.user ? LIMITS.member : LIMITS.guest)) {
      return res.status(429).json({ error: "Daily question limit reached.", code: req.user ? "DAILY_LIMIT" : "GUEST_LIMIT" });
    }
    if (siteUsed > LIMITS.site) {
      return res.status(429).json({ error: "The assistant is busy today. Try again tomorrow.", code: "SITE_LIMIT" });
    }
  } catch (error) {
    return next(error);
  }

  res.status(200);
  res.set({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-store, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();

  const controller = new AbortController();
  res.on("close", () => controller.abort());
  const emit = (event) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    await runAssistantTurn({
      message,
      history: req.body.history,
      user: req.user || null,
      page: req.body.page,
      language: req.body.language,
      emit,
      signal: controller.signal,
    });
  } catch (error) {
    if (!controller.signal.aborted) {
      // Users see a short reason code; details stay in the server logs.
      const code =
        error instanceof Anthropic.RateLimitError ? "UPSTREAM_BUSY"
          : error instanceof Anthropic.AuthenticationError ? "ASSISTANT_KEY_REJECTED"
            : error instanceof Anthropic.PermissionDeniedError ? "ASSISTANT_NO_ACCESS"
            : error instanceof Anthropic.APIError ? "UPSTREAM_ERROR"
              : "SERVER_ERROR";
      console.error("Assistant turn failed:", error.status || "", error.message);
      emit({ type: "error", code });
    }
  } finally {
    res.end();
  }
});

module.exports = router;
