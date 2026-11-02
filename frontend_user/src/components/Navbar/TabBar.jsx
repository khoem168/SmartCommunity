import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiLayout,
  FiBookOpen,
  FiBriefcase,
  FiMessageSquare,
  FiMoreHorizontal,
  FiUsers,
  FiAward,
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
  const isKm = language === "km";
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

  const handleOpenDrawer = () => {
    window.dispatchEvent(new CustomEvent("open-mobile-drawer"));
  };

  const role = user?.role || "guest";

  // Role-adaptive tabs: Workspace | Learn | Jobs | Messages | More
  const getRoleTabs = () => {
    if (role === "recruiter") {
      return [
        { to: "/dashboard", Icon: FiLayout, label: isKm ? "ផ្ទាំងការងារ" : "Workspace" },
        { to: "/recruiter/candidates", Icon: FiUsers, label: isKm ? "បេក្ខជន" : "Candidates" },
        { to: "/my-posts", Icon: FiBriefcase, label: isKm ? "ការងារ" : "My Jobs" },
        { to: "/messages", Icon: FiMessageSquare, label: isKm ? "សារ" : "Messages", badge: unreadMessages },
      ];
    }
    if (role === "mentor") {
      return [
        { to: "/dashboard", Icon: FiLayout, label: isKm ? "ផ្ទាំងការងារ" : "Workspace" },
        { to: "/mentorship", Icon: FiAward, label: isKm ? "ណែនាំ" : "Mentorship" },
        { to: "/courses", Icon: FiBookOpen, label: isKm ? "វគ្គសិក្សា" : "Courses" },
        { to: "/messages", Icon: FiMessageSquare, label: isKm ? "សារ" : "Messages", badge: unreadMessages },
      ];
    }
    // Student / Guest
    return [
      { to: user ? "/dashboard" : "/login", Icon: FiLayout, label: isKm ? "ផ្ទាំងការងារ" : "Workspace" },
      { to: "/courses", Icon: FiBookOpen, label: isKm ? "រៀន" : "Learn" },
      { to: "/jobs", Icon: FiBriefcase, label: isKm ? "ការងារ" : "Jobs" },
      { to: user ? "/messages" : "/forum", Icon: FiMessageSquare, label: isKm ? "សារ" : "Messages", badge: unreadMessages },
    ];
  };

  const tabs = getRoleTabs();

  return (
    <nav className="tabbar glass" id="tabbar" aria-label="Mobile Navigation">
      {tabs.map((tab) => {
        const isActive = location.pathname.startsWith(tab.to);
        const IconComponent = tab.Icon;

        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`tabbar-item ${isActive ? "on" : ""}`}
            title={tab.label}
          >
            <div className="tabbar-icon-wrap">
              <IconComponent className="tabbar-icon" />
              {Boolean(tab.badge) && tab.badge > 0 && (
                <span className="tabbar-badge">
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
            </div>
            <span className="tabbar-label">{tab.label}</span>
          </Link>
        );
      })}

      {/* "More" button to trigger full accessible mobile drawer */}
      <button
        type="button"
        className="tabbar-item tabbar-more-btn"
        onClick={handleOpenDrawer}
        aria-label={isKm ? "មុខងារផ្សេងៗ (More)" : "More features"}
      >
        <div className="tabbar-icon-wrap">
          <FiMoreHorizontal className="tabbar-icon" />
        </div>
        <span className="tabbar-label">{isKm ? "ផ្សេងៗ" : "More"}</span>
      </button>
    </nav>
  );
}
