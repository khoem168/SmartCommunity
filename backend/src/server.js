const http = require("http");
const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");

dotenv.config();

const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const platformRoutes = require("./routes/platformRoutes");
const profileRoutes = require("./routes/profileRoutes");
const setupSockets = require("./sockets");
const db = require("./config/db");

const app = express();
const server = http.createServer(app);
const io = setupSockets(server);

app.set("io", io);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigin =
    allowedOrigins.includes("*") || !origin || allowedOrigins.includes(origin)
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
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "smart-community-api" });
});

app.get("/db-check", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT COUNT(*) AS cnt FROM users");
    res.json({ users: rows[0].cnt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
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
    err.message?.includes("Chat files must be")
  ) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({
    error: process.env.NODE_ENV === "production" ? "Server error." : err.message,
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
