const path = require("path");
const db = require("../config/db");
const { uploadMessageFile } = require("../services/messageUploadService");
const { createNotifications } = require("../services/notificationDeliveryService");

const getConversation = async (conversationId, userId) => {
  const [rows] = await db.query(
    `SELECT c.*, cm.role AS member_role, cm.last_read_at
     FROM conversations c
     JOIN conversation_members cm
       ON cm.conversation_id = c.id AND cm.user_id = ?
     WHERE c.id = ?`,
    [userId, conversationId],
  );
  return rows[0];
};

const getGroupManager = async (conversationId, userId) => {
  const conversation = await getConversation(conversationId, userId);
  if (
    !conversation ||
    conversation.type !== "group" ||
    !["owner", "admin"].includes(conversation.member_role)
  ) {
    return null;
  }
  return conversation;
};

const listConversations = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id,
              c.type,
              c.name,
              c.description,
              c.created_by AS createdBy,
              c.last_message AS lastMessage,
              COALESCE(c.last_message_time, c.updated_at) AS updatedAt,
              mine.role AS memberRole,
              (SELECT COUNT(*)
               FROM conversation_members member_count
               WHERE member_count.conversation_id = c.id) AS memberCount,
              (SELECT COUNT(*)
               FROM messages unread
               WHERE unread.conversation_id = c.id
                 AND unread.is_deleted = 0
                 AND unread.sender_id <> ?
                 AND (mine.last_read_at IS NULL OR unread.created_at > mine.last_read_at)
              ) AS unreadCount,
              other_user.id AS userId,
              other_user.full_name AS nameForDirect,
              other_user.role AS role,
              other_user.avatar_url AS avatarUrl
       FROM conversation_members mine
       JOIN conversations c ON c.id = mine.conversation_id
       LEFT JOIN users other_user ON other_user.id =
         CASE
           WHEN c.type = 'direct' AND c.participant1_id = ? THEN c.participant2_id
           WHEN c.type = 'direct' THEN c.participant1_id
           ELSE NULL
         END
       WHERE mine.user_id = ?
       ORDER BY COALESCE(c.last_message_time, c.updated_at) DESC`,
      [req.user.id, req.user.id, req.user.id],
    );

    return res.json({
      conversations: rows.map((row) => ({
        ...row,
        name: row.type === "direct" ? row.nameForDirect : row.name,
        unreadCount: Number(row.unreadCount || 0),
        memberCount: Number(row.memberCount || 0),
      })),
    });
  } catch (err) {
    return next(err);
  }
};

const createConversation = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const otherUserId = Number(req.body.userId);
    if (!otherUserId || otherUserId === req.user.id) {
      return res.status(400).json({ error: "Choose another user to message." });
    }

    const [users] = await connection.query(
      "SELECT id FROM users WHERE id = ? AND is_active = 1",
      [otherUserId],
    );
    if (!users.length) {
      return res.status(404).json({ error: "That community member was not found." });
    }

    const participant1 = Math.min(req.user.id, otherUserId);
    const participant2 = Math.max(req.user.id, otherUserId);
    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO conversations (type, participant1_id, participant2_id)
       VALUES ('direct', ?, ?)
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), updated_at = CURRENT_TIMESTAMP`,
      [participant1, participant2],
    );
    await connection.query(
      `INSERT IGNORE INTO conversation_members (conversation_id, user_id, role)
       VALUES (?, ?, 'member'), (?, ?, 'member')`,
      [result.insertId, participant1, result.insertId, participant2],
    );
    await connection.commit();
    return res.status(201).json({ conversationId: result.insertId, type: "direct" });
  } catch (err) {
    await connection.rollback();
    return next(err);
  } finally {
    connection.release();
  }
};

const createGroupConversation = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const name = String(req.body.name || "").trim();
    const description = String(req.body.description || "").trim();
    const memberIds = [
      ...new Set(
        (Array.isArray(req.body.memberIds) ? req.body.memberIds : [])
          .map(Number)
          .filter((id) => Number.isInteger(id) && id > 0 && id !== req.user.id),
      ),
    ].slice(0, 49);

    if (name.length < 2 || name.length > 160) {
      return res.status(400).json({ error: "Group name must be 2 to 160 characters." });
    }
    if (description.length > 500) {
      return res.status(400).json({ error: "Group description is too long." });
    }
    if (!memberIds.length) {
      return res.status(400).json({ error: "Select at least one member for the group." });
    }

    const placeholders = memberIds.map(() => "?").join(",");
    const [validMembers] = await connection.query(
      `SELECT id FROM users WHERE id IN (${placeholders}) AND is_active = 1`,
      memberIds,
    );
    if (validMembers.length !== memberIds.length) {
      return res.status(400).json({ error: "One or more selected members are unavailable." });
    }

    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO conversations
         (type, participant1_id, participant2_id, name, description, created_by)
       VALUES ('group', NULL, NULL, ?, ?, ?)`,
      [name, description || null, req.user.id],
    );
    await connection.query(
      `INSERT INTO conversation_members (conversation_id, user_id, role)
       VALUES (?, ?, 'owner')`,
      [result.insertId, req.user.id],
    );
    await connection.query(
      `INSERT INTO conversation_members (conversation_id, user_id, role)
       VALUES ${validMembers.map(() => "(?, ?, 'member')").join(",")}`,
      validMembers.flatMap((member) => [result.insertId, member.id]),
    );
    await connection.commit();
    return res.status(201).json({
      conversationId: result.insertId,
      type: "group",
      memberCount: validMembers.length + 1,
    });
  } catch (err) {
    await connection.rollback();
    return next(err);
  } finally {
    connection.release();
  }
};

const listConversationMembers = async (req, res, next) => {
  try {
    const conversation = await getConversation(req.params.conversationId, req.user.id);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }
    const [members] = await db.query(
      `SELECT u.id, u.full_name AS name, u.role AS accountRole,
              u.avatar_url AS avatarUrl, cm.role, cm.joined_at AS joinedAt
       FROM conversation_members cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.conversation_id = ?
       ORDER BY FIELD(cm.role, 'owner', 'admin', 'member'), u.full_name`,
      [conversation.id],
    );
    return res.json({ members });
  } catch (err) {
    return next(err);
  }
};

const addConversationMembers = async (req, res, next) => {
  try {
    const conversation = await getGroupManager(req.params.conversationId, req.user.id);
    if (!conversation) {
      return res.status(403).json({ error: "Only group owners and admins can add members." });
    }
    const memberIds = [
      ...new Set(
        (Array.isArray(req.body.memberIds) ? req.body.memberIds : [])
          .map(Number)
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    ].slice(0, 50);
    if (!memberIds.length) {
      return res.status(400).json({ error: "Select at least one member." });
    }
    const placeholders = memberIds.map(() => "?").join(",");
    const [users] = await db.query(
      `SELECT id FROM users WHERE id IN (${placeholders}) AND is_active = 1`,
      memberIds,
    );
    if (!users.length) {
      return res.status(400).json({ error: "No available members were selected." });
    }
    await db.query(
      `INSERT IGNORE INTO conversation_members (conversation_id, user_id, role)
       VALUES ${users.map(() => "(?, ?, 'member')").join(",")}`,
      users.flatMap((user) => [conversation.id, user.id]),
    );
    return res.json({ message: "Group members added." });
  } catch (err) {
    return next(err);
  }
};

const removeConversationMember = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const conversation = await getConversation(req.params.conversationId, req.user.id);
    const targetUserId = Number(req.params.userId);
    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ error: "Group conversation not found." });
    }
    const removingSelf = targetUserId === req.user.id;
    if (!removingSelf && !["owner", "admin"].includes(conversation.member_role)) {
      return res.status(403).json({ error: "You cannot remove this group member." });
    }

    const [[target]] = await connection.query(
      `SELECT role FROM conversation_members
       WHERE conversation_id = ? AND user_id = ?`,
      [conversation.id, targetUserId],
    );
    if (!target) return res.status(404).json({ error: "Group member not found." });
    if (target.role === "owner" && !removingSelf) {
      return res.status(403).json({ error: "The group owner cannot be removed." });
    }

    await connection.beginTransaction();
    if (removingSelf && target.role === "owner") {
      const [[nextOwner]] = await connection.query(
        `SELECT user_id FROM conversation_members
         WHERE conversation_id = ? AND user_id <> ?
         ORDER BY FIELD(role, 'admin', 'member'), joined_at
         LIMIT 1`,
        [conversation.id, targetUserId],
      );
      if (nextOwner) {
        await connection.query(
          `UPDATE conversation_members SET role = 'owner'
           WHERE conversation_id = ? AND user_id = ?`,
          [conversation.id, nextOwner.user_id],
        );
        await connection.query(
          "UPDATE conversations SET created_by = ? WHERE id = ?",
          [nextOwner.user_id, conversation.id],
        );
      }
    }
    await connection.query(
      "DELETE FROM conversation_members WHERE conversation_id = ? AND user_id = ?",
      [conversation.id, targetUserId],
    );
    const [[remaining]] = await connection.query(
      "SELECT COUNT(*) AS count FROM conversation_members WHERE conversation_id = ?",
      [conversation.id],
    );
    if (!Number(remaining.count)) {
      await connection.query("DELETE FROM conversations WHERE id = ?", [conversation.id]);
    }
    await connection.commit();
    return res.json({ message: removingSelf ? "You left the group." : "Member removed." });
  } catch (err) {
    await connection.rollback();
    return next(err);
  } finally {
    connection.release();
  }
};

const listMessages = async (req, res, next) => {
  try {
    const conversation = await getConversation(req.params.conversationId, req.user.id);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    await Promise.all([
      db.query(
        `UPDATE conversation_members SET last_read_at = CURRENT_TIMESTAMP
         WHERE conversation_id = ? AND user_id = ?`,
        [conversation.id, req.user.id],
      ),
      db.query(
        `UPDATE messages SET is_read = 1, read_at = CURRENT_TIMESTAMP
         WHERE conversation_id = ? AND receiver_id = ? AND is_read = 0`,
        [conversation.id, req.user.id],
      ),
    ]);

    const [rows] = await db.query(
      `SELECT m.id,
              m.sender_id AS senderId,
              m.receiver_id AS receiverId,
              m.message AS text,
              m.message_type AS messageType,
              m.attachment_url AS attachmentUrl,
              m.attachment_name AS attachmentName,
              m.attachment_mime AS attachmentMime,
              m.attachment_size AS attachmentSize,
              m.is_read AS isRead,
              m.created_at AS createdAt,
              u.full_name AS senderName,
              u.avatar_url AS senderAvatarUrl
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = ? AND m.is_deleted = 0
       ORDER BY m.created_at ASC
       LIMIT 300`,
      [conversation.id],
    );

    const io = req.app.get("io");
    if (io) {
      io.to(`conversation:${conversation.id}`).emit("message:read", {
        conversationId: conversation.id,
        userId: req.user.id,
      });
    }
    return res.json({ messages: rows });
  } catch (err) {
    return next(err);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const conversation = await getConversation(req.params.conversationId, req.user.id);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    const message = String(req.body.message || "").trim();
    if (!message && !req.file) {
      return res.status(400).json({ error: "Write a message or attach a file." });
    }
    if (message.length > 5000) {
      return res.status(400).json({ error: "Message must be 5,000 characters or fewer." });
    }

    let attachment = null;
    if (req.file) attachment = await uploadMessageFile(req.file, req.user.id);
    const attachmentName = req.file
      ? path.basename(req.file.originalname).slice(0, 255)
      : null;
    const messageType = req.file
      ? req.file.mimetype.startsWith("image/")
        ? "image"
        : "document"
      : "text";
    const receiverId =
      conversation.type === "direct"
        ? conversation.participant1_id === req.user.id
          ? conversation.participant2_id
          : conversation.participant1_id
        : null;

    const [result] = await db.query(
      `INSERT INTO messages
         (conversation_id, sender_id, receiver_id, message, message_type,
          attachment_url, attachment_name, attachment_mime, attachment_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        conversation.id,
        req.user.id,
        receiverId,
        message || null,
        messageType,
        attachment?.url || null,
        attachmentName,
        req.file?.mimetype || null,
        req.file?.size || null,
      ],
    );

    const summary = message || `Shared ${attachmentName}`;
    await db.query(
      `UPDATE conversations
       SET last_message = ?, last_message_time = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [summary.slice(0, 1000), conversation.id],
    );

    const [recipients] = await db.query(
      `SELECT user_id FROM conversation_members
       WHERE conversation_id = ? AND user_id <> ?`,
      [conversation.id, req.user.id],
    );
    if (recipients.length) {
      const notificationText = `${req.user.fullName}: ${summary}`.slice(0, 500);
      await createNotifications(
        req,
        recipients.map((recipient) => recipient.user_id),
        {
          type: "message",
          title: "New message",
          message: notificationText,
          link: `/messages/${conversation.id}`,
          metadata: { conversationId: conversation.id },
        },
      );
    }

    const payload = {
      id: result.insertId,
      conversationId: conversation.id,
      senderId: req.user.id,
      senderName: req.user.fullName,
      senderAvatarUrl: req.user.avatarUrl || "",
      receiverId,
      text: message,
      message,
      messageType,
      attachmentUrl: attachment?.url || null,
      attachmentName,
      attachmentMime: req.file?.mimetype || null,
      attachmentSize: req.file?.size || null,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const io = req.app.get("io");
    if (io) {
      io.to(`conversation:${conversation.id}`).emit("message:new", payload);
    }

    return res.status(201).json({ message: payload });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  addConversationMembers,
  createConversation,
  createGroupConversation,
  listConversationMembers,
  listConversations,
  listMessages,
  removeConversationMember,
  sendMessage,
};
