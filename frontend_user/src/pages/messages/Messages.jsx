import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  IoAddOutline,
  IoArrowBackOutline,
  IoAttachOutline,
  IoCloseOutline,
  IoDocumentTextOutline,
  IoMailOpenOutline,
  IoPeopleOutline,
  IoSearchOutline,
  IoSend,
  IoBriefcaseOutline,
  IoSchoolOutline,
  IoSwapHorizontalOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { fetchMembers } from "../../services/platformService";
import {
  createConversation,
  createGroupConversation,
  listConversationMembers,
  listConversations,
  listMessages,
  removeConversationMember,
  sendMessage,
} from "../../services/messageService";
import { getSocket } from "../../services/realtimeService";
import UserAvatar from "../../components/ui/UserAvatar";
import { resolveMediaUrl } from "../../utils/userPresentation";
import ConversationContextCapsule from "./ConversationContextCapsule";
import "./Messages.css";

const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const Messages = () => {
  const { user } = useGlobleContext();
  const { language } = useLanguage();
  const isKm = language === "km";
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("userId");
  const targetCategory = searchParams.get("category");
  const targetContextId = searchParams.get("contextId");

  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [activeId, setActiveId] = useState(conversationId || "");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [liveMessageIds, setLiveMessageIds] = useState(() => new Set());
  const [groupOpen, setGroupOpen] = useState(false);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    memberIds: [],
  });

  const refreshConversations = useCallback(async () => {
    const convos = await listConversations();
    setConversations(convos);
    return convos;
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadConversations = async () => {
      try {
        setError("");
        const convos = await refreshConversations();
        if (conversationId) {
          setActiveId(conversationId);
          return;
        }
        if (!targetUserId) {
          setActiveId((current) => current || convos[0]?.id || "");
        }
      } catch (err) {
        setError(err.message || "Unable to load conversations.");
      }
    };
    loadConversations();
  }, [user, conversationId, targetUserId, refreshConversations]);

  // Connect to target user if specified in search query (e.g., from ATS or Student Tracker)
  useEffect(() => {
    if (!user || !targetUserId) return;
    let isMounted = true;
    const connectTarget = async () => {
      try {
        const convos = await listConversations();
        if (!isMounted) return;
        setConversations(convos);
        const existing = convos.find(
          (c) =>
            c.type === "direct" &&
            (String(c.userId) === String(targetUserId) ||
              String(c.otherUser?.id) === String(targetUserId)),
        );
        if (existing) {
          setActiveId(existing.id);
          navigate(`/messages/${existing.id}`, { replace: true });
        } else {
          const created = await createConversation({
            userId: Number(targetUserId),
            category: targetCategory || "general",
            contextId: targetContextId ? Number(targetContextId) : null,
          });
          if (created?.conversationId && isMounted) {
            await refreshConversations();
            setActiveId(created.conversationId);
            navigate(`/messages/${created.conversationId}`, { replace: true });
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message || "Unable to start conversation.");
      }
    };
    connectTarget();
    return () => {
      isMounted = false;
    };
  }, [targetUserId, targetCategory, targetContextId, user, navigate, refreshConversations]);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => String(conversation.id) === String(activeId),
      ),
    [activeId, conversations],
  );

  const categoryCounts = useMemo(() => {
    const counts = { all: conversations.length, job_application: 0, mentorship: 0, skill_exchange: 0, group: 0 };
    conversations.forEach((c) => {
      const cat = c.category || (c.type === "group" ? "group" : "direct");
      if (counts[cat] !== undefined) counts[cat]++;
    });
    return counts;
  }, [conversations]);

  const categoryUnread = useMemo(() => {
    const unread = { all: 0, job_application: 0, mentorship: 0, skill_exchange: 0, group: 0 };
    conversations.forEach((c) => {
      const cat = c.category || (c.type === "group" ? "group" : "direct");
      const count = Number(c.unreadCount || 0);
      unread.all += count;
      if (unread[cat] !== undefined) unread[cat] += count;
    });
    return unread;
  }, [conversations]);

  const visibleConversations = useMemo(
    () =>
      conversations.filter((conversation) => {
        const cat = conversation.category || (conversation.type === "group" ? "group" : "direct");
        const matchesType = filter === "all" || cat === filter;
        const matchesQuery = (conversation.displayName || "")
          .toLowerCase()
          .includes(query.trim().toLowerCase());
        return matchesType && matchesQuery;
      }),
    [conversations, filter, query],
  );

  const renderCategoryPill = (conv) => {
    const cat = conv.category || (conv.type === "group" ? "group" : "direct");
    if (cat === "job_application") {
      return (
        <span className="convo-cat-tag job">
          <IoBriefcaseOutline /> {isKm ? "ការងារ" : "Job"}
        </span>
      );
    }
    if (cat === "mentorship") {
      return (
        <span className="convo-cat-tag mentor">
          <IoSchoolOutline /> {isKm ? "គ្រូបង្វឹក" : "Mentor"}
        </span>
      );
    }
    if (cat === "skill_exchange") {
      return (
        <span className="convo-cat-tag swap">
          <IoSwapHorizontalOutline /> {isKm ? "ប្តូរជំនាញ" : "Swap"}
        </span>
      );
    }
    if (cat === "group") {
      return (
        <span className="convo-cat-tag group">
          <IoPeopleOutline /> {isKm ? "ក្រុម" : "Group"}
        </span>
      );
    }
    return null;
  };

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeId || !user) {
        setMessages([]);
        setGroupMembers([]);
        return;
      }
      try {
        setError("");
        const loaded = await listMessages(activeId);
        setMessages(loaded);
        if (activeConversation?.type === "group") {
          setGroupMembers(await listConversationMembers(activeId));
        } else {
          setGroupMembers([]);
        }
        setConversations((current) =>
          current.map((conversation) =>
            String(conversation.id) === String(activeId)
              ? { ...conversation, unreadCount: 0 }
              : conversation,
          ),
        );
        window.dispatchEvent(new CustomEvent("nav-badges:update"));
      } catch (err) {
        setError(err.message || "Unable to load messages.");
      }
    };
    loadMessages();
  }, [activeId, activeConversation?.type, user]);

  useEffect(() => {
    if (!activeId || !user) return;
    const socket = getSocket();
    const roomId = activeId;
    const handleNewMessage = (payload) => {
      if (String(payload.conversationId) === String(roomId)) {
        if (Number(payload.senderId) !== Number(user.id)) {
          setLiveMessageIds((current) => new Set(current).add(payload.id));
        }
        setMessages((current) =>
          current.some((message) => message.id === payload.id)
            ? current
            : [...current, payload],
        );
      }
      refreshConversations().catch(() => {});
      window.dispatchEvent(new CustomEvent("nav-badges:update"));
    };
    const handleTyping = (payload) => {
      if (
        String(payload.conversationId) === String(roomId) &&
        Number(payload.user?.id) !== Number(user.id)
      ) {
        setTypingUser(
          payload.isTyping ? payload.user?.fullName || "Someone" : "",
        );
      }
    };

    socket.emit("join:conversation", roomId);
    socket.on("message:new", handleNewMessage);
    socket.on("typing", handleTyping);
    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.emit("leave:conversation", roomId);
    };
  }, [activeId, user, refreshConversations]);

  useEffect(() => {
    if (!activeId || !user) return;
    const socket = getSocket();
    socket.emit("typing", {
      conversationId: activeId,
      isTyping: Boolean(draft),
    });
    const timer = window.setTimeout(
      () =>
        socket.emit("typing", { conversationId: activeId, isTyping: false }),
      1200,
    );
    return () => window.clearTimeout(timer);
  }, [draft, activeId, user]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (
      !user ||
      !activeConversation ||
      (!draft.trim() && !attachment) ||
      sending
    ) {
      return;
    }
    try {
      setSending(true);
      setError("");
      await sendMessage(activeConversation.id, {
        message: draft.trim(),
        file: attachment,
      });
      setDraft("");
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessages(await listMessages(activeConversation.id));
      await refreshConversations();
      window.dispatchEvent(new CustomEvent("nav-badges:update"));
    } catch (err) {
      setError(err.message || "Unable to send your message.");
    } finally {
      setSending(false);
    }
  };

  const openConversation = (id) => {
    setActiveId(id);
    navigate(`/messages/${id}`);
  };

  const openGroupCreator = async () => {
    try {
      const members = await fetchMembers();
      setAvailableMembers(
        members.filter((member) => Number(member.id) !== Number(user.id)),
      );
      setGroupOpen(true);
    } catch (err) {
      setError(err.message || "Unable to load community members.");
    }
  };

  const toggleGroupMember = (memberId) => {
    setGroupForm((current) => ({
      ...current,
      memberIds: current.memberIds.includes(memberId)
        ? current.memberIds.filter((id) => id !== memberId)
        : [...current.memberIds, memberId],
    }));
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    try {
      setError("");
      const result = await createGroupConversation(groupForm);
      setGroupForm({ name: "", description: "", memberIds: [] });
      setGroupOpen(false);
      await refreshConversations();
      openConversation(result.conversationId);
    } catch (err) {
      setError(err.message || "Unable to create the group.");
    }
  };

  const leaveActiveGroup = async () => {
    if (!activeConversation || !user) return;
    try {
      await removeConversationMember(activeConversation.id, user.id);
      const convos = await refreshConversations();
      const nextId = convos[0]?.id || "";
      setActiveId(nextId);
      navigate(nextId ? `/messages/${nextId}` : "/messages");
    } catch (err) {
      setError(err.message || "Unable to leave the group.");
    }
  };

  return (
    <main className="messages-page">
      <div className="messages-shell container">
        <aside className="message-sidebar">
          <div className="message-sidebar-header">
            <div>
              <h2>Conversations</h2>
              <p>Private and community group messages.</p>
            </div>
            {user && (
              <button
                type="button"
                className="icon-action"
                onClick={openGroupCreator}
                aria-label="Create group"
                title="Create group"
              >
                <IoAddOutline />
              </button>
            )}
          </div>

          {user && (
            <div className="conversation-tools">
              <label className="conversation-search">
                <IoSearchOutline aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search conversations"
                />
              </label>
              <div className="conversation-filters">
                {[
                  { id: "all", label: isKm ? "ទាំងអស់" : "All" },
                  { id: "job_application", label: isKm ? "💼 ការងារ" : "💼 Jobs" },
                  { id: "mentorship", label: isKm ? "🎓 គ្រូបង្វឹក" : "🎓 Mentorship" },
                  { id: "skill_exchange", label: isKm ? "🤝 ប្តូរជំនាញ" : "🤝 Skill Swap" },
                  { id: "group", label: isKm ? "👥 ក្រុម" : "👥 Groups" },
                ].map((tab) => {
                  const unread = categoryUnread[tab.id] || 0;
                  const count = categoryCounts[tab.id] || 0;
                  return (
                    <button
                      type="button"
                      className={`filter-pill-btn ${filter === tab.id ? "active" : ""}`}
                      onClick={() => setFilter(tab.id)}
                      key={tab.id}
                    >
                      <span>{tab.label}</span>
                      {unread > 0 ? (
                        <span className="filter-unread-dot">{unread}</span>
                      ) : count > 0 ? (
                        <span className="filter-count-badge">{count}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="message-sidebar-body">
            {user ? (
              visibleConversations.length ? (
                <ul className="conversation-list">
                  {visibleConversations.map((conversation) => (
                    <li key={conversation.id}>
                      <button
                        type="button"
                        className={`conversation-card ${
                          String(conversation.id) === String(activeId)
                            ? "active"
                            : ""
                        }`}
                        onClick={() => openConversation(conversation.id)}
                      >
                        <UserAvatar
                          user={{
                            name: conversation.displayName,
                            avatarUrl: conversation.avatarUrl,
                          }}
                          className={`conversation-avatar ${conversation.type}`}
                          icon={
                            conversation.type === "group" ? (
                              <IoPeopleOutline />
                            ) : null
                          }
                        />
                        <span className="conversation-info">
                          <span className="conversation-title-line">
                            <strong>{conversation.displayName}</strong>
                            {renderCategoryPill(conversation)}
                            {conversation.unreadCount > 0 && (
                              <span className="unread-badge">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </span>
                          <span className="conversation-preview">
                            {conversation.lastMessage || "No messages yet"}
                          </span>
                          <span className="conversation-time">
                            {conversation.type === "group"
                              ? `${conversation.memberCount} members`
                              : conversation.role || "Member"}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-conversation-pane">
                  <IoMailOpenOutline size={42} />
                  <h3>No conversations found</h3>
                  <p>Start a private chat from Discover or create a group.</p>
                  <Link className="btn primary small" to="/discover">
                    Browse members
                  </Link>
                </div>
              )
            ) : (
              <div className="empty-conversation-pane">
                <IoMailOpenOutline size={42} />
                <h3>Login to open your inbox</h3>
                <p>Messages are securely saved with your account.</p>
                <Link className="btn primary small" to="/login">
                  Login
                </Link>
              </div>
            )}
          </div>
        </aside>

        <section className="message-thread">
          <div className="thread-header">
            <div className="thread-person">
              {activeConversation && (
                <UserAvatar
                  user={{
                    name: activeConversation.displayName,
                    avatarUrl: activeConversation.avatarUrl,
                  }}
                  className={`conversation-avatar ${activeConversation.type}`}
                  icon={
                    activeConversation.type === "group" ? (
                      <IoPeopleOutline />
                    ) : null
                  }
                />
              )}
              <div>
                <h2>
                  {activeConversation?.displayName || "Select a conversation"}
                </h2>
                <p>
                  {activeConversation?.type === "group"
                    ? `${groupMembers.length || activeConversation.memberCount} members`
                    : activeConversation
                      ? "Private conversation"
                      : "Choose a chat from your inbox."}
                </p>
              </div>
            </div>
            <div className="thread-header-actions">
              {activeConversation?.type === "group" && (
                <button
                  type="button"
                  className="btn outline small"
                  onClick={leaveActiveGroup}
                >
                  Leave group
                </button>
              )}
              <button
                type="button"
                className="btn outline small"
                onClick={() => navigate("/messages")}
              >
                <IoArrowBackOutline aria-hidden="true" /> All
              </button>
            </div>
          </div>

          {/* Context Header Capsule (Feature 4) */}
          {activeConversation && (
            <ConversationContextCapsule
              conversation={activeConversation}
              user={user}
            />
          )}

          {error && <div className="message-error">{error}</div>}
          <div className="thread-body">
            {!user ? (
              <div className="message-empty">
                Please login to see your messages.
              </div>
            ) : !activeConversation ? (
              <div className="message-empty">
                Select a conversation or create a community group.
              </div>
            ) : (
              <div className="message-list">
                {messages.length ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`message-row ${
                        Number(message.senderId) === Number(user.id)
                          ? "sent"
                          : "received"
                      } ${
                        liveMessageIds.has(message.id) &&
                        Number(message.senderId) !== Number(user.id)
                          ? "message-row-live"
                          : ""
                      }`}
                    >
                      {Number(message.senderId) !== Number(user.id) && (
                        <UserAvatar
                          user={{
                            name: message.senderName,
                            avatarUrl:
                              message.senderAvatarUrl ||
                              activeConversation.avatarUrl,
                          }}
                          className="message-author-avatar"
                        />
                      )}
                      <div className="message-bubble">
                        {activeConversation.type === "group" &&
                          Number(message.senderId) !== Number(user.id) && (
                            <strong className="message-sender">
                              {message.senderName}
                            </strong>
                          )}
                        {message.text && <p>{message.text}</p>}
                        {message.attachmentUrl &&
                          (message.messageType === "image" ? (
                            <a
                              href={resolveMediaUrl(message.attachmentUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="message-image-link"
                            >
                              <img
                                src={resolveMediaUrl(message.attachmentUrl)}
                                alt={message.attachmentName || "Shared image"}
                              />
                            </a>
                          ) : (
                            <a
                              className="message-document"
                              href={resolveMediaUrl(message.attachmentUrl)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <IoDocumentTextOutline />
                              <span>
                                <strong>
                                  {message.attachmentName || "Shared document"}
                                </strong>
                                <small>
                                  {formatFileSize(message.attachmentSize)}
                                </small>
                              </span>
                            </a>
                          ))}
                        <div className="message-meta">
                          <span>
                            {Number(message.senderId) === Number(user.id)
                              ? "You"
                              : message.senderName || "Member"}
                          </span>
                          <span>
                            {new Date(message.createdAt).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-thread">
                    No messages yet. Send the first message.
                  </div>
                )}
                {typingUser && (
                  <div className="typing-indicator">
                    {typingUser} is typing…
                  </div>
                )}
              </div>
            )}
          </div>

          {user && activeConversation && (
            <form className="compose-form" onSubmit={handleSend}>
              {attachment && (
                <div className="selected-attachment">
                  <IoAttachOutline />
                  <span>
                    {attachment.name} · {formatFileSize(attachment.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachment(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    aria-label="Remove attachment"
                  >
                    <IoCloseOutline />
                  </button>
                </div>
              )}
              <textarea
                value={draft}
                maxLength={5000}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Write a message…"
                aria-label="Message"
              />
              <div className="compose-actions">
                <div>
                  <input
                    ref={fileInputRef}
                    className="sr-only"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,.doc,.docx"
                    onChange={(event) =>
                      setAttachment(event.target.files?.[0] || null)
                    }
                  />
                  <button
                    type="button"
                    className="btn outline small"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <IoAttachOutline /> Attach
                  </button>
                </div>
                <button
                  type="submit"
                  className="btn primary small"
                  disabled={(!draft.trim() && !attachment) || sending}
                >
                  {sending ? "Sending…" : "Send"} <IoSend aria-hidden="true" />
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      {groupOpen && (
        <div className="group-dialog-backdrop" role="presentation">
          <form className="group-dialog" onSubmit={handleCreateGroup}>
            <div className="group-dialog-header">
              <div>
                <h2>Create community group</h2>
                <p>Choose members and start a shared conversation.</p>
              </div>
              <button
                type="button"
                className="icon-action"
                onClick={() => setGroupOpen(false)}
                aria-label="Close"
              >
                <IoCloseOutline />
              </button>
            </div>
            <label>
              Group name
              <input
                required
                minLength={2}
                maxLength={160}
                value={groupForm.name}
                onChange={(event) =>
                  setGroupForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Example: Frontend Study Circle"
              />
            </label>
            <label>
              Description
              <textarea
                maxLength={500}
                value={groupForm.description}
                onChange={(event) =>
                  setGroupForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="What will this group discuss?"
              />
            </label>
            <fieldset>
              <legend>
                Select members ({groupForm.memberIds.length} selected)
              </legend>
              <div className="group-member-picker">
                {availableMembers.map((member) => (
                  <label className="group-member-option" key={member.id}>
                    <input
                      type="checkbox"
                      checked={groupForm.memberIds.includes(member.id)}
                      onChange={() => toggleGroupMember(member.id)}
                    />
                    <UserAvatar user={member} className="mini-avatar" />
                    <span>
                      <strong>{member.name}</strong>
                      <small>{member.title || member.role}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="group-dialog-actions">
              <button
                type="button"
                className="btn outline"
                onClick={() => setGroupOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn primary"
                disabled={!groupForm.name.trim() || !groupForm.memberIds.length}
              >
                <IoPeopleOutline /> Create group
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};

export default Messages;
