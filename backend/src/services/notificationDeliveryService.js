const db = require("../config/db");
const {
  firebaseConfigured,
  sendFirebasePushToUser,
} = require("./firebaseNotificationService");

const preferenceColumns = {
  mentorship: "mentorship_enabled",
  session: "session_enabled",
  internship: "internship_enabled",
  message: "message_enabled",
  skill_exchange: "skill_exchange_enabled",
  forum: "forum_enabled",
  system: "system_enabled",
};

const getPreferences = async (userId) => {
  await db.query(
    "INSERT IGNORE INTO notification_preferences (user_id) VALUES (?)",
    [userId],
  );
  const [[preferences]] = await db.query(
    "SELECT * FROM notification_preferences WHERE user_id = ?",
    [userId],
  );
  return preferences;
};

const createNotification = async (
  req,
  { userId, type = "system", title, message = "", link = "/notifications", metadata },
) => {
  const preferenceColumn = preferenceColumns[type] || "system_enabled";
  const preferences = await getPreferences(userId);
  if (!preferences[preferenceColumn]) return { skipped: true };

  const shouldPush = Boolean(preferences.push_enabled && firebaseConfigured());
  const [result] = await db.query(
    `INSERT INTO notifications
       (user_id, type, title, message, link, metadata, push_status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      type,
      String(title).slice(0, 200),
      String(message || "").slice(0, 2000) || null,
      link || null,
      metadata ? JSON.stringify(metadata) : null,
      shouldPush ? "pending" : "not_configured",
    ],
  );
  const notification = {
    id: result.insertId,
    type,
    title,
    message,
    link,
    metadata: metadata || null,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  const io = req?.app?.get("io");
  if (io) io.to(`user:${userId}`).emit("notification:new", notification);

  if (shouldPush) {
    try {
      const delivery = await sendFirebasePushToUser(userId, notification);
      await db.query("UPDATE notifications SET push_status = ? WHERE id = ?", [
        delivery.sent > 0 ? "sent" : delivery.failed > 0 ? "failed" : "not_configured",
        result.insertId,
      ]);
    } catch {
      await db.query(
        "UPDATE notifications SET push_status = 'failed' WHERE id = ?",
        [result.insertId],
      );
    }
  }
  return notification;
};

const createNotifications = async (req, userIds, notification) => {
  const uniqueUserIds = [...new Set(userIds.map(Number).filter(Boolean))];
  return Promise.all(
    uniqueUserIds.map((userId) =>
      createNotification(req, { ...notification, userId }),
    ),
  );
};

module.exports = {
  createNotification,
  createNotifications,
  getPreferences,
  preferenceColumns,
};
