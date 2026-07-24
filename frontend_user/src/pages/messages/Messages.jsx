import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import { fetchMembers } from "../../services/platformService";
import {
  createGroupConversation,
  listConversationMembers,
  listConversations,
  listMessages,
  removeConversationMember,
  sendMessage,
} from "../../services/messageService";
import { getSocket } from "../../services/realtimeService";
import "./Messages.css";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const Messages = () => {
  const { user } = useGlobleContext();
  const { conversationId } = useParams();
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
        setActiveId((current) => current || convos[0]?.id || "");
      } catch (err) {
        setError(err.message || "Unable to load conversations.");
      }
    };
    loadConversations();
  }, [user, conversationId, refreshConversations]);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => String(conversation.id) === String(activeId),
      ),
    [activeId, conversations],
  );

  const visibleConversations = useMemo(
    () =>
      conversations.filter((conversation) => {
        const matchesType = filter === "all" || conversation.type === filter;
        const matchesQuery = conversation.displayName
          .toLowerCase()
          .includes(query.trim().toLowerCase());
        return matchesType && matchesQuery;
      }),
    [conversations, filter, query],
  );

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
        setTypingUser(payload.isTyping ? payload.user?.fullName || "Someone" : "");
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
    socket.emit("typing", { conversationId: activeId, isTyping: Boolean(draft) });
    const timer = window.setTimeout(
      () => socket.emit("typing", { conversationId: activeId, isTyping: false }),
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
                {["all", "direct", "group"].map((type) => (
                  <button
                    type="button"
                    className={filter === type ? "active" : ""}
                    onClick={() => setFilter(type)}
                    key={type}
                  >
                    {type}
                  </button>
                ))}
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
                        <span
                          className={`conversation-avatar ${conversation.type}`}
                        >
                          {conversation.type === "group" ? (
                            <IoPeopleOutline />
                          ) : (
                            getInitials(conversation.displayName)
                          )}
                        </span>
                        <span className="conversation-info">
                          <span className="conversation-title-line">
                            <strong>{conversation.displayName}</strong>
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
                <span className={`conversation-avatar ${activeConversation.type}`}>
                  {activeConversation.type === "group" ? (
                    <IoPeopleOutline />
                  ) : (
                    getInitials(activeConversation.displayName)
                  )}
                </span>
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

          {error && <div className="message-error">{error}</div>}
          <div className="thread-body">
            {!user ? (
              <div className="message-empty">Please login to see your messages.</div>
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
                      }`}
                    >
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
                              href={message.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="message-image-link"
                            >
                              <img
                                src={message.attachmentUrl}
                                alt={message.attachmentName || "Shared image"}
                              />
                            </a>
                          ) : (
                            <a
                              className="message-document"
                              href={message.attachmentUrl}
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
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
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
                  <div className="typing-indicator">{typingUser} is typing…</div>
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
                    <span className="mini-avatar">{getInitials(member.name)}</span>
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
