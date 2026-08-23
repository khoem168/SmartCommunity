import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  IoBriefcaseOutline,
  IoChatbubbleEllipsesOutline,
  IoCheckmarkDoneOutline,
  IoCloseOutline,
  IoNotificationsOutline,
  IoPeopleOutline,
  IoSettingsOutline,
  IoShieldCheckmarkOutline,
  IoSwapHorizontalOutline,
  IoTrashOutline,
  IoVideocamOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import {
  clearStoredFirebaseToken,
  enableFirebasePush,
  getStoredFirebaseToken,
  isFirebaseClientConfigured,
  listenForForegroundPush,
} from "../../services/firebaseMessagingService";
import {
  deleteNotificationRequest,
  deleteReadNotificationsRequest,
  fetchNotificationCenter,
  fetchNotificationPreferences,
  markAllNotificationsReadRequest,
  markNotificationReadRequest,
  registerPushTokenRequest,
  unregisterPushTokenRequest,
  updateNotificationPreferences,
} from "../../services/notificationService";
import { getSocket } from "../../services/realtimeService";
import "./Notifications.css";

const notificationTypes = [
  { value: "", label: "All", icon: IoNotificationsOutline },
  { value: "message", label: "Messages", icon: IoChatbubbleEllipsesOutline },
  { value: "mentorship", label: "Mentorship", icon: IoPeopleOutline },
  {
    value: "skill_exchange",
    label: "Skill requests",
    icon: IoSwapHorizontalOutline,
  },
  { value: "internship", label: "Internships", icon: IoBriefcaseOutline },
  { value: "session", label: "Sessions", icon: IoVideocamOutline },
  { value: "system", label: "System", icon: IoShieldCheckmarkOutline },
];

const preferenceOptions = [
  ["message", "Direct and group messages"],
  ["mentorship", "Mentorship requests and updates"],
  ["skillExchange", "Skill exchange requests"],
  ["internship", "Internships and applications"],
  ["session", "Online learning sessions"],
  ["forum", "Community forum activity"],
  ["system", "Important system updates"],
];

const iconFor = (type) =>
  notificationTypes.find((item) => item.value === type)?.icon ||
  IoNotificationsOutline;

const Notifications = () => {
  const { user } = useGlobleContext();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, byType: {} });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [type, setType] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [preferences, setPreferences] = useState(null);
  const [firebaseServerConfigured, setFirebaseServerConfigured] =
    useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pushBusy, setPushBusy] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetchNotificationCenter({
        type,
        unreadOnly,
        page,
        limit: 15,
      });
      setNotifications(response.notifications || []);
      setStats(response.stats || { total: 0, unread: 0, byType: {} });
      setPagination(response.pagination || { page: 1, pages: 1, total: 0 });
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [user, type, unreadOnly, page]);

  const loadPreferences = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetchNotificationPreferences();
      setPreferences(response.preferences);
      setFirebaseServerConfigured(Boolean(response.firebaseConfigured));
    } catch (err) {
      setError(err.message || "Unable to load notification settings.");
    }
  }, [user]);

  useEffect(() => {
    Promise.resolve()
      .then(loadNotifications)
      .catch(() => undefined);
  }, [loadNotifications]);

  useEffect(() => {
    Promise.resolve()
      .then(loadPreferences)
      .catch(() => undefined);
  }, [loadPreferences]);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    const refresh = () => {
      loadNotifications();
      window.dispatchEvent(new CustomEvent("nav-badges:update"));
    };
    socket.on("notification:new", refresh);
    let stopForegroundPush = () => {};
    listenForForegroundPush(refresh)
      .then((stop) => {
        stopForegroundPush = stop;
      })
      .catch(() => {});
    return () => {
      socket.off("notification:new", refresh);
      stopForegroundPush();
    };
  }, [user, loadNotifications]);

  const selectedUnread = useMemo(
    () =>
      type
        ? Number(stats.byType?.[type]?.unread || 0)
        : Number(stats.unread || 0),
    [stats, type],
  );

  const handleMarkAll = async () => {
    await markAllNotificationsReadRequest(type);
    await loadNotifications();
    window.dispatchEvent(new CustomEvent("nav-badges:update"));
  };

  const openNotification = async (notification) => {
    if (!notification.isRead) {
      await markNotificationReadRequest(notification.id);
    }
    window.dispatchEvent(new CustomEvent("nav-badges:update"));
    if (notification.link) navigate(notification.link);
    else loadNotifications();
  };

  const handleDelete = async (event, notificationId) => {
    event.stopPropagation();
    await deleteNotificationRequest(notificationId);
    await loadNotifications();
    window.dispatchEvent(new CustomEvent("nav-badges:update"));
  };

  const handleClearRead = async () => {
    await deleteReadNotificationsRequest();
    setPage(1);
    await loadNotifications();
  };

  const togglePreference = async (key) => {
    if (!preferences) return;
    try {
      const response = await updateNotificationPreferences({
        [key]: !preferences[key],
      });
      setPreferences(response.preferences);
    } catch (err) {
      setError(err.message || "Unable to update notification preference.");
    }
  };

  const togglePush = async () => {
    if (!preferences || pushBusy) return;
    try {
      setPushBusy(true);
      if (preferences.pushEnabled) {
        await unregisterPushTokenRequest(getStoredFirebaseToken());
        clearStoredFirebaseToken();
      } else {
        const token = await enableFirebasePush();
        await registerPushTokenRequest(token);
      }
      await loadPreferences();
    } catch (err) {
      setError(err.message || "Unable to update browser notifications.");
    } finally {
      setPushBusy(false);
    }
  };

  if (!user) {
    return (
      <main className="notifications-page">
        <section className="notifications-empty">
          <IoNotificationsOutline size={52} />
          <h1>Login to view notifications</h1>
          <p>Your real-time alerts and account updates will appear here.</p>
          <Link className="btn primary" to="/login">
            Login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="notifications-page">
      <section className="notifications-hero">
        <div className="container notifications-hero-inner">
          <div>
            <p className="eyebrow">Activity center</p>
            <h1>Stay connected to every opportunity.</h1>
            <p>
              Messages, mentoring, skill requests, internships, and live
              sessions—updated in real time.
            </p>
          </div>
          <div className="notification-summary">
            <div>
              <strong>{stats.unread}</strong>
              <span>Unread</span>
            </div>
            <div>
              <strong>{stats.total}</strong>
              <span>Total alerts</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section container notifications-layout">
        <aside className="notification-sidebar">
          <div className="notification-sidebar-heading">
            <h2>Categories</h2>
            <button
              type="button"
              className="icon-button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Notification settings"
            >
              <IoSettingsOutline />
            </button>
          </div>
          <nav className="notification-type-list">
            {notificationTypes.map((item) => {
              const Icon = item.icon;
              const unread = item.value
                ? stats.byType?.[item.value]?.unread || 0
                : stats.unread;
              return (
                <button
                  type="button"
                  className={type === item.value ? "active" : ""}
                  onClick={() => {
                    setType(item.value);
                    setPage(1);
                  }}
                  key={item.label}
                >
                  <Icon />
                  <span>{item.label}</span>
                  {unread > 0 && <strong>{unread}</strong>}
                </button>
              );
            })}
          </nav>
          <button
            type="button"
            className="clear-read-button"
            onClick={handleClearRead}
          >
            <IoTrashOutline /> Clear read alerts
          </button>
        </aside>

        <div className="notification-main">
          <header className="notifications-header">
            <div>
              <h2>
                {notificationTypes.find((item) => item.value === type)?.label ||
                  "All"}{" "}
                notifications
              </h2>
              <p>
                {selectedUnread} unread update{selectedUnread === 1 ? "" : "s"}
              </p>
            </div>
            <div className="notification-header-actions">
              <label className="unread-toggle">
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={(event) => {
                    setUnreadOnly(event.target.checked);
                    setPage(1);
                  }}
                />
                Unread only
              </label>
              <button
                className="btn outline small"
                type="button"
                onClick={handleMarkAll}
                disabled={!selectedUnread}
              >
                <IoCheckmarkDoneOutline /> Mark all read
              </button>
            </div>
          </header>

          {error && <div className="notifications-error">{error}</div>}

          {loading ? (
            <div className="notifications-empty-state">
              Loading notifications…
            </div>
          ) : notifications.length === 0 ? (
            <div className="notifications-empty-state">
              <IoNotificationsOutline size={44} />
              <h2>You’re all caught up</h2>
              <p>No notifications match this filter.</p>
            </div>
          ) : (
            <ul className="notification-list">
              {notifications.map((notification) => {
                const Icon = iconFor(notification.type);
                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      className={`notification-card ${notification.isRead ? "read" : "unread"}`}
                      onClick={() => openNotification(notification)}
                    >
                      <span
                        className={`notification-icon ${notification.type}`}
                      >
                        <Icon />
                      </span>
                      <span className="notification-content">
                        <span className="notification-title-line">
                          <strong>{notification.title}</strong>
                          {!notification.isRead && <i>New</i>}
                        </span>
                        <span>{notification.message}</span>
                        <small>
                          {new Date(notification.createdAt).toLocaleString()}
                        </small>
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        className="notification-delete"
                        onClick={(event) =>
                          handleDelete(event, notification.id)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter")
                            handleDelete(event, notification.id);
                        }}
                        aria-label="Delete notification"
                      >
                        <IoTrashOutline />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {pagination.pages > 1 && (
            <div className="notification-pagination">
              <button
                type="button"
                className="btn outline small"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                type="button"
                className="btn outline small"
                disabled={page >= pagination.pages}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>

      {settingsOpen && preferences && (
        <div className="notification-settings-backdrop" role="presentation">
          <aside
            className="notification-settings-panel"
            role="dialog"
            aria-modal="true"
          >
            <div className="settings-panel-header">
              <div>
                <h2>Notification settings</h2>
                <p>Choose which updates you want to receive.</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setSettingsOpen(false)}
              >
                <IoCloseOutline />
              </button>
            </div>
            <div className="preference-list">
              {preferenceOptions.map(([key, label]) => (
                <label className="preference-row" key={key}>
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={preferences[key]}
                    onChange={() => togglePreference(key)}
                  />
                </label>
              ))}
            </div>
            <div className="push-settings">
              <div>
                <strong>Firebase browser notifications</strong>
                <p>Receive alerts even when this page is in the background.</p>
              </div>
              <button
                className={`btn small ${preferences.pushEnabled ? "outline" : "primary"}`}
                type="button"
                onClick={togglePush}
                disabled={
                  pushBusy ||
                  !isFirebaseClientConfigured() ||
                  !firebaseServerConfigured
                }
              >
                {pushBusy
                  ? "Updating…"
                  : preferences.pushEnabled
                    ? "Disable push"
                    : "Enable push"}
              </button>
              {(!isFirebaseClientConfigured() || !firebaseServerConfigured) && (
                <small>
                  Add Firebase credentials to the frontend and backend
                  environment files to enable push.
                </small>
              )}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
};

export default Notifications;
