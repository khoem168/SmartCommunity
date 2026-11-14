import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  IoArrowForward,
  IoBriefcaseOutline,
  IoChatbubbleEllipsesOutline,
  IoCheckmarkDoneOutline,
  IoCheckmarkOutline,
  IoCloseOutline,
  IoNotificationsOutline,
  IoPeopleOutline,
  IoSettingsOutline,
  IoShieldCheckmarkOutline,
  IoSparklesOutline,
  IoSwapHorizontalOutline,
  IoTimeOutline,
  IoTrashOutline,
  IoVideocamOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { localizeNotificationRecord } from "../../utils/bilingualCatalog";
import { formatKhmerRelativeTime } from "../../utils/userPresentation";
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
  { value: "", label: "All", labelKm: "ទាំងអស់", icon: IoNotificationsOutline },
  {
    value: "message",
    label: "Messages",
    labelKm: "សារសន្ទនា",
    icon: IoChatbubbleEllipsesOutline,
  },
  {
    value: "mentorship",
    label: "Mentorship",
    labelKm: "ការណែនាំ",
    icon: IoPeopleOutline,
  },
  {
    value: "skill_exchange",
    label: "Skill requests",
    labelKm: "សំណើប្តូរជំនាញ",
    icon: IoSwapHorizontalOutline,
  },
  {
    value: "internship",
    label: "Internships",
    labelKm: "ឱកាសការងារ",
    icon: IoBriefcaseOutline,
  },
  {
    value: "session",
    label: "Sessions",
    labelKm: "ថ្នាក់រៀនផ្ទាល់",
    icon: IoVideocamOutline,
  },
  {
    value: "system",
    label: "System",
    labelKm: "ប្រព័ន្ធ",
    icon: IoShieldCheckmarkOutline,
  },
];

const preferenceOptions = [
  ["message", "Direct and group messages", "សារផ្ទាល់ខ្លួន និងសារក្រុម"],
  ["mentorship", "Mentorship requests and updates", "សំណើ និងបច្ចុប្បន្នភាពការណែនាំ"],
  ["skillExchange", "Skill exchange requests", "សំណើផ្លាស់ប្តូរជំនាញ"],
  ["internship", "Internships and applications", "ឱកាសការងារ និងការដាក់ពាក្យ"],
  ["session", "Online learning sessions", "ថ្នាក់រៀនផ្ទាល់តាមអនឡាញ"],
  ["forum", "Community forum activity", "សកម្មភាពវេទិកាសហគមន៍"],
  ["system", "Important system updates", "បច្ចុប្បន្នភាពប្រព័ន្ធសំខាន់ៗ"],
];

const iconFor = (type) =>
  notificationTypes.find((item) => item.value === type)?.icon ||
  IoNotificationsOutline;

const getCategoryLabel = (type, isKm) => {
  const match = notificationTypes.find((t) => t.value === type);
  return isKm ? match?.labelKm || "ប្រព័ន្ធ" : match?.label || "System";
};

const getCtaLabel = (type, isKm) => {
  switch (type) {
    case "skill_exchange":
      return isKm ? "ពិនិត្យសំណើប្តូរជំនាញ" : "View Exchange";
    case "message":
      return isKm ? "ឆ្លើយតបសារ" : "Reply Message";
    case "internship":
      return isKm ? "ពិនិត្យឱកាសការងារ" : "View Internship";
    case "session":
      return isKm ? "មើលថ្នាក់រៀនផ្ទាល់" : "View Session";
    case "mentorship":
      return isKm ? "ពិនិត្យការណែនាំ" : "View Mentorship";
    default:
      return isKm ? "ពិនិត្យលម្អិត" : "View Details";
  }
};

const Notifications = () => {
  const { user } = useGlobleContext();
  const { language } = useLanguage();
  const isKm = language === "km";
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
      const nextStats = response.stats || { total: 0, unread: 0, byType: {} };
      setStats(nextStats);
      setPagination(response.pagination || { page: 1, pages: 1, total: 0 });
      setError("");
      const globalUnread = typeof nextStats.globalUnread === "number"
        ? nextStats.globalUnread
        : Number(nextStats.unread || 0);
      window.dispatchEvent(
        new CustomEvent("nav-badges:update", {
          detail: { unread: globalUnread },
        }),
      );
    } catch (err) {
      setError(err.message || (isKm ? "មិនអាចផ្ទុកការជូនដំណឹងបានទេ។" : "Unable to load notifications."));
    } finally {
      setLoading(false);
    }
  }, [user, type, unreadOnly, page, isKm]);

  const loadPreferences = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetchNotificationPreferences();
      setPreferences(response.preferences);
      setFirebaseServerConfigured(Boolean(response.firebaseConfigured));
    } catch (err) {
      setError(err.message || (isKm ? "មិនអាចផ្ទុកការកំណត់ការជូនដំណឹងបានទេ។" : "Unable to load notification settings."));
    }
  }, [user, isKm]);

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
    socket.on("notification:count", refresh);
    let stopForegroundPush = () => {};
    listenForForegroundPush(refresh)
      .then((stop) => {
        stopForegroundPush = stop;
      })
      .catch(() => {});
    return () => {
      socket.off("notification:new", refresh);
      socket.off("notification:count", refresh);
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
    window.dispatchEvent(
      new CustomEvent("nav-badges:update", {
        detail: { unread: 0 },
      }),
    );
  };

  const openNotification = async (notification) => {
    if (!notification.isRead) {
      await markNotificationReadRequest(notification.id);
      window.dispatchEvent(
        new CustomEvent("nav-badges:update", {
          detail: { unread: Math.max(0, (stats.unread || 1) - 1) },
        }),
      );
    }
    if (notification.link) navigate(notification.link);
    else loadNotifications();
  };

  const handleMarkSingleRead = async (event, notificationId) => {
    event.stopPropagation();
    await markNotificationReadRequest(notificationId);
    await loadNotifications();
    window.dispatchEvent(new CustomEvent("nav-badges:update"));
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
    window.dispatchEvent(new CustomEvent("nav-badges:update"));
  };

  const togglePreference = async (key) => {
    if (!preferences) return;
    try {
      const response = await updateNotificationPreferences({
        [key]: !preferences[key],
      });
      setPreferences(response.preferences);
    } catch (err) {
      setError(err.message || (isKm ? "មិនអាចកែប្រែការកំណត់បានទេ។" : "Unable to update notification preference."));
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
      setError(err.message || (isKm ? "មិនអាចកែប្រែការជូនដំណឹង Browser បានទេ។" : "Unable to update browser notifications."));
    } finally {
      setPushBusy(false);
    }
  };

  if (!user) {
    return (
      <main className="notifications-page">
        <section className="notifications-empty">
          <div className="notif-empty-icon-wrap">
            <IoNotificationsOutline size={52} />
          </div>
          <h1>
            {isKm ? "សូមចូលគណនីដើម្បីមើលការជូនដំណឹង" : "Login to view notifications"}
          </h1>
          <p>
            {isKm
              ? "រាល់ការជូនដំណឹងថ្មីៗ និងបច្ចុប្បន្នភាពគណនីរបស់អ្នកនឹងបង្ហាញនៅទីនេះ។"
              : "Your real-time alerts and account updates will appear here."}
          </p>
          <Link className="notif-login-btn" to="/login">
            {isKm ? "ចូលប្រើប្រាស់ឥឡូវនេះ" : "Login Now"}
          </Link>
        </section>
      </main>
    );
  }

  const currentTypeObj = notificationTypes.find((item) => item.value === type);
  const currentTypeLabel = isKm
    ? currentTypeObj?.labelKm || "ទាំងអស់"
    : currentTypeObj?.label || "All";

  return (
    <main className="notifications-page">
      {/* 1. TOP EXECUTIVE HEADER BANNER */}
      <section className="notif-top-hero">
        <div className="container notif-top-hero-inner">
          <div className="notif-hero-text">
            <div className="notif-eyebrow-pill">
              <IoSparklesOutline className="notif-sparkle-icon" />
              <span>{isKm ? "មជ្ឈមណ្ឌលជូនដំណឹងផ្ទាល់ខ្លួន" : "Activity & Notification Center"}</span>
            </div>
            <h1>
              {isKm
                ? "ការជូនដំណឹង និងសកម្មភាពគណនី"
                : "Notifications & Real-time Activity"}
            </h1>
            <p>
              {isKm
                ? "តាមដានរាល់សារសន្ទនា សំណើប្តូរជំនាញ ការណែនាំ និងឱកាសការងារភ្លាមៗក្នុងពេលជាក់ស្តែង។"
                : "Stay updated on messages, mentorship requests, skill exchanges, and career alerts."}
            </p>
          </div>

          <div className="notif-hero-stats-bar">
            <div className={`notif-stat-pill ${stats.unread > 0 ? "has-unread" : ""}`}>
              <span className="notif-stat-dot" />
              <div className="notif-stat-meta">
                <span className="notif-stat-num">{stats.unread}</span>
                <span className="notif-stat-label">{isKm ? "មិនទាន់អាន" : "Unread"}</span>
              </div>
            </div>
            <div className="notif-stat-pill">
              <div className="notif-stat-meta">
                <span className="notif-stat-num">{stats.total}</span>
                <span className="notif-stat-label">{isKm ? "សរុបទាំងអស់" : "Total Alerts"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAIN WORKSPACE WITH REFINED CATEGORY SIDEBAR & STREAM */}
      <section className="container notif-workspace-grid">
        {/* Left Category Aside */}
        <aside className="notif-sidebar-panel">
          <div className="notif-sidebar-top">
            <h2>{isKm ? "ប្រភេទជូនដំណឹង" : "Categories"}</h2>
            <button
              type="button"
              className="notif-icon-circle-btn"
              onClick={() => setSettingsOpen(true)}
              aria-label={isKm ? "ការកំណត់ការជូនដំណឹង" : "Notification settings"}
              title={isKm ? "ការកំណត់ការជូនដំណឹង" : "Notification settings"}
            >
              <IoSettingsOutline />
            </button>
          </div>

          <nav className="notif-type-pills-list" aria-label="Notification categories">
            {notificationTypes.map((item) => {
              const Icon = item.icon;
              const unread = item.value
                ? stats.byType?.[item.value]?.unread || 0
                : stats.unread;
              const isActive = type === item.value;

              return (
                <button
                  type="button"
                  key={item.value || "all"}
                  className={`notif-type-pill ${isActive ? "active" : ""}`}
                  onClick={() => {
                    setType(item.value);
                    setPage(1);
                  }}
                >
                  <span className="notif-pill-icon-wrap">
                    <Icon />
                  </span>
                  <span className="notif-pill-title">
                    {isKm ? item.labelKm : item.label}
                  </span>
                  {unread > 0 && (
                    <span className="notif-pill-badge">{unread}</span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="notif-sidebar-footer">
            <button
              type="button"
              className="notif-clear-read-btn"
              onClick={handleClearRead}
              title={isKm ? "លុបការជូនដំណឹងដែលបានអានរួចទាំងអស់" : "Clear all read notifications"}
            >
              <IoTrashOutline />
              <span>{isKm ? "លុបដែលអានរួច" : "Clear Read Alerts"}</span>
            </button>
          </div>
        </aside>

        {/* Right Notification Stream */}
        <div className="notif-stream-panel">
          {/* Header Controls Bar */}
          <div className="notif-stream-header">
            <div className="notif-stream-title-zone">
              <h2>
                {isKm
                  ? `ការជូនដំណឹង (${currentTypeLabel})`
                  : `${currentTypeLabel} Notifications`}
              </h2>
              <span className="notif-stream-count-sub">
                {isKm
                  ? `មិនទាន់អានចំនួន ${selectedUnread}`
                  : `${selectedUnread} unread update${selectedUnread === 1 ? "" : "s"}`}
              </span>
            </div>

            <div className="notif-stream-actions">
              {/* iOS-Style Custom Switch Toggle */}
              <button
                type="button"
                className={`notif-ios-switch-btn ${unreadOnly ? "active" : ""}`}
                onClick={() => {
                  setUnreadOnly((prev) => !prev);
                  setPage(1);
                }}
                role="switch"
                aria-checked={unreadOnly}
              >
                <span className="notif-switch-track">
                  <span className="notif-switch-thumb" />
                </span>
                <span className="notif-switch-text">
                  {isKm ? "បង្ហាញតែមិនទាន់អាន" : "Unread only"}
                </span>
              </button>

              {/* Mark All Read Button */}
              <button
                className="notification-mark-all-btn"
                type="button"
                onClick={handleMarkAll}
                disabled={!selectedUnread}
              >
                <IoCheckmarkDoneOutline className="notification-btn-icon" />
                <span>{isKm ? "កំណត់ថាអានរួចទាំងអស់" : "Mark all read"}</span>
              </button>
            </div>
          </div>

          {error && <div className="notifications-error">{error}</div>}

          {/* Loading Skeleton State */}
          {loading ? (
            <div className="notif-skeleton-list">
              {[1, 2, 3].map((n) => (
                <div key={n} className="notif-skeleton-card">
                  <div className="skeleton-icon-box" />
                  <div className="skeleton-content-box">
                    <div className="skeleton-line-title" />
                    <div className="skeleton-line-desc" />
                    <div className="skeleton-line-sub" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="notif-empty-state-card">
              <div className="notif-empty-bubble">
                <IoCheckmarkDoneOutline size={40} />
              </div>
              <h3>
                {isKm ? "អ្នកបានអានរួចរាល់ទាំងអស់ហើយ!" : "You're completely caught up!"}
              </h3>
              <p>
                {isKm
                  ? "មិនមានការជូនដំណឹងដែលត្រូវនឹងតម្រងនេះទេ។ នៅពេលមានសកម្មភាពថ្មី វានឹងបង្ហាញភ្លាមៗនៅទីនេះ។"
                  : "No notifications match this filter. New activity will appear here in real time."}
              </p>
              {unreadOnly && (
                <button
                  type="button"
                  className="notif-reset-filter-btn"
                  onClick={() => setUnreadOnly(false)}
                >
                  {isKm ? "បង្ហាញការជូនដំណឹងទាំងអស់" : "Show All Notifications"}
                </button>
              )}
            </div>
          ) : (
            <ul className="notif-cards-list">
              {notifications.map((rawNotif) => {
                const notification = localizeNotificationRecord(rawNotif, isKm);
                const Icon = iconFor(notification.type);
                const formattedTime = formatKhmerRelativeTime(
                  notification.createdAt,
                  isKm
                );
                const categoryName = getCategoryLabel(notification.type, isKm);
                const ctaText = getCtaLabel(notification.type, isKm);

                return (
                  <li key={notification.id} className="notif-item-wrapper">
                    <div
                      className={`notif-card-box ${notification.isRead ? "is-read" : "is-unread"}`}
                      onClick={() => openNotification(notification)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openNotification(notification);
                        }
                      }}
                    >
                      {/* Left Category Icon / Avatar Badge */}
                      <div className={`notif-type-icon-box notif-type-${notification.type || "system"}`}>
                        <Icon className="notif-type-glyph" />
                      </div>

                      {/* Middle Main Content */}
                      <div className="notif-main-content">
                        <div className="notif-title-row">
                          <strong className="notif-card-title">
                            {notification.title}
                          </strong>
                          <span className={`notif-cat-tag notif-tag-${notification.type || "system"}`}>
                            {categoryName}
                          </span>
                          {!notification.isRead && (
                            <span className="notif-new-badge">
                              <span className="notif-pulsing-dot" />
                              {isKm ? "ថ្មី" : "New"}
                            </span>
                          )}
                        </div>

                        <p className="notif-card-msg">{notification.message}</p>

                        <div className="notif-footer-row">
                          <span className="notif-time-stamp" title={new Date(notification.createdAt).toLocaleString()}>
                            <IoTimeOutline className="notif-time-icon" />
                            <span>{formattedTime}</span>
                          </span>

                          <span className="notif-cta-pill">
                            <span>{ctaText}</span>
                            <IoArrowForward className="notif-cta-arrow" />
                          </span>
                        </div>
                      </div>

                      {/* Right Action Icons (Mark read & Delete) */}
                      <div className="notif-card-actions" onClick={(e) => e.stopPropagation()}>
                        {!notification.isRead && (
                          <button
                            type="button"
                            className="notif-action-icon-btn mark-read"
                            onClick={(e) => handleMarkSingleRead(e, notification.id)}
                            title={isKm ? "កំណត់ថាអានរួច" : "Mark as read"}
                            aria-label={isKm ? "កំណត់ថាអានរួច" : "Mark as read"}
                          >
                            <IoCheckmarkOutline />
                          </button>
                        )}
                        <button
                          type="button"
                          className="notif-action-icon-btn delete"
                          onClick={(e) => handleDelete(e, notification.id)}
                          title={isKm ? "លុបការជូនដំណឹង" : "Delete notification"}
                          aria-label={isKm ? "លុបការជូនដំណឹង" : "Delete notification"}
                        >
                          <IoTrashOutline />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* 3. REFINED PAGINATION CONTROLS */}
          {pagination.pages > 1 && (
            <div className="notif-pagination-bar">
              <button
                type="button"
                className="notif-page-btn"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                {isKm ? "← ទំព័រមុន" : "← Previous"}
              </button>
              <span className="notif-page-badge">
                {isKm
                  ? `ទំព័រទី ${pagination.page} នៃ ${pagination.pages}`
                  : `Page ${pagination.page} of ${pagination.pages}`}
              </span>
              <button
                type="button"
                className="notif-page-btn"
                disabled={page >= pagination.pages}
                onClick={() => setPage((value) => value + 1)}
              >
                {isKm ? "ទំព័របន្ទាប់ →" : "Next →"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 4. SETTINGS MODAL DIALOG */}
      {settingsOpen && preferences && (
        <div
          className="notif-modal-backdrop"
          onClick={() => setSettingsOpen(false)}
          role="presentation"
        >
          <div
            className="notif-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="notif-modal-header">
              <div className="notif-modal-title-group">
                <div className="notif-modal-icon-bubble">
                  <IoSettingsOutline />
                </div>
                <div>
                  <h2>{isKm ? "ការកំណត់ការជូនដំណឹង" : "Notification Settings"}</h2>
                  <p>
                    {isKm
                      ? "ជ្រើសរើសប្រភេទបច្ចុប្បន្នភាពដែលអ្នកចង់ទទួលបានតាមចំណង់ចំណូលចិត្ត"
                      : "Choose what notifications you want to receive across categories"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="notif-modal-close-btn"
                onClick={() => setSettingsOpen(false)}
                aria-label={isKm ? "បិទផ្ទាំង" : "Close"}
              >
                <IoCloseOutline />
              </button>
            </div>

            <div className="notif-preferences-group">
              <h4 className="notif-pref-subheading">
                {isKm ? "ប្រភេទបច្ចុប្បន្នភាពក្នុងប្រព័ន្ធ" : "In-App Notification Channels"}
              </h4>
              <div className="notif-pref-rows-list">
                {preferenceOptions.map(([key, label, labelKm]) => (
                  <div className="notif-pref-row" key={key}>
                    <span className="notif-pref-label">
                      {isKm ? labelKm || label : label}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(preferences[key])}
                      className={`notif-ios-switch-btn ${preferences[key] ? "active" : ""}`}
                      onClick={() => togglePreference(key)}
                    >
                      <span className="notif-switch-track">
                        <span className="notif-switch-thumb" />
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Browser Push Section */}
            <div className="notif-push-card">
              <div className="notif-push-meta">
                <strong>
                  {isKm
                    ? "ការជូនដំណឹងតាម Browser (Firebase Push)"
                    : "Firebase Browser Push Notifications"}
                </strong>
                <p>
                  {isKm
                    ? "ទទួលបានដំណឹងភ្លាមៗទោះបីជាអ្នកមិនបានបើកផ្ទាំងកម្មវិធីនេះក៏ដោយ។"
                    : "Receive instant desktop alerts even when this tab is closed or in the background."}
                </p>
              </div>

              <button
                className={`notif-push-toggle-btn ${preferences.pushEnabled ? "is-enabled" : "is-disabled"}`}
                type="button"
                onClick={togglePush}
                disabled={
                  pushBusy ||
                  !isFirebaseClientConfigured() ||
                  !firebaseServerConfigured
                }
              >
                {pushBusy
                  ? isKm
                    ? "កំពុងដំណើរការ…"
                    : "Updating…"
                  : preferences.pushEnabled
                    ? isKm
                      ? "បិទ Push Notifications"
                      : "Disable Push"
                    : isKm
                      ? "បើក Push Notifications"
                      : "Enable Push"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Notifications;
