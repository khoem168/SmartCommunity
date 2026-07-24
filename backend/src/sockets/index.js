let SocketServer = null;
const db = require("../config/db");
const { verifyToken } = require("../utils/auth");

try {
  SocketServer = require("socket.io").Server;
} catch {
  SocketServer = null;
}

const parseOrigins = () => {
  const value = process.env.CLIENT_URL || "http://localhost:5173";
  return value.split(",").map((origin) => origin.trim());
};

const setupSockets = (server) => {
  if (!SocketServer) {
    console.warn("Socket.io is not installed. Run `npm install` in backend to enable chat.");
    return null;
  }

  const io = new SocketServer(server, {
    cors: {
      origin: parseOrigins(),
      methods: ["GET", "POST", "PATCH"],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        String(socket.handshake.headers.authorization || "").replace(/^Bearer\s+/i, "");
      const payload = verifyToken(token);
      if (!payload?.sub) return next(new Error("Authentication required."));
      const [users] = await db.query(
        "SELECT id, full_name FROM users WHERE id = ? AND is_active = 1",
        [payload.sub],
      );
      if (!users.length) return next(new Error("Account not found."));
      socket.user = { id: users[0].id, fullName: users[0].full_name };
      return next();
    } catch {
      return next(new Error("Authentication required."));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user.id}`);

    socket.on("join:user", () => {
      socket.join(`user:${socket.user.id}`);
    });

    socket.on("join:conversation", async (conversationId) => {
      if (!conversationId) return;
      const [memberships] = await db.query(
        `SELECT 1 FROM conversation_members
         WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, socket.user.id],
      );
      if (memberships.length) socket.join(`conversation:${conversationId}`);
    });

    socket.on("typing", ({ conversationId, isTyping = true }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit("typing", {
        conversationId,
        user: socket.user,
        isTyping: Boolean(isTyping),
      });
    });

    socket.on("leave:conversation", (conversationId) => {
      if (conversationId) socket.leave(`conversation:${conversationId}`);
    });
  });

  return io;
};

module.exports = setupSockets;
