const db = require("../config/db");
const {
  getPreferences,
  preferenceColumns,
} = require("../services/notificationDeliveryService");
const { firebaseConfigured } = require("../services/firebaseNotificationService");

const allowedTypes = new Set(Object.keys(preferenceColumns));

const getNotifications = async (req, res, next) => {
  try {
    const type = String(req.query.type || "");
    const unreadOnly = String(req.query.unreadOnly || "") === "true";
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const conditions = ["user_id = ?"];
    const params = [req.user.id];
    if (type && allowedTypes.has(type)) {
      conditions.push("type = ?");
      params.push(type);
    }
    if (unreadOnly) conditions.push("is_read = 0");

    const [totalResult, rowsResult, typeStatsResult] = await Promise.all([
      db.query(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) AS unread
         FROM notifications WHERE ${conditions.join(" AND ")}`,
        params,
      ),
      db.query(
        `SELECT id, type, title, message, link, metadata,
                push_status AS pushStatus, is_read AS isRead,
                read_at AS readAt, created_at AS createdAt
         FROM notifications
         WHERE ${conditions.join(" AND ")}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, (page - 1) * limit],
      ),
      db.query(
        `SELECT type, COUNT(*) AS total,
                SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) AS unread
         FROM notifications
         WHERE user_id = ?
         GROUP BY type`,
        [req.user.id],
      ),
    ]);
    const total = totalResult[0][0];
    const rows = rowsResult[0];
    const typeStats = typeStatsResult[0];
    return res.json({
      notifications: rows.map((row) => {
        let metadata = null;
        try {
          metadata = row.metadata ? JSON.parse(row.metadata) : null;
        } catch {
          metadata = null;
        }
        return { ...row, metadata, isRead: Boolean(row.isRead) };
      }),
      pagination: {
        page,
        limit,
        total: Number(total.total || 0),
        pages: Math.ceil(Number(total.total || 0) / limit),
      },
      stats: {
        total: Number(total.total || 0),
        unread: Number(total.unread || 0),
        byType: Object.fromEntries(
          typeStats.map((row) => [
            row.type,
            { total: Number(row.total), unread: Number(row.unread || 0) },
          ]),
        ),
      },
    });
  } catch (err) {
    return next(err);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const [result] = await db.query(
      `UPDATE notifications SET is_read = 1, read_at = COALESCE(read_at, NOW())
       WHERE id = ? AND user_id = ?`,
      [req.params.notificationId, req.user.id],
    );
    if (!result.affectedRows) {
      return res.status(404).json({ error: "Notification not found." });
    }
    return res.json({ message: "Notification marked as read." });
  } catch (err) {
    return next(err);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    const params = [req.user.id];
    let typeClause = "";
    if (allowedTypes.has(String(req.body?.type || ""))) {
      typeClause = " AND type = ?";
      params.push(req.body.type);
    }
    await db.query(
      `UPDATE notifications SET is_read = 1, read_at = COALESCE(read_at, NOW())
       WHERE user_id = ? AND is_read = 0${typeClause}`,
      params,
    );
    return res.json({ message: "Notifications marked as read." });
  } catch (err) {
    return next(err);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const [result] = await db.query(
      "DELETE FROM notifications WHERE id = ? AND user_id = ?",
      [req.params.notificationId, req.user.id],
    );
    if (!result.affectedRows) {
      return res.status(404).json({ error: "Notification not found." });
    }
    return res.json({ message: "Notification deleted." });
  } catch (err) {
    return next(err);
  }
};

const deleteReadNotifications = async (req, res, next) => {
  try {
    const [result] = await db.query(
      "DELETE FROM notifications WHERE user_id = ? AND is_read = 1",
      [req.user.id],
    );
    return res.json({
      message: "Read notifications cleared.",
      deleted: result.affectedRows,
    });
  } catch (err) {
    return next(err);
  }
};

const getNotificationPreferences = async (req, res, next) => {
  try {
    const preferences = await getPreferences(req.user.id);
    return res.json({
      preferences: {
        mentorship: Boolean(preferences.mentorship_enabled),
        session: Boolean(preferences.session_enabled),
        internship: Boolean(preferences.internship_enabled),
        message: Boolean(preferences.message_enabled),
        skillExchange: Boolean(preferences.skill_exchange_enabled),
        forum: Boolean(preferences.forum_enabled),
        system: Boolean(preferences.system_enabled),
        pushEnabled: Boolean(preferences.push_enabled),
      },
      firebaseConfigured: firebaseConfigured(),
    });
  } catch (err) {
    return next(err);
  }
};

const updateNotificationPreferences = async (req, res, next) => {
  try {
    const bodyKeys = {
      mentorship: "mentorship_enabled",
      session: "session_enabled",
      internship: "internship_enabled",
      message: "message_enabled",
      skillExchange: "skill_exchange_enabled",
      forum: "forum_enabled",
      system: "system_enabled",
      pushEnabled: "push_enabled",
    };
    const entries = Object.entries(bodyKeys).filter(([key]) =>
      Object.hasOwn(req.body || {}, key),
    );
    if (!entries.length) {
      return res.status(400).json({ error: "No notification preferences provided." });
    }
    await getPreferences(req.user.id);
    await db.query(
      `UPDATE notification_preferences SET
       ${entries.map(([, column]) => `${column} = ?`).join(", ")}
       WHERE user_id = ?`,
      [...entries.map(([key]) => (req.body[key] ? 1 : 0)), req.user.id],
    );
    return getNotificationPreferences(req, res, next);
  } catch (err) {
    return next(err);
  }
};

const registerPushToken = async (req, res, next) => {
  try {
    const token = String(req.body?.token || "").trim();
    if (token.length < 20 || token.length > 512) {
      return res.status(400).json({ error: "A valid Firebase push token is required." });
    }
    await db.query(
      `INSERT INTO notification_push_tokens
         (user_id, token, provider, platform, is_active, last_used_at)
       VALUES (?, ?, 'firebase', 'web', 1, NOW())
       ON DUPLICATE KEY UPDATE
         user_id = VALUES(user_id), is_active = 1, last_used_at = NOW()`,
      [req.user.id, token],
    );
    await getPreferences(req.user.id);
    await db.query(
      "UPDATE notification_preferences SET push_enabled = 1 WHERE user_id = ?",
      [req.user.id],
    );
    return res.status(201).json({ message: "Browser push notifications enabled." });
  } catch (err) {
    return next(err);
  }
};

const unregisterPushToken = async (req, res, next) => {
  try {
    const token = String(req.body?.token || "").trim();
    if (token) {
      await db.query(
        `UPDATE notification_push_tokens SET is_active = 0
         WHERE user_id = ? AND token = ?`,
        [req.user.id, token],
      );
    } else {
      await db.query(
        "UPDATE notification_push_tokens SET is_active = 0 WHERE user_id = ?",
        [req.user.id],
      );
    }
    await getPreferences(req.user.id);
    await db.query(
      "UPDATE notification_preferences SET push_enabled = 0 WHERE user_id = ?",
      [req.user.id],
    );
    return res.json({ message: "Browser push notifications disabled." });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  deleteNotification,
  deleteReadNotifications,
  getNotificationPreferences,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  registerPushToken,
  unregisterPushToken,
  updateNotificationPreferences,
};
