const { rateLimit } = require("express-rate-limit");

const createLimiter = (limit, message) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: message, code: "RATE_LIMITED" },
  });

const authLimiter = createLimiter(20, "Too many authentication requests. Try again later.");
const loginLimiter = createLimiter(10, "Too many login attempts. Try again in 15 minutes.");
const tokenRequestLimiter = createLimiter(
  10,
  "Too many email or password requests. Try again later.",
);

module.exports = {
  authLimiter,
  loginLimiter,
  tokenRequestLimiter,
};
