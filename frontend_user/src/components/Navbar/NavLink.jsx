import { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  IoChatbubbleEllipsesOutline,
  IoNotificationsOutline,
} from "react-icons/io5";
import { privateNavLinks, publicNavLinks } from "../../data/navLink";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { listConversations } from "../../services/messageService";
import { fetchNotifications } from "../../services/notificationService";
import { getSocket } from "../../services/realtimeService";

const navIcons = {
  messages: IoChatbubbleEllipsesOutline,
  notifications: IoNotificationsOutline,
};

const Navlink = () => {
  const { user } = useGlobleContext();
  const { t } = useLanguage();
  const [badgeCounts, setBadgeCounts] = useState({
    messages: 0,
    notifications: 0,
  });
  const links = user ? privateNavLinks : publicNavLinks;

  const refreshBadgeCounts = useCallback(async () => {
    if (!user) return;

    try {
      const [conversations, notifications] = await Promise.all([
        listConversations(),
        fetchNotifications(),
      ]);

      setBadgeCounts({
        messages: conversations.reduce(
          (total, conversation) =>
            total + Number(conversation.unreadCount || 0),
          0,
        ),
        notifications: notifications.filter(
          (notification) => !notification.isRead,
        ).length,
      });
    } catch {
      setBadgeCounts({ messages: 0, notifications: 0 });
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      Promise.resolve().then(() =>
        setBadgeCounts({ messages: 0, notifications: 0 }),
      );
      return;
    }

    Promise.resolve()
      .then(refreshBadgeCounts)
      .catch(() => undefined);
    window.addEventListener("nav-badges:update", refreshBadgeCounts);

    return () =>
      window.removeEventListener("nav-badges:update", refreshBadgeCounts);
  }, [refreshBadgeCounts, user]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();

    socket.on("message:new", refreshBadgeCounts);
    socket.on("notification:new", refreshBadgeCounts);

    return () => {
      socket.off("message:new", refreshBadgeCounts);
      socket.off("notification:new", refreshBadgeCounts);
    };
  }, [refreshBadgeCounts, user]);

  return (
    <ul className="navlink">
      {links.map(({ label, labelKey, link, icon, iconOnly }) => {
        const Icon = navIcons[icon];
        const localizedLabel = labelKey ? t(`nav.${labelKey}`) : label;

        return (
          <li
            className={iconOnly ? `nav-icon-item nav-icon-item-${icon}` : undefined}
            key={link}
          >
            {link.includes("#") ? (
              <a href={link}>{localizedLabel}</a>
            ) : (
              <NavLink
                to={link}
                end
                aria-label={iconOnly ? localizedLabel : undefined}
                title={iconOnly ? localizedLabel : undefined}
                className={({ isActive }) =>
                  `${isActive ? "active" : ""} ${
                    iconOnly ? "nav-icon-link" : ""
                  }`.trim()
                }
              >
                {Icon ? (
                  <span className="nav-icon">
                    <Icon aria-hidden="true" />
                    {badgeCounts[icon] > 0 ? (
                      <span className="nav-badge realtime-pulse-dot">{badgeCounts[icon]}</span>
                    ) : null}
                  </span>
                ) : null}
                {!iconOnly && localizedLabel}
                {iconOnly && (
                  <span className="nav-icon-label">{localizedLabel}</span>
                )}
              </NavLink>
            )}
          </li>
        );
      })}
    </ul>
  );
};
export default Navlink;
