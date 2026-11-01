import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiHome,
  FiBookOpen,
  FiCompass,
  FiBriefcase,
  FiMessageSquare,
  FiUser,
} from "react-icons/fi";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { listConversations } from "../../services/messageService";
import { getSocket } from "../../services/realtimeService";
import "./TabBar.css";

export default function TabBar() {
  const { user } = useGlobleContext();
  const { language } = useLanguage();
  const location = useLocation();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    listConversations()
      .then((conversations) => {
        if (!active) return;
        const total = (conversations || []).reduce(
          (sum, c) => sum + Number(c.unreadCount || 0),
          0,
        );
        setUnreadMessages(total);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    const handleMessage = () => {
      listConversations()
        .then((conversations) => {
          const total = (conversations || []).reduce(
            (sum, c) => sum + Number(c.unreadCount || 0),
            0,
          );
          setUnreadMessages(total);
        })
        .catch(() => {});
    };

    socket.on("message:new", handleMessage);
    return () => {
      socket.off("message:new", handleMessage);
    };
  }, [user]);

  const tabs = [
    {
      to: "/",
      Icon: FiHome,
      label: language === "km" ? "ទំព័រដើម" : "Home",
      exact: true,
    },
    {
      to: "/courses",
      Icon: FiBookOpen,
      label: language === "km" ? "វគ្គសិក្សា" : "Courses",
    },
    {
      to: "/career",
      Icon: FiCompass,
      label: language === "km" ? "អាជីព" : "Career",
    },
    {
      to: "/jobs",
      Icon: FiBriefcase,
      label: language === "km" ? "ការងារ" : "Jobs",
    },
    user
      ? {
          to: "/messages",
          Icon: FiMessageSquare,
          label: language === "km" ? "សារ" : "Messages",
          badge: unreadMessages,
        }
      : {
          to: "/login",
          Icon: FiUser,
          label: language === "km" ? "ចូលគណនី" : "Sign in",
        },
  ];

  return (
    <nav className="tabbar glass" id="tabbar" aria-label="Mobile Navigation">
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? location.pathname === tab.to
          : location.pathname.startsWith(tab.to);
        const IconComponent = tab.Icon;

        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`tabbar-item ${isActive ? "on" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <div className="tabbar-icon-wrap">
              <IconComponent className="tb-icon" aria-hidden="true" />
              {tab.badge > 0 && (
                <b className="tb-badge">{tab.badge > 99 ? "99+" : tab.badge}</b>
              )}
            </div>
            <span className="tb-label">{tab.label}</span>
            {isActive && <span className="tb-active-indicator" aria-hidden="true" />}
          </Link>
        );
      })}
    </nav>
  );
}

