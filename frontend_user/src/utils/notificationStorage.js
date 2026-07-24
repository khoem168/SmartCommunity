const STORAGE_KEY = "smartCommunityNotifications";

const loadNotifications = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveNotifications = (notifications) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("notifications:update"));
  }
};

export const getUserNotifications = (userId) => {
  if (!userId) return [];
  const notifications = loadNotifications();
  return notifications
    .filter((notification) => notification.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const getUnreadNotificationCount = (userId) => {
  if (!userId) return 0;
  return getUserNotifications(userId).filter(
    (notification) => !notification.isRead,
  ).length;
};

export const markNotificationRead = (userId, notificationId) => {
  if (!userId || !notificationId) return;
  const notifications = loadNotifications();
  const nextNotifications = notifications.map((notification) =>
    notification.userId === userId && notification.id === notificationId
      ? { ...notification, isRead: true }
      : notification,
  );
  saveNotifications(nextNotifications);
};

export const markAllNotificationsRead = (userId) => {
  if (!userId) return;
  const notifications = loadNotifications();
  const nextNotifications = notifications.map((notification) =>
    notification.userId === userId
      ? { ...notification, isRead: true }
      : notification,
  );
  saveNotifications(nextNotifications);
};

export const addNotification = (userId, title, message, link = "/") => {
  if (!userId) return null;
  const notifications = loadNotifications();
  const nextNotification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    title: title || "Notification",
    message: message || "You have a new notification.",
    link,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  const nextNotifications = [nextNotification, ...notifications];
  saveNotifications(nextNotifications);
  return nextNotification;
};
