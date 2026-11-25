const { ipKeyGenerator, rateLimit } = require("express-rate-limit");

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const accountAndIpKey = (req) => {
  const ip = ipKeyGenerator(req.ip);
  const email = normalizeEmail(req.body?.email);
  return email ? `${ip}:${email}` : ip;
};

const createLimiter = (limit, message, options = {}) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: message, code: "RATE_LIMITED" },
    ...options,
  });

const authLimiter = createLimiter(
  20,
  "Too many authentication requests for this account. Try again later.",
  { keyGenerator: accountAndIpKey },
);
const loginLimiter = createLimiter(
  10,
  "Too many failed login attempts for this account. Try again in 15 minutes.",
  {
    keyGenerator: accountAndIpKey,
    skipSuccessfulRequests: true,
  },
);
const tokenRequestLimiter = createLimiter(
  10,
  "Too many email or password requests for this account. Try again later.",
  { keyGenerator: accountAndIpKey },
);
const apiLimiter = createLimiter(
  3000,
  "Too many requests from this IP address. Please wait a moment and try again.",
);

module.exports = {
  apiLimiter,
  authLimiter,
  loginLimiter,
  tokenRequestLimiter,
};
