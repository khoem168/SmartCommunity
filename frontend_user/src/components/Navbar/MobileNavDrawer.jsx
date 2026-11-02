import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiX,
  FiChevronDown,
  FiLayout,
  FiSun,
  FiMoon,
  FiLogOut,
  FiUser,
  FiArrowRight,
} from "react-icons/fi";
import logo from "../../assets/logo/logo1.png";
import UserAvatar from "../ui/UserAvatar";

export default function MobileNavDrawer({
  isOpen,
  onClose,
  pillars,
  workspace,
  user,
  onLogout,
  language,
  onToggleLanguage,
  isDark,
  onToggleTheme,
}) {
  const location = useLocation();
  const isKm = language === "km";
  // Open the first pillar by default on mobile
  const [expandedPillarId, setExpandedPillarId] = useState(
    pillars[0]?.id || "learning",
  );

  // Close drawer on route change
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll when drawer is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="mobile-drawer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      onClick={onClose}
    >
      <div
        className="mobile-drawer-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="mobile-drawer-header">
          <Link to="/" className="nav-glass-logo" onClick={onClose}>
            <img
              src={logo}
              alt=""
              className="nav-logo-icon"
            />
            <span>
              Smart <span className="logo-accent">Community</span>
            </span>
          </Link>

          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <FiX />
          </button>
        </div>

        {/* User Status / Workspace Shortcut */}
        <div className="drawer-user-section">
          {user ? (
            <div className="drawer-profile-box">
              <UserAvatar user={user} className="drawer-avatar" />
              <div className="drawer-profile-info">
                <strong>{user.fullName || user.email}</strong>
                <span className="drawer-role-tag">
                  {isKm
                    ? user.role === "recruiter"
                      ? "អ្នកជ្រើសរើស"
                      : user.role === "mentor"
                        ? "គ្រូណែនាំ"
                        : user.role === "admin"
                          ? "អ្នកគ្រប់គ្រង"
                          : "សិស្ស / សមាជិក"
                    : user.role?.toUpperCase()}
                </span>
              </div>
            </div>
          ) : (
            <div className="drawer-guest-box">
              <p>
                {isKm
                  ? "សូមស្វាគមន៍មកកាន់ Smart Community"
                  : "Welcome to Smart Community"}
              </p>
              <div className="drawer-guest-actions">
                <Link
                  to="/login"
                  className="btn btn-primary btn-sm"
                  onClick={onClose}
                >
                  {isKm ? "ចូលគណនី" : "Sign in"}
                </Link>
                <Link
                  to="/register"
                  className="btn btn-outline btn-sm"
                  onClick={onClose}
                >
                  {isKm ? "ចុះឈ្មោះ" : "Register"}
                </Link>
              </div>
            </div>
          )}

          <Link
            to={workspace.path}
            className="drawer-workspace-btn"
            onClick={onClose}
          >
            <FiLayout className="workspace-icon" />
            <span>{isKm ? workspace.labelKm : workspace.labelEn}</span>
            <FiArrowRight className="workspace-arrow" />
          </Link>
        </div>

        {/* Accordion Pillars */}
        <div className="drawer-pillars-list">
          {pillars.map((pillar) => {
            const isExpanded = expandedPillarId === pillar.id;

            return (
              <div
                key={pillar.id}
                className={`drawer-pillar-group ${isExpanded ? "open" : ""}`}
              >
                <button
                  type="button"
                  className="drawer-pillar-header"
                  onClick={() =>
                    setExpandedPillarId((curr) =>
                      curr === pillar.id ? null : pillar.id,
                    )
                  }
                  aria-expanded={isExpanded}
                >
                  <div className="drawer-pillar-title-wrap">
                    <span className="drawer-pillar-num">
                      {pillar.pillarNumber || "•"}
                    </span>
                    <strong>{isKm ? pillar.labelKm : pillar.labelEn}</strong>
                  </div>
                  <FiChevronDown
                    className={`drawer-chevron ${isExpanded ? "rotated" : ""}`}
                  />
                </button>

                {isExpanded && (
                  <div className="drawer-pillar-links">
                    {pillar.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        item.path === "/"
                          ? location.pathname === "/"
                          : location.pathname.startsWith(item.path);

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`drawer-item-link ${
                            isActive ? "active" : ""
                          }`}
                          onClick={onClose}
                        >
                          <div
                            className={`drawer-item-icon ${
                              item.color || "blue"
                            }`}
                          >
                            <Icon />
                          </div>
                          <div className="drawer-item-copy">
                            <span className="drawer-item-name">
                              {isKm ? item.labelKm : item.labelEn}
                            </span>
                            <small className="drawer-item-desc">
                              {isKm ? item.descKm : item.descEn}
                            </small>
                          </div>
                          {isActive && <span className="drawer-active-dot" />}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Quick Controls */}
        <div className="mobile-drawer-footer">
          <button
            type="button"
            className="drawer-footer-btn"
            onClick={onToggleLanguage}
          >
            <span>{language === "km" ? "🇰🇭 ភាសាខ្មែរ" : "🇬🇧 English"}</span>
            <small>{language === "km" ? "ប្តូរ EN" : "Switch KM"}</small>
          </button>

          <button
            type="button"
            className="drawer-footer-btn"
            onClick={onToggleTheme}
          >
            {isDark ? <FiSun /> : <FiMoon />}
            <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>

          {user && (
            <div className="drawer-auth-links">
              <Link
                to="/profile"
                className="drawer-auth-item"
                onClick={onClose}
              >
                <FiUser /> {isKm ? "ប្រវត្តិរូប" : "Profile"}
              </Link>
              <button
                type="button"
                className="drawer-auth-item logout"
                onClick={() => {
                  onClose();
                  if (onLogout) onLogout();
                }}
              >
                <FiLogOut /> {isKm ? "ចាកចេញ" : "Log out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
