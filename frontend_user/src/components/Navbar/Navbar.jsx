import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiSearch, FiBell, FiSun, FiMoon } from "react-icons/fi";
import logo from "../../assets/logo/logo1.png";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { NavProfile } from "./NavProfile";
import { fetchNotifications } from "../../services/notificationService";
import { getSocket } from "../../services/realtimeService";
import "./navbar.css";

const defaultNavItems = [
  { sectionId: "courses", path: "/courses", labelEn: "Courses", labelKm: "វគ្គសិក្សា" },
  { sectionId: "exchange", path: "/skill-exchange", labelEn: "Skill Swap", labelKm: "ប្តូរជំនាញ" },
  { sectionId: "mentors", path: "/mentorship", labelEn: "Mentors", labelKm: "អ្នកណែនាំ" },
  { sectionId: "sessions", path: "/sessions", labelEn: "Live", labelKm: "Live" },
  { sectionId: "career", path: "/career", labelEn: "Career", labelKm: "អាជីព" },
  { sectionId: "jobs", path: "/jobs", labelEn: "Internships", labelKm: "កម្មសិក្សា" },
  { sectionId: "forum", path: "/forum", labelEn: "Forum", labelKm: "ហ្វូរ៉ុម" },
];

const recruiterNavItems = [
  { sectionId: "dashboard", path: "/dashboard", labelEn: "Workspace", labelKm: "ផ្ទាំងការងារ" },
  { sectionId: "candidates", path: "/recruiter/candidates", labelEn: "Candidate ATS", labelKm: "បេក្ខជន ATS" },
  { sectionId: "my-posts", path: "/my-posts", labelEn: "My Postings", labelKm: "ការងារដែលបានបង្ហោះ" },
  { sectionId: "forum", path: "/forum", labelEn: "Forum", labelKm: "ហ្វូរ៉ុម" },
];

const mentorNavItems = [
  { sectionId: "dashboard", path: "/dashboard", labelEn: "Workspace", labelKm: "ផ្ទាំងការងារ" },
  { sectionId: "mentorship", path: "/mentorship", labelEn: "Mentorship", labelKm: "ការណែនាំ 1:1" },
  { sectionId: "sessions", path: "/sessions", labelEn: "Live Sessions", labelKm: "ថ្នាក់បង្រៀន Live" },
  { sectionId: "courses", path: "/courses", labelEn: "Courses", labelKm: "វគ្គសិក្សា" },
  { sectionId: "forum", path: "/forum", labelEn: "Forum", labelKm: "ហ្វូរ៉ុម" },
];

const adminNavItems = [
  { sectionId: "dashboard", path: "/dashboard", labelEn: "Workspace", labelKm: "ផ្ទាំងការងារ" },
  { sectionId: "admin", path: "/admin", labelEn: "Admin Panel", labelKm: "ផ្ទាំងគ្រប់គ្រង" },
  { sectionId: "analytics", path: "/analytics", labelEn: "Analytics", labelKm: "ស្ថិតិទូទៅ" },
  { sectionId: "courses", path: "/courses", labelEn: "Courses", labelKm: "វគ្គសិក្សា" },
  { sectionId: "forum", path: "/forum", labelEn: "Forum", labelKm: "ហ្វូរ៉ុម" },
];

export default function Navbar() {
  const { user, logout } = useGlobleContext();
  const { language, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = useMemo(() => {
    if (!user) return defaultNavItems;
    if (user.role === "recruiter") return recruiterNavItems;
    if (user.role === "mentor") return mentorNavItems;
    if (user.role === "admin") return adminNavItems;
    return defaultNavItems;
  }, [user]);

  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetchNotifications()
      .then((list) => {
        if (!active) return;
        const unreadCount = (list || []).filter((n) => !n.isRead).length;
        setUnreadNotifications(unreadCount);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    const handleNotification = () => {
      fetchNotifications()
        .then((list) => {
          const unreadCount = (list || []).filter((n) => !n.isRead).length;
          setUnreadNotifications(unreadCount);
        })
        .catch(() => {});
    };

    socket.on("notification:new", handleNotification);
    return () => {
      socket.off("notification:new", handleNotification);
    };
  }, [user]);

  const toggleLanguage = () => {
    const nextLang = language === "km" ? "en" : "km";
    setLanguage(nextLang);
  };

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  };

  return (
    <header className="nav-glass-header glass" id="nav">
      <Link to="/" className="nav-glass-logo" aria-label="Smart Community">
        <img
          src={logo}
          alt=""
          className="nav-logo-icon"
          aria-hidden="true"
          style={{ width: "26px", height: "26px", objectFit: "contain" }}
        />
        <span>
          Smart <span className="logo-accent">Community</span>
        </span>
      </Link>

      <nav className="nav-glass-links" id="navLinks">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.sectionId}
              to={item.path}
              className={`nav-item-link ${isActive ? "on" : ""}`}
            >
              {language === "km" ? item.labelKm : item.labelEn}
            </Link>
          );
        })}
      </nav>

      <div className="nav-glass-actions" id="navAct">
        {/* Spotlight Quick Search Button */}
        <button
          type="button"
          className="icon-btn nav-search-trigger"
          onClick={handleOpenSearch}
          aria-label={language === "km" ? "ស្វែងរក (⌘K)" : "Search (⌘K)"}
          title={language === "km" ? "ស្វែងរក (⌘K)" : "Search (⌘K)"}
        >
          <FiSearch className="nav-glyph" aria-hidden="true" />
          <span className="nav-search-shortcut">⌘K</span>
        </button>

        {user && (
          <Link
            to="/notifications"
            className="icon-btn"
            aria-label={t("nav.notifications") || "Notifications"}
            title="Notifications"
          >
            <FiBell className="nav-glyph" aria-hidden="true" />
            {unreadNotifications > 0 && (
              <span className="badge-dot">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            )}
          </Link>
        )}

        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Light mode" : "Dark mode"}
        >
          <span className="nav-glyph-wrap" aria-hidden="true">
            {isDark ? <FiSun /> : <FiMoon />}
          </span>
        </button>

        <button
          type="button"
          className="icon-btn lang-toggle-btn"
          onClick={toggleLanguage}
          aria-label="Toggle language"
          title="Toggle language"
        >
          {language === "km" ? "EN" : "ខ្មែរ"}
        </button>

        {user ? (
          <div className="nav-acct-wrap">
            <NavProfile user={user} onLogout={logout} />
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary btn-sm">
            {t("nav.signIn") || (language === "km" ? "ចូលគណនី" : "Sign in")}
          </Link>
        )}
      </div>
    </header>
  );
}

