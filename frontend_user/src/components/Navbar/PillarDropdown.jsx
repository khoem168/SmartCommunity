import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiChevronDown, FiArrowRight } from "react-icons/fi";

export default function PillarDropdown({
  pillar,
  isOpen,
  onToggle,
  onClose,
  language,
}) {
  const dropdownRef = useRef(null);
  const location = useLocation();
  const isKm = language === "km";
  const timerRef = useRef(null);

  const subItems = pillar.subItems || [];
  const hasSubItems = subItems.length > 0;

  // Check if current route matches this item or any of its sub-items
  const isDirectActive = location.pathname.startsWith(pillar.primaryPath);
  const isSubActive = hasSubItems && subItems.some((sub) => {
    if (sub.path === "/") return location.pathname === "/";
    return location.pathname.startsWith(sub.path);
  });
  const isActive = isDirectActive || isSubActive;

  // Smooth hover handling without clicking
  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (hasSubItems && window.innerWidth > 1040) {
      onToggle(true);
    }
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onClose();
    }, 180);
  };

  // Keyboard navigation & click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      ref={dropdownRef}
      className={`nav-pillar-wrapper ${isOpen ? "open" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 1-CLICK DIRECT LINK TRIGGER */}
      <Link
        to={pillar.primaryPath}
        className={`nav-pillar-trigger ${isActive ? "active" : ""} ${
          isOpen ? "expanded" : ""
        }`}
        onClick={onClose}
        aria-label={isKm ? pillar.labelKm : pillar.labelEn}
      >
        <span className="pillar-trigger-label">
          {isKm ? pillar.labelKm : pillar.labelEn}
        </span>
        {hasSubItems && (
          <FiChevronDown
            className={`pillar-chevron ${isOpen ? "rotated" : ""}`}
            aria-hidden="true"
          />
        )}
      </Link>

      {/* ZERO-CLICK HOVER PREVIEW MENU */}
      {hasSubItems && isOpen && (
        <div
          className="pillar-dropdown-card"
          role="menu"
          aria-label={isKm ? pillar.labelKm : pillar.labelEn}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {pillar.taglineEn && (
            <div className="pillar-dropdown-header">
              <span className="pillar-index-badge">
                {pillar.pillarNumber || "•"}
              </span>
              <p className="pillar-tagline">
                {isKm ? pillar.taglineKm : pillar.taglineEn}
              </p>
            </div>
          )}

          <div className="pillar-items-grid">
            {subItems.map((item) => {
              const Icon = item.icon;
              const isItemActive =
                item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`pillar-menu-item ${
                    isItemActive ? "current" : ""
                  }`}
                  role="menuitem"
                  onClick={onClose}
                >
                  <div
                    className={`pillar-icon-box ${item.color || "blue"}`}
                    aria-hidden="true"
                  >
                    <Icon />
                  </div>
                  <div className="pillar-item-text">
                    <div className="pillar-item-title-row">
                      <strong className="pillar-item-title">
                        {isKm ? item.labelKm : item.labelEn}
                      </strong>
                      {isItemActive && (
                        <span
                          className="pillar-active-dot"
                          title="Current page"
                        />
                      )}
                    </div>
                    <span className="pillar-item-desc">
                      {isKm ? item.descKm : item.descEn}
                    </span>
                  </div>
                  <FiArrowRight
                    className="pillar-item-arrow"
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
