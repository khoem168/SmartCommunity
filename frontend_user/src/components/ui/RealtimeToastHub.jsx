import { useEffect, useRef, useState } from "react";
import { IoChatbubbleEllipsesOutline, IoNotificationsOutline } from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import { getSocket } from "../../services/realtimeService";
import "./RealtimeToastHub.css";

const MAX_TOASTS = 4;
const TOAST_LIFETIME = 4800;

const messageBody = (payload = {}) => {
  if (payload.text) return payload.text;
  if (payload.attachmentName) return `Shared ${payload.attachmentName}`;
  return "Sent you a new message.";
};

const notificationBody = (payload = {}) =>
  payload.message || "You have a new real-time update.";

const RealtimeToastHub = () => {
  const { user } = useGlobleContext();
  const [toasts, setToasts] = useState([]);
  const timers = useRef([]);
  const toastIndex = useRef(0);

  useEffect(() => {
    if (!user?.id) return undefined;

    const socket = getSocket();
    const removeToast = (id) => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    };
    const pushToast = (toast) => {
      toastIndex.current += 1;
      const nextToast = {
        ...toast,
        id: `${toast.id}-${toastIndex.current}`,
        userId: user.id,
      };
      setToasts((current) => [...current, nextToast].slice(-MAX_TOASTS));
      const timer = window.setTimeout(() => removeToast(nextToast.id), TOAST_LIFETIME);
      timers.current.push(timer);
    };
    const handleMessage = (payload = {}) => {
      if (Number(payload.senderId) === Number(user.id)) return;
      pushToast({
        id: `message-${payload.id || Date.now()}`,
        type: "message",
        title: payload.senderName || "New message",
        body: messageBody(payload),
      });
    };
    const handleNotification = (payload = {}) => {
      pushToast({
        id: `notification-${payload.id || Date.now()}`,
        type: payload.type || "notification",
        title: payload.title || "New notification",
        body: notificationBody(payload),
      });
    };

    socket.on("message:new", handleMessage);
    socket.on("notification:new", handleNotification);

    return () => {
      socket.off("message:new", handleMessage);
      socket.off("notification:new", handleNotification);
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [];
    };
  }, [user]);

  const visibleToasts = user
    ? toasts.filter((toast) => Number(toast.userId) === Number(user.id))
    : [];

  if (!user || visibleToasts.length === 0) return null;

  return (
    <div className="realtime-toast-stack" aria-live="polite" aria-atomic="false">
      {visibleToasts.map((toast) => {
        const Icon =
          toast.type === "message" ? IoChatbubbleEllipsesOutline : IoNotificationsOutline;

        return (
          <section className="realtime-toast" key={toast.id}>
            <span className="realtime-toast-icon realtime-pulse-dot">
              <Icon aria-hidden="true" />
            </span>
            <span className="realtime-toast-copy">
              <strong>{toast.title}</strong>
              <span>{toast.body}</span>
            </span>
          </section>
        );
      })}
    </div>
  );
};

export default RealtimeToastHub;
