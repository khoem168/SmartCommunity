import { loadRegisteredUsers } from "./userStorage";
import { addNotification } from "./notificationStorage";
import { getDiscoverMember } from "../pages/discover/discoverData";

const STORAGE_KEY = "smartCommunityConversations";

const loadConversations = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveConversations = (conversations) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
};

const getKnownMember = (userId) => {
  const normalizedId = String(userId || "");
  const registered = loadRegisteredUsers().find(
    (user) => user.id === normalizedId,
  );
  if (registered) {
    return {
      id: registered.id,
      name: registered.fullName || registered.email || "Community member",
      role: registered.role || "Member",
    };
  }

  return getDiscoverMember(normalizedId);
};

const buildConversationId = (participantIds) =>
  [...new Set(participantIds.filter(Boolean))].sort().join("::");

export const getUserConversations = (userId) => {
  const conversations = loadConversations();
  return conversations
    .filter((conversation) => conversation.participantIds.includes(userId))
    .map((conversation) => {
      const otherId = conversation.participantIds.find((id) => id !== userId);
      const otherUser = getKnownMember(otherId) || {
        id: otherId,
        name: "Community member",
      };
      const lastMessage = conversation.messages.length
        ? conversation.messages[conversation.messages.length - 1].text
        : "No messages yet.";

      return {
        ...conversation,
        otherUser,
        lastMessage,
      };
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
};

export const getConversation = (conversationId) => {
  const conversations = loadConversations();
  return (
    conversations.find((conversation) => conversation.id === conversationId) ||
    null
  );
};

export const createOrGetConversation = (currentUser, otherUser) => {
  if (
    !currentUser ||
    !otherUser ||
    !currentUser.id ||
    !otherUser.id ||
    currentUser.id === otherUser.id
  ) {
    return null;
  }

  const conversationId = buildConversationId([currentUser.id, otherUser.id]);
  const conversations = loadConversations();
  const existingConversation = conversations.find(
    (conversation) => conversation.id === conversationId,
  );

  if (existingConversation) {
    return existingConversation;
  }

  const nextConversation = {
    id: conversationId,
    participantIds: [currentUser.id, otherUser.id].sort(),
    participants: [
      {
        id: currentUser.id,
        name: currentUser.fullName || currentUser.email || "You",
      },
      {
        id: otherUser.id,
        name:
          otherUser.name || otherUser.fullName || otherUser.email || "Member",
      },
    ],
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  conversations.unshift(nextConversation);
  saveConversations(conversations);
  return nextConversation;
};

export const addConversationMessage = (conversationId, senderId, text) => {
  if (!text || !text.trim()) return null;

  const conversations = loadConversations();
  const conversation = conversations.find((item) => item.id === conversationId);
  if (!conversation) return null;

  const nextMessage = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    senderId,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };

  conversation.messages = [...conversation.messages, nextMessage];
  conversation.updatedAt = new Date().toISOString();
  saveConversations(conversations);

  const receiverId = conversation.participantIds.find((id) => id !== senderId);
  const senderName = getKnownMember(senderId)?.name || "Someone";
  addNotification(
    receiverId,
    "New message",
    `${senderName} sent you a message.`,
    "/messages",
  );

  return nextMessage;
};
