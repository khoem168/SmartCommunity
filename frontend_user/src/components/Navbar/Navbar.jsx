import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiSearch,
  FiBell,
  FiSun,
  FiMoon,
  FiMenu,
  FiGlobe,
} from "react-icons/fi";
import logo from "../../assets/logo/logo-mark.png";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { NavProfile } from "./NavProfile";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
} from "../../services/notificationService";
import { getSocket } from "../../services/realtimeService";
import { getHybridNav } from "./navPillars";
import MoreDropdown from "./MoreDropdown";
import MobileNavDrawer from "./MobileNavDrawer";
import "./navbar.css";

export default function Navbar() {
  const { user, logout } = useGlobleContext();
  const { language, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Dynamic role-aware hybrid navigation (Student, Mentor, Recruiter, Admin)
  const nav = useMemo(() => getHybridNav(user), [user]);

  // Notification badge polling and realtime socket
  useEffect(() => {
    if (!user) {
      setUnreadNotifications(0);
      return;
    }
    let active = true;

    const refreshBadge = (forcedCount) => {
      if (typeof forcedCount === "number") {
        setUnreadNotifications(Math.max(0, Math.floor(forcedCount)));
        return;
      }
      fetchUnreadNotificationCount()
        .then((count) => {
          if (!active) return;
          setUnreadNotifications(Math.max(0, Number(count) || 0));
        })
        .catch(() => {});
    };

    refreshBadge();

    const handleUpdate = (e) => {
      if (e?.detail && typeof e.detail.unread === "number") {
        refreshBadge(e.detail.unread);
      } else {
        refreshBadge();
      }
    };
    const handleFocus = () => refreshBadge();

    window.addEventListener("nav-badges:update", handleUpdate);
    window.addEventListener("focus", handleFocus);

    return () => {
      active = false;
      window.removeEventListener("nav-badges:update", handleUpdate);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user, location.pathname]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    const handleNotification = () => {
      fetchUnreadNotificationCount()
        .then((count) => {
          setUnreadNotifications(count);
        })
        .catch(() => {});
    };

    const handleCount = (data) => {
      if (typeof data?.unread === "number") {
        setUnreadNotifications(Math.max(0, data.unread));
      } else {
        handleNotification();
      }
    };

    socket.on("notification:new", handleNotification);
    socket.on("notification:count", handleCount);
    return () => {
      socket.off("notification:new", handleNotification);
      socket.off("notification:count", handleCount);
    };
  }, [user]);

  // Listen to open-mobile-drawer event (e.g. triggered from mobile bottom TabBar)
  useEffect(() => {
    const handleOpenDrawer = () => setIsMobileMenuOpen(true);
    window.addEventListener("open-mobile-drawer", handleOpenDrawer);
    return () => {
      window.removeEventListener("open-mobile-drawer", handleOpenDrawer);
    };
  }, []);

  const toggleLanguage = () => {
    const nextLang = language === "km" ? "en" : "km";
    setLanguage(nextLang);
  };

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  };

  return (
    <>
      <header className="nav-glass-header glass" id="nav">
        {/* Brand / Logo */}
        <Link to="/" className="nav-glass-logo" aria-label="Smart Community">
          <img
            src={logo}
            alt=""
            className="nav-logo-icon"
            aria-hidden="true"
          />
          <span>
            Smart <span className="logo-accent">Community</span>
          </span>
        </Link>

        {/* Desktop Premium Hybrid Navigation: 1-Click Direct Links + More Dropdown + Workspace Pill */}
        <nav
          className="nav-glass-links"
          id="navLinks"
          role="navigation"
          aria-label="Main Navigation"
        >
          {/* Direct 1-Click Main Navigation Links */}
          {nav.directLinks.map((link) => {
            const isActive =
              link.path === "/"
                ? location.pathname === "/"
                : link.path === "/skill-exchange"
                  ? ["/skill-exchange", "/exchange", "/discover", "/community", "/skill-requests"].some((p) =>
                      location.pathname.startsWith(p)
                    )
                  : location.pathname.startsWith(link.path);
            const LinkIcon = link.icon;

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-item-link ${isActive ? "on" : ""}`}
              >
                {LinkIcon && <LinkIcon className="nav-item-icon" aria-hidden="true" />}
                <span>{language === "km" ? link.labelKm : link.labelEn}</span>
              </Link>
            );
          })}

          {/* Secondary Tools "More" Menu */}
          {nav.moreItems && nav.moreItems.length > 0 && (
            <MoreDropdown items={nav.moreItems} language={language} />
          )}
        </nav>

        {/* Global Utility Actions & Account Zone */}
        <div className="nav-glass-actions" id="navAct">
          <div className="nav-utility-cluster">
            {/* Spotlight Quick Search Pill Button */}
            <button
              type="button"
              className="icon-btn nav-action-btn nav-search-pill-btn"
              onClick={handleOpenSearch}
              aria-label={language === "km" ? "ស្វែងរក (⌘K)" : "Search (⌘K)"}
              title={language === "km" ? "ស្វែងរក (⌘K)" : "Search (⌘K)"}
            >
              <FiSearch className="nav-glyph" aria-hidden="true" />
              <span className="nav-search-pill-label">
                {language === "km" ? "ស្វែងរក..." : "Search..."}
              </span>
            </button>

            {/* Notifications */}
            {user && (
              <Link
                to="/notifications"
                className="icon-btn nav-action-btn"
                aria-label={t("nav.notifications") || "Notifications"}
                title={language === "km" ? "ការជូនដំណឹង" : "Notifications"}
              >
                <FiBell className="nav-glyph" aria-hidden="true" />
                {unreadNotifications > 0 && (
                  <span className="badge-dot">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </Link>
            )}

            {/* Theme Mode Toggle */}
            <button
              type="button"
              className="icon-btn nav-action-btn theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Light mode" : "Dark mode"}
            >
              <span className="nav-glyph-wrap" aria-hidden="true">
                {isDark ? <FiSun /> : <FiMoon />}
              </span>
            </button>

            {/* Bilingual Language Switcher */}
            <button
              type="button"
              className="icon-btn nav-action-btn lang-toggle-btn"
              onClick={toggleLanguage}
              aria-label="Toggle language"
              title={language === "km" ? "Switch to English" : "ប្តូរទៅភាសាខ្មែរ"}
            >
              <FiGlobe className="lang-globe-icon" aria-hidden="true" />
              <span>{language === "km" ? "EN" : "ខ្មែរ"}</span>
            </button>
          </div>

          <span className="nav-actions-divider" aria-hidden="true" />

          {/* Compact User Profile Dropdown or Guest Auth Pills */}
          {user ? (
            <div className="nav-acct-wrap">
              <NavProfile user={user} onLogout={logout} />
            </div>
          ) : (
            <div className="nav-guest-auth-group">
              <Link to="/login" className="nav-login-pill">
                {language === "km" ? "ចូលគណនី" : "Sign in"}
              </Link>
              <Link to="/register" className="nav-signin-cta">
                {language === "km" ? "ចុះឈ្មោះ" : "Get Started"}
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger Toggle */}
          <button
            type="button"
            className="icon-btn nav-action-btn nav-mobile-toggle-btn"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            <FiMenu className="nav-glyph" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile Touch Drawer with Full Navigation */}
      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        pillars={nav.drawerSections}
        workspace={nav.workspace}
        user={user}
        onLogout={logout}
        language={language}
        onToggleLanguage={toggleLanguage}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        unreadNotifications={unreadNotifications}
      />
    </>
  );
}
