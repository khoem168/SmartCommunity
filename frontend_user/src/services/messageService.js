import { apiFetch } from "./api";

const normalizeConversation = (conversation) => ({
  ...conversation,
  type: conversation.type || "direct",
  displayName: conversation.name || "Conversation",
  category: conversation.category || "general",
  context: conversation.context || null,
  unreadCount: Number(conversation.unreadCount || 0),
  memberCount: Number(conversation.memberCount || 0),
  otherUser:
    (conversation.type || "direct") === "direct"
      ? {
          id: conversation.userId,
          name: conversation.name,
          role: conversation.role,
          avatarUrl: conversation.avatarUrl,
        }
      : null,
});

export const listConversations = async () => {
  const response = await apiFetch("/messages/conversations");
  return (response.conversations || []).map(normalizeConversation);
};

export const createConversation = async (userIdOrPayload, options = {}) => {
  const payload =
    typeof userIdOrPayload === "object"
      ? userIdOrPayload
      : { userId: userIdOrPayload, ...options };
  const response = await apiFetch("/messages/conversations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response;
};

export const createGroupConversation = (payload) =>
  apiFetch("/messages/conversations/groups", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const listConversationMembers = async (conversationId) => {
  const response = await apiFetch(
    `/messages/conversations/${conversationId}/members`,
  );
  return response.members || [];
};

export const addConversationMembers = (conversationId, memberIds) =>
  apiFetch(`/messages/conversations/${conversationId}/members`, {
    method: "POST",
    body: JSON.stringify({ memberIds }),
  });

export const removeConversationMember = (conversationId, userId) =>
  apiFetch(`/messages/conversations/${conversationId}/members/${userId}`, {
    method: "DELETE",
  });

export const listMessages = async (conversationId) => {
  const response = await apiFetch(`/messages/conversations/${conversationId}`);
  const messages = response.messages || [];
  if (response.conversation) {
    messages.conversation = normalizeConversation(response.conversation);
  }
  return messages;
};

export const getConversationDetail = async (conversationId) => {
  const response = await apiFetch(`/messages/conversations/${conversationId}`);
  return {
    messages: response.messages || [],
    conversation: response.conversation
      ? normalizeConversation(response.conversation)
      : null,
  };
};

export const sendMessage = async (conversationId, payload) => {
  const body = new FormData();
  const message = typeof payload === "string" ? payload : payload?.message;
  const file = typeof payload === "object" ? payload?.file : null;
  if (message) body.append("message", message);
  if (file) body.append("file", file);
  const response = await apiFetch(
    `/messages/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body,
    },
  );
  return response.message;
};
