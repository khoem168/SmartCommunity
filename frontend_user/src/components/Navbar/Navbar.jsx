import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiSearch, FiBell, FiSun, FiMoon, FiMenu } from "react-icons/fi";
import logo from "../../assets/logo/logo1.png";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { NavProfile } from "./NavProfile";
import { fetchNotifications } from "../../services/notificationService";
import { getSocket } from "../../services/realtimeService";
import { getNavPillars, getWorkspaceInfo } from "./navPillars";
import PillarDropdown from "./PillarDropdown";
import MobileNavDrawer from "./MobileNavDrawer";
import "./navbar.css";

export default function Navbar() {
  const { user, logout } = useGlobleContext();
  const { language, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const [openPillarId, setOpenPillarId] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Dynamic role-aware pillars (Student, Mentor, Recruiter, Admin)
  const pillars = useMemo(() => getNavPillars(user), [user]);
  // Dynamic role-aware workspace info
  const workspace = useMemo(() => getWorkspaceInfo(user), [user]);

  // Close dropdown on location change
  useEffect(() => {
    setOpenPillarId(null);
  }, [location.pathname]);

  // Notification badge polling and realtime socket
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
    <>
      <header className="nav-glass-header glass" id="nav">
        {/* Brand / Logo */}
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

        {/* Desktop 3-Pillar Navigation + Workspace Action */}
        <nav
          className="nav-glass-links"
          id="navLinks"
          role="navigation"
          aria-label="Main Navigation"
        >
          {pillars.map((pillar) => (
            <PillarDropdown
              key={pillar.id}
              pillar={pillar}
              isOpen={openPillarId === pillar.id}
              onToggle={(open) => setOpenPillarId(open ? pillar.id : null)}
              onClose={() => setOpenPillarId(null)}
              language={language}
            />
          ))}

          {/* Direct Role Workspace Pill */}
          <Link
            to={workspace.path}
            className={`nav-workspace-pill ${
              location.pathname.startsWith(workspace.path) ? "active" : ""
            }`}
            title={language === "km" ? workspace.labelKm : workspace.labelEn}
          >
            <span className="workspace-pill-pulse" aria-hidden="true" />
            <span className="workspace-pill-label">
              {language === "km" ? workspace.labelKm : workspace.labelEn}
            </span>
            {workspace.badgeEn && (
              <span className="workspace-pill-badge">
                {language === "km" ? workspace.badgeKm : workspace.badgeEn}
              </span>
            )}
          </Link>
        </nav>

        {/* Global Utility Actions */}
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

          {/* Notifications */}
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

          {/* Theme Mode Toggle */}
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

          {/* Bilingual Language Switcher */}
          <button
            type="button"
            className="icon-btn lang-toggle-btn"
            onClick={toggleLanguage}
            aria-label="Toggle language"
            title="Toggle language"
          >
            {language === "km" ? "EN" : "ខ្មែរ"}
          </button>

          {/* User Profile Dropdown or Sign In */}
          {user ? (
            <div className="nav-acct-wrap">
              <NavProfile user={user} onLogout={logout} />
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              {t("nav.signIn") || (language === "km" ? "ចូលគណនី" : "Sign in")}
            </Link>
          )}

          {/* Mobile Menu Hamburger Toggle */}
          <button
            type="button"
            className="icon-btn nav-mobile-toggle-btn"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            <FiMenu className="nav-glyph" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile Touch Drawer */}
      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        pillars={pillars}
        workspace={workspace}
        user={user}
        onLogout={logout}
        language={language}
        onToggleLanguage={toggleLanguage}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />
    </>
  );
}

