const { ipKeyGenerator, rateLimit } = require("express-rate-limit");
const securityAlerts = require("../services/securityAlertService");

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const accountAndIpKey = (req) => {
  const ip = ipKeyGenerator(req.ip);
  const email = normalizeEmail(req.body?.email);
  return email ? `${ip}:${email}` : ip;
};

const createLimiter = (limit, message, options = {}) => {
  const { alertLabel = "RATE_LIMIT_EXCEEDED", ...rest } = options;
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (req, res) => {
      securityAlerts.triggerSecurityAlert({
        eventType: alertLabel,
        severity: alertLabel === "BRUTE_FORCE_LOGIN" ? "critical" : "warning",
        req,
        email: normalizeEmail(req.body?.email) || null,
        title:
          alertLabel === "BRUTE_FORCE_LOGIN"
            ? "រកឃើញការវាយប្រហារ Brute-Force លើទំព័រ Login!"
            : "រកឃើញការបាញ់ Request លើសកំណត់ (Rate Limit)",
        details: { limitPer15Min: limit },
        alertSettingKey: "rate_limit_alerts",
        cooldownKey: `rl:${alertLabel}:${securityAlerts.extractClientIp(req)}`,
        cooldownMs: 120_000,
      });
      return res.status(429).json({ error: message, code: "RATE_LIMITED" });
    },
    ...rest,
  });
};

const authLimiter = createLimiter(
  20,
  "Too many authentication requests for this account. Try again later.",
  { keyGenerator: accountAndIpKey, alertLabel: "AUTH_FLOOD" },
);
const loginLimiter = createLimiter(
  10,
  "Too many failed login attempts for this account. Try again in 15 minutes.",
  {
    keyGenerator: accountAndIpKey,
    skipSuccessfulRequests: true,
    alertLabel: "BRUTE_FORCE_LOGIN",
  },
);
const tokenRequestLimiter = createLimiter(
  10,
  "Too many email or password requests for this account. Try again later.",
  { keyGenerator: accountAndIpKey, alertLabel: "TOKEN_REQUEST_FLOOD" },
);
const apiLimiter = createLimiter(
  3000,
  "Too many requests from this IP address. Please wait a moment and try again.",
  { alertLabel: "API_FLOOD" },
);

module.exports = {
  apiLimiter,
  authLimiter,
  loginLimiter,
  tokenRequestLimiter,
};
