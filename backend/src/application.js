const http = require("http");
const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");

dotenv.config();
require("./config/validateEnv")();

const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const platformRoutes = require("./routes/platformRoutes");
const profileRoutes = require("./routes/profileRoutes");
const calendarRoutes = require("./routes/calendarRoutes");
const searchRoutes = require("./routes/searchRoutes");
const assistantRoutes = require("./routes/assistantRoutes");
const telegramRoutes = require("./routes/telegramRoutes");
const { apiLimiter } = require("./middleware/rateLimits");
const {
  ipBlockAndLockdownGuard,
  securityHardening,
} = require("./middleware/security");
const setupSockets = require("./sockets");
const db = require("./config/db");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
const server = http.createServer(app);
const io = setupSockets(server);

app.set("io", io);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    frameguard: { action: "sameorigin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
if (process.env.VERCEL_URL) {
  const vercelOrigin = `https://${process.env.VERCEL_URL}`;
  if (!allowedOrigins.includes(vercelOrigin)) {
    allowedOrigins.push(vercelOrigin);
  }
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isLocalDevOrigin =
    process.env.NODE_ENV !== "production" &&
    origin &&
    /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(
      origin,
    );
  const allowedOrigin =
    allowedOrigins.includes("*") || !origin || allowedOrigins.includes(origin) || isLocalDevOrigin
      ? origin || allowedOrigins[0]
      : allowedOrigins[0];

  res.header("Access-Control-Allow-Origin", allowedOrigin);
  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");

  if (req.method === "OPTIONS") return res.sendStatus(204);
  return next();
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(securityHardening);
app.use(ipBlockAndLockdownGuard);

app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
    );
    if (!/\.(jpe?g|png|webp|pdf)$/i.test(req.path)) {
      res.setHeader("Content-Disposition", "attachment");
    }
    next();
  },
  express.static(path.join(__dirname, "..", "uploads")),
);

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Smart Community Skill & Career Development API",
    health: "/health",
    api: "/api",
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "smart-community-api" });
});

app.get("/db-check", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Route not found." });
  }

  try {
    const [rows] = await db.query("SELECT COUNT(*) AS cnt FROM users");
    res.json({ users: rows[0].cnt });
  } catch (err) {
    res.status(500).json({ error: "Database connection failed." });
  }
});

// Telegram Webhook mounted before rate limiter so Telegram callbacks are never throttled
app.use("/api/telegram", telegramRoutes);

app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api", platformRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  if (
    err.name === "MulterError" ||
    err.message?.includes("images are allowed") ||
    err.message?.includes("PDF files are allowed") ||
    err.message?.includes("Chat files must be") ||
    err.message?.includes("declared file type")
  ) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({
    error: process.env.NODE_ENV === "production" ? "Server error." : err.message,
  });
});

// Export the HTTP server so Vercel can handle both Express and WebSocket upgrades.
module.exports = server;
