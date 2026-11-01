import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiX,
  FiBookOpen,
  FiUsers,
  FiCompass,
  FiBriefcase,
  FiMessageSquare,
  FiHome,
  FiSun,
  FiMoon,
  FiGlobe,
  FiArrowRight,
  FiCornerDownLeft,
  FiLayers,
} from "react-icons/fi";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { useGlobleContext } from "../../context/GlobleContext";
import "./CommandPalette.css";

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useGlobleContext();

  const isKm = language === "km";

  // Global keydown listener for ⌘K / Ctrl+K and Esc
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleCustomOpen);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  // All searchable commands and items
  const items = useMemo(() => {
    return [
      // Navigation Pages
      {
        id: "nav-home",
        category: isKm ? "ទំព័រ" : "Navigation",
        title: isKm ? "ទំព័រដើម (Home)" : "Home",
        subtitle: isKm ? "ទៅកាន់ទំព័រដើម Smart Community" : "Go to Smart Community homepage",
        icon: FiHome,
        action: () => navigate("/"),
      },
      {
        id: "nav-courses",
        category: isKm ? "ទំព័រ" : "Navigation",
        title: isKm ? "វគ្គសិក្សាទាំងអស់ (Courses)" : "Browse Courses",
        subtitle: isKm ? "ស្វែងរកវគ្គសិក្សា ៤៨+ ជាមួយ Bakong KHQR $15" : "Explore 48+ hands-on courses",
        icon: FiBookOpen,
        action: () => navigate("/courses"),
      },
      {
        id: "nav-mentors",
        category: isKm ? "ទំព័រ" : "Navigation",
        title: isKm ? "អ្នកណែនាំជំនាញ (Mentorship)" : "Find Mentors",
        subtitle: isKm ? "កក់ម៉ោងពិភាក្សា 1:1 តាម Jitsi Meet" : "Book 1:1 sessions with verified mentors",
        icon: FiUsers,
        action: () => navigate("/mentorship"),
      },
      {
        id: "nav-career",
        category: isKm ? "ទំព័រ" : "Navigation",
        title: isKm ? "ផែនទីផ្លូវអាជីព (Career Roadmap)" : "Career Roadmaps",
        subtitle: isKm ? "ស្ទង់កម្រិតជំនាញ និងដំណាក់កាលអភិវឌ្ឍន៍អាជីព" : "Assess readiness & roadmap milestones",
        icon: FiCompass,
        action: () => navigate("/career"),
      },
      {
        id: "nav-jobs",
        category: isKm ? "ទំព័រ" : "Navigation",
        title: isKm ? "កម្មសិក្សា & ការងារ (Internships)" : "Internships & Jobs",
        subtitle: isKm ? "ឱកាសកម្មសិក្សានិងការងារ IT នៅកម្ពុជា" : "Verified tech internships in Cambodia",
        icon: FiBriefcase,
        action: () => navigate("/jobs"),
      },
      {
        id: "nav-forum",
        category: isKm ? "ទំព័រ" : "Navigation",
        title: isKm ? "សហគមន៍ & ហ្វូរ៉ុម (Community Forum)" : "Community Forum",
        subtitle: isKm ? "សួរសំណួរ ចែករំលែកចំនេះដឹង IT" : "Ask questions and share tech knowledge",
        icon: FiMessageSquare,
        action: () => navigate("/forum"),
      },
      {
        id: "nav-discover",
        category: isKm ? "ទំព័រ" : "Navigation",
        title: isKm ? "ផ្លាស់ប្តូរជំនាញ (Skill Exchange)" : "Skill Exchange",
        subtitle: isKm ? "ស្វែងរកដៃគូរៀន និងផ្លាស់ប្តូរជំនាញគ្នាទៅវិញទៅមក" : "Find peer study partners",
        icon: FiLayers,
        action: () => navigate("/discover"),
      },

      // Featured Courses
      {
        id: "course-web",
        category: isKm ? "វគ្គសិក្សាពេញនិយម" : "Featured Courses",
        title: isKm ? "ការអភិវឌ្ឍគេហទំព័រ (Full-Stack Web)" : "Full-Stack Web Development",
        subtitle: "React 19, Node.js, Express & MongoDB • $15",
        icon: FiBookOpen,
        action: () => navigate("/courses?search=Web"),
      },
      {
        id: "course-uiux",
        category: isKm ? "វគ្គសិក្សាពេញនិយម" : "Featured Courses",
        title: isKm ? "ការរចនា UX/UI Design Essentials" : "UX/UI Design Essentials",
        subtitle: "Figma, Design Systems & Prototyping • Free",
        icon: FiBookOpen,
        action: () => navigate("/courses?search=Design"),
      },
      {
        id: "course-python",
        category: isKm ? "វគ្គសិក្សាពេញនិយម" : "Featured Courses",
        title: isKm ? "Python & AI Engineering" : "Python & AI Engineering",
        subtitle: "Machine Learning, LLM APIs & Automation • $15",
        icon: FiBookOpen,
        action: () => navigate("/courses?search=Python"),
      },

      // Mentors
      {
        id: "mentor-muy",
        category: isKm ? "អ្នកណែនាំ" : "Verified Mentors",
        title: "Muy Kalin",
        subtitle: isKm ? "អ្នកណែនាំ Full-Stack & Cloud Architecture" : "Full-Stack & Cloud Architecture Mentor",
        icon: FiUsers,
        action: () => navigate("/mentorship?search=Muy"),
      },
      {
        id: "mentor-sophea",
        category: isKm ? "អ្នកណែនាំ" : "Verified Mentors",
        title: "Sophea Chan",
        subtitle: isKm ? "អ្នកណែនាំ UI/UX & Design Thinking" : "UI/UX & Design Thinking Mentor",
        icon: FiUsers,
        action: () => navigate("/mentorship?search=Sophea"),
      },
      {
        id: "mentor-heang",
        category: isKm ? "អ្នកណែនាំ" : "Verified Mentors",
        title: "Heang Chheng Khoem",
        subtitle: isKm ? "អ្នកណែនាំ Backend & System Scalability" : "Backend & System Scalability Mentor",
        icon: FiUsers,
        action: () => navigate("/mentorship?search=Heang"),
      },

      // Quick Actions
      {
        id: "action-theme",
        category: isKm ? "សកម្មភាពរហ័ស" : "Quick Actions",
        title: isDark
          ? (isKm ? "ប្តូរទៅ Light Mode ☀️" : "Switch to Light Mode ☀️")
          : (isKm ? "ប្តូរទៅ Dark Mode 🌙" : "Switch to Dark Mode 🌙"),
        subtitle: isKm ? "កែសម្រួលរូបរាងផ្ទាំងបង្ហាញ" : "Toggle visual theme",
        icon: isDark ? FiSun : FiMoon,
        action: () => toggleTheme(),
      },
      {
        id: "action-lang",
        category: isKm ? "សកម្មភាពរហ័ស" : "Quick Actions",
        title: language === "km" ? "Switch language to English 🇬🇧" : "ប្តូរភាសាទៅជា ភាសាខ្មែរ 🇰🇭",
        subtitle: isKm ? "ផ្លាស់ប្តូរភាសាប្រព័ន្ធ" : "Toggle platform language",
        icon: FiGlobe,
        action: () => setLanguage(language === "km" ? "en" : "km"),
      },
    ];
  }, [isKm, isDark, language, navigate, setLanguage, toggleTheme]);

  // Filter items based on user query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [items, query]);

  // Handle keyboard navigation inside the list
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredItems.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredItems.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        setIsOpen(false);
      }
    }
  };

  // Keep selected item visible in view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(".cmd-item.active");
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="cmd-backdrop glass"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div className="cmd-modal-card ios-glass-card">
        {/* Search Input Bar */}
        <div className="cmd-search-bar">
          <FiSearch className="cmd-search-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder={
              isKm
                ? "ស្វែងរកវគ្គសិក្សា, អ្នកណែនាំ, ទំព័រ ឬពាក្យបញ្ជា..."
                : "Search courses, mentors, pages, or actions..."
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          {query ? (
            <button
              type="button"
              className="cmd-clear-btn"
              onClick={() => setQuery("")}
              aria-label="Clear query"
            >
              <FiX />
            </button>
          ) : (
            <span className="cmd-esc-badge">ESC</span>
          )}
        </div>

        {/* Results List */}
        <div className="cmd-results-list" ref={listRef}>
          {filteredItems.length === 0 ? (
            <div className="cmd-empty-state">
              <p>{isKm ? "រកមិនឃើញលទ្ធផលត្រូវគ្នាទេ" : "No matching results found"}</p>
              <small>
                {isKm
                  ? "សាកល្បងស្វែងរក 'React', 'Mentor', 'Jobs' ឬ 'Theme'..."
                  : "Try searching 'React', 'Mentor', 'Jobs', or 'Theme'..."}
              </small>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`cmd-item ${isSelected ? "active" : ""}`}
                  onClick={() => {
                    item.action();
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="cmd-item-icon-box">
                    <Icon className="cmd-item-glyph" />
                  </div>
                  <div className="cmd-item-text">
                    <div className="cmd-item-header">
                      <span className="cmd-item-title">{item.title}</span>
                      <span className="cmd-item-category">{item.category}</span>
                    </div>
                    <span className="cmd-item-subtitle">{item.subtitle}</span>
                  </div>
                  <div className="cmd-item-enter">
                    <FiCornerDownLeft className="cmd-enter-icon" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="cmd-footer">
          <div className="cmd-footer-shortcuts">
            <span className="cmd-shortcut">
              <kbd className="cmd-kbd">↑</kbd>
              <kbd className="cmd-kbd">↓</kbd>
              <span>{isKm ? "រំកិល" : "Navigate"}</span>
            </span>
            <span className="cmd-shortcut">
              <kbd className="cmd-kbd">↵</kbd>
              <span>{isKm ? "ជ្រើសរើស" : "Select"}</span>
            </span>
            <span className="cmd-shortcut">
              <kbd className="cmd-kbd">ESC</kbd>
              <span>{isKm ? "បិទ" : "Close"}</span>
            </span>
          </div>
          <span className="cmd-brand-tag">Smart Community Spotlight</span>
        </div>
      </div>
    </div>
  );
}
