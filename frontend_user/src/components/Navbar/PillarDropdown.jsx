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
  const triggerRef = useRef(null);
  const location = useLocation();
  const isKm = language === "km";

  // Check if any link in this pillar is currently active
  const isPillarActive = pillar.items.some((item) => {
    if (item.path === "/") return location.pathname === "/";
    return location.pathname.startsWith(item.path);
  });

  // Handle escape key and click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        if (triggerRef.current) triggerRef.current.focus();
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

  return (
    <div
      ref={dropdownRef}
      className={`nav-pillar-wrapper ${isOpen ? "open" : ""}`}
      onMouseEnter={() => {
        // Desktop gentle hover expansion
        if (window.innerWidth > 1040) {
          onToggle(true);
        }
      }}
      onMouseLeave={() => {
        if (window.innerWidth > 1040) {
          onToggle(false);
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`nav-pillar-trigger ${isPillarActive ? "active" : ""} ${
          isOpen ? "expanded" : ""
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => onToggle(!isOpen)}
        aria-label={`${isKm ? pillar.labelKm : pillar.labelEn} menu`}
      >
        <span className="pillar-trigger-label">
          {isKm ? pillar.labelKm : pillar.labelEn}
        </span>
        <FiChevronDown
          className={`pillar-chevron ${isOpen ? "rotated" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className="pillar-dropdown-card"
          role="menu"
          aria-label={isKm ? pillar.labelKm : pillar.labelEn}
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
            {pillar.items.map((item) => {
              const Icon = item.icon;
              const isItemActive =
                item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`pillar-menu-item ${isItemActive ? "current" : ""}`}
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
