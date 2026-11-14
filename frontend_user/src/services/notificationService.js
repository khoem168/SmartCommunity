import { apiFetch } from "./api";

export const fetchNotificationCenter = (filters = {}) => {
  const search = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== undefined && value !== false) {
      search.set(key, String(value));
    }
  });
  return apiFetch(`/notifications?${search.toString()}`);
};

export const fetchNotifications = async () => {
  const response = await fetchNotificationCenter({ limit: 50 });
  return response.notifications || [];
};

export const fetchUnreadNotificationCount = async () => {
  try {
    const response = await apiFetch(`/notifications/unread-count?_t=${Date.now()}`);
    return Number(response?.unread || 0);
  } catch {
    try {
      const fallback = await fetchNotificationCenter({ limit: 1 });
      return Number(fallback?.stats?.unread || 0);
    } catch {
      return 0;
    }
  }
};

export const markNotificationReadRequest = async (notificationId) => {
  return apiFetch(`/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
};

export const markAllNotificationsReadRequest = async (type = "") => {
  return apiFetch("/notifications/read-all", {
    method: "PATCH",
    body: JSON.stringify(type ? { type } : {}),
  });
};

export const deleteNotificationRequest = (notificationId) =>
  apiFetch(`/notifications/${notificationId}`, { method: "DELETE" });

export const deleteReadNotificationsRequest = () =>
  apiFetch("/notifications/read", { method: "DELETE" });

export const fetchNotificationPreferences = () =>
  apiFetch("/notification-preferences");

export const updateNotificationPreferences = (payload) =>
  apiFetch("/notification-preferences", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const registerPushTokenRequest = (token) =>
  apiFetch("/notification-push-token", {
    method: "POST",
    body: JSON.stringify({ token }),
  });

export const unregisterPushTokenRequest = (token) =>
  apiFetch("/notification-push-token", {
    method: "DELETE",
    body: JSON.stringify({ token }),
  });
