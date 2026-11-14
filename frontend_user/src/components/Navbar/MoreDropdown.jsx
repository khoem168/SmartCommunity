import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiChevronDown, FiArrowRight, FiMoreHorizontal } from "react-icons/fi";

export default function MoreDropdown({ items = [], language }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const isKm = language === "km";
  const timerRef = useRef(null);

  // Check if any item in More is currently the active page
  const isMoreActive = items.some((item) => {
    if (item.path === "/") return location.pathname === "/";
    return location.pathname.startsWith(item.path);
  });

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (window.innerWidth > 1040) {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 180);
  };

  // Close when path changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Handle escape key and click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <div
      ref={dropdownRef}
      className={`nav-more-wrapper ${isOpen ? "open" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className={`nav-item-link nav-more-trigger ${
          isMoreActive ? "on" : ""
        } ${isOpen ? "expanded" : ""}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isKm ? "មុខងារផ្សេងៗ (More)" : "More options"}
      >
        <FiMoreHorizontal className="nav-item-icon" aria-hidden="true" />
        <span>{isKm ? "ផ្សេងៗ" : "More"}</span>
        <FiChevronDown
          className={`more-chevron ${isOpen ? "rotated" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className="more-dropdown-card"
          role="menu"
          aria-label={isKm ? "មុខងារផ្សេងៗ" : "More features"}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="more-dropdown-header">
            <span className="more-header-badge">
              {isKm ? "បន្ថែម" : "Features"}
            </span>
            <p className="more-tagline">
              {isKm
                ? "ឧបករណ៍ និងមុខងារជំនួយបន្ថែម"
                : "Additional tools and resources"}
            </p>
          </div>

          <div className="more-items-grid">
            {items.map((item) => {
              const Icon = item.icon;
              const isItemActive =
                item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`more-menu-item ${isItemActive ? "current" : ""}`}
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                >
                  {Icon && (
                    <div
                      className={`more-icon-box ${item.color || "blue"}`}
                      aria-hidden="true"
                    >
                      <Icon />
                    </div>
                  )}
                  <div className="more-item-text">
                    <div className="more-item-title-row">
                      <strong className="more-item-title">
                        {isKm ? item.labelKm : item.labelEn}
                      </strong>
                      {isItemActive && (
                        <span
                          className="more-active-dot"
                          title="Current page"
                        />
                      )}
                    </div>
                    {item.descEn && (
                      <span className="more-item-desc">
                        {isKm ? item.descKm : item.descEn}
                      </span>
                    )}
                  </div>
                  <FiArrowRight
                    className="more-item-arrow"
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
