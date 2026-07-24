const express = require("express");
const {
  addConversationMembers,
  createConversation,
  createGroupConversation,
  listConversationMembers,
  listConversations,
  listMessages,
  removeConversationMember,
  sendMessage,
} = require("../controllers/messageController");
const { requireAuth } = require("../middleware/auth");
const messageUpload = require("../middleware/messageUpload");

const router = express.Router();

router.use(requireAuth);
router.get("/conversations", listConversations);
router.post("/conversations", createConversation);
router.post("/conversations/groups", createGroupConversation);
router.get("/conversations/:conversationId/members", listConversationMembers);
router.post("/conversations/:conversationId/members", addConversationMembers);
router.delete(
  "/conversations/:conversationId/members/:userId",
  removeConversationMember,
);
router.get("/conversations/:conversationId", listMessages);
router.post(
  "/conversations/:conversationId/messages",
  messageUpload.single("file"),
  sendMessage,
);

module.exports = router;
