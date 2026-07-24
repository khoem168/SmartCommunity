self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { notification: { title: "Smart Community", body: event.data.text() } };
  }
  const notification = payload.notification || {};
  const data = payload.data || {};
  event.waitUntil(
    self.registration.showNotification(notification.title || "Smart Community", {
      body: notification.body || "You have a new update.",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: { link: data.link || "/notifications" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/notifications";
  event.waitUntil(self.clients.openWindow(link));
});
