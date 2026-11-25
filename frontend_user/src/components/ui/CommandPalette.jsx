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
  FiFileText,
  FiRepeat,
  FiGrid,
  FiUser,
  FiSend,
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

  // Focus input when opened and always restore body scroll on cleanup
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      document.body.style.overflow = "hidden";
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    }
    document.body.style.overflow = "";
    return undefined;
  }, [isOpen]);

  // All searchable commands and items
  const items = useMemo(() => {
    const baseItems = [
      // Navigation Pages
      {
        id: "nav-home",
        category: isKm ? "ទំព័រ" : "Navigation",
        title: isKm ? "ទំព័រដើម" : "Home",
        subtitle: isKm ? "ទៅកាន់ទំព័រដើម Smart Community" : "Go to Smart Community homepage",
        keywords: "home landing start index",
        icon: FiHome,
        action: () => navigate("/"),
      },
      {
        id: "nav-courses",
        category: isKm ? "ទំព័រ" : "Navigation",
        title: isKm ? "វគ្គសិក្សាទាំងអស់" : "Browse Courses",
        subtitle: isKm
          ? "ស្វែងរកវគ្គសិក្សា ២០+ ជាមួយឯកសារមេរៀន PDF ឥតគិតថ្លៃ និងវីដេអូពេញលេញ $12"
          : "Explore 20+ courses with Free PDF guides & $12 Full Access",
        keywords: "courses learn study video pdf react node python",
        icon: FiBookOpen,
        action: () => navigate("/courses"),
      },
      {
        id: "nav-cv-studio",
        category: isKm ? "ទំព័រ" : "Navigation",
        title: isKm ? "បង្កើត PDF CV ឥតគិតថ្លៃ" : "Free CV Builder (PDF Studio)",
        subtitle: isKm
          ? "ជ្រើសរើស ៤ ទម្រង់ CV ស្អាតៗ មើលផ្ទាល់ និងទាញយក PDF ឥតគិតថ្លៃ ១០០%"
          : "4 ATS templates, live A4 preview & 100% Free PDF download",
        keywords: "cv resume pdf ats studio builder",
        icon: FiFileText,
        action: () => navigate("/cv-studio"),
      },
      {
        id: "nav-mentors",
        category: isKm ? "ទំព័រ" : "Navigation",
        title: isKm ? "អ្នកណែនាំជំនាញ 1:1" : "Find 1:1 Mentors",
        subtitle: isKm ? "កក់ម៉ោងពិភាក្សា 1:1 តាម Jitsi Meet" : "Book 1:1 sessions with verified mentors",
        keywords: "mentor mentorship coaching booking jitsi",
        icon: FiUsers,
        action: () => navigate("/mentorship"),
      },
      {
        id: "nav-career",
        category: isKm ? "ទំព័រ" : "Navigation",
        title: isKm ? "ផែនទីផ្លូវអាជីព" : "Career Roadmaps",
        subtitle: isKm ? "ស្ទង់កម្រិតជំនាញ និងដំណាក់កាលអភិវឌ្ឍន៍អាជីព" : "Assess readiness & roadmap milestones",
        keywords: "career roadmap track path skills",
        icon: FiCompass,
        action: () => navigate("/career"),
      },
      {
        id: "nav-jobs",
        category: isKm ? "ទំព័រ" : "Navigation",
        title: isKm ? "កម្មសិក្សា និងការងារ" : "Internships & Jobs",
        subtitle: isKm ? "ឱកាសកម្មសិក្សានិងការងារ IT នៅកម្ពុជា" : "Verified tech internships in Cambodia",
        keywords: "jobs internship hiring apply career",
        icon: FiBriefcase,
        action: () => navigate("/jobs"),
      },
      {
        id: "nav-forum",
        category: isKm ? "ទំព័រ" : "Navigation",
        title: isKm ? "សហគមន៍ និងហ្វូរ៉ុម" : "Community Social Feed",
        subtitle: isKm
          ? "មើលការបង្ហោះ រូបភាព វីដេអូខ្លី និងចែករំលែកចំណេះដឹង IT"
          : "Social posts, photos, short videos & tech discussions",
        keywords: "forum community feed posts questions discussions",
        icon: FiMessageSquare,
        action: () => navigate("/forum"),
      },
      {
        id: "nav-discover",
        category: isKm ? "ទំព័រ" : "Navigation",
        title: isKm ? "ផ្លាស់ប្តូរជំនាញគ្នា" : "Peer Skill Exchange",
        subtitle: isKm
          ? "ស្វែងរកដៃគូរៀន និងផ្លាស់ប្តូរជំនាញគ្នាទៅវិញទៅមកដោយឥតគិតថ្លៃ"
          : "Swap skills 1:1 with peers for free",
        keywords: "skill exchange swap peer match discover",
        icon: FiRepeat,
        action: () => navigate("/skill-exchange"),
      },
    ];

    if (user) {
      baseItems.push(
        {
          id: "nav-dashboard",
          category: isKm ? "គណនីខ្ញុំ" : "My Workspace",
          title: isKm ? "ផ្ទាំងគ្រប់គ្រងការសិក្សា" : "Workspace Dashboard",
          subtitle: isKm
            ? "តាមដានវគ្គសិក្សា ពាក្យស្នើសុំកម្មសិក្សា និងសមិទ្ធផល"
            : "Track enrolled courses, applications & milestones",
          keywords: "dashboard workspace overview",
          icon: FiGrid,
          action: () => navigate("/dashboard"),
        },
        {
          id: "nav-messages",
          category: isKm ? "គណនីខ្ញុំ" : "My Workspace",
          title: isKm ? "សារជជែកផ្ទាល់" : "Messages",
          subtitle: isKm ? "ឆ្លើយតបសារជាមួយដៃគូជំនាញ និងអ្នកណែនាំ" : "Chat with mentors & skill partners",
          keywords: "messages chat inbox dm",
          icon: FiSend,
          action: () => navigate("/messages"),
        },
        {
          id: "nav-profile",
          category: isKm ? "គណនីខ្ញុំ" : "My Workspace",
          title: isKm ? "ប្រវត្តិរូបរបស់ខ្ញុំ" : "My Profile",
          subtitle: isKm ? "កែសម្រួលជំនាញ ស្នាដៃ និងព័ត៌មានផ្ទាល់ខ្លួន" : "Edit skills, portfolio & personal bio",
          keywords: "profile account bio settings",
          icon: FiUser,
          action: () => navigate("/profile"),
        },
      );
    }

    return [
      ...baseItems,
      // Featured Courses
      {
        id: "course-web",
        category: isKm ? "វគ្គសិក្សាពេញនិយម" : "Featured Courses",
        title: isKm ? "ការអភិវឌ្ឍគេហទំព័រ Full-Stack" : "Full-Stack Web Development",
        subtitle: "React 19, Node.js, Express & MongoDB · Free PDF / $12.00",
        keywords: "web react node fullstack javascript",
        icon: FiBookOpen,
        action: () => navigate("/courses?search=Web"),
      },
      {
        id: "course-uiux",
        category: isKm ? "វគ្គសិក្សាពេញនិយម" : "Featured Courses",
        title: isKm ? "ការរចនា UX/UI Design" : "UX/UI Design Essentials",
        subtitle: "Figma, Design Systems & Prototyping · Free PDF / $12.00",
        keywords: "design figma ui ux prototype",
        icon: FiBookOpen,
        action: () => navigate("/courses?search=Design"),
      },
      {
        id: "course-python",
        category: isKm ? "វគ្គសិក្សាពេញនិយម" : "Featured Courses",
        title: "Python & AI Engineering",
        subtitle: "Machine Learning, LLM APIs & Automation · Free PDF / $12.00",
        keywords: "python ai ml data science",
        icon: FiBookOpen,
        action: () => navigate("/courses?search=Python"),
      },

      // Mentors
      {
        id: "mentor-muy",
        category: isKm ? "អ្នកណែនាំ" : "Verified Mentors",
        title: "Muy Kalin",
        subtitle: isKm ? "អ្នកណែនាំ Full-Stack & Cloud Architecture" : "Full-Stack & Cloud Architecture Mentor",
        keywords: "mentor muy kalin fullstack cloud",
        icon: FiUsers,
        action: () => navigate("/mentorship?search=Muy"),
      },
      {
        id: "mentor-sophea",
        category: isKm ? "អ្នកណែនាំ" : "Verified Mentors",
        title: "Sophea Chan",
        subtitle: isKm ? "អ្នកណែនាំ UI/UX & Design Thinking" : "UI/UX & Design Thinking Mentor",
        keywords: "mentor sophea chan ui ux design",
        icon: FiUsers,
        action: () => navigate("/mentorship?search=Sophea"),
      },
      {
        id: "mentor-heang",
        category: isKm ? "អ្នកណែនាំ" : "Verified Mentors",
        title: "Heang Chheng Khoem",
        subtitle: isKm ? "អ្នកណែនាំ Backend & System Scalability" : "Backend & System Scalability Mentor",
        keywords: "mentor heang chheng khoem backend architecture",
        icon: FiUsers,
        action: () => navigate("/mentorship?search=Heang"),
      },

      // Quick Actions
      {
        id: "action-theme",
        category: isKm ? "សកម្មភាពរហ័ស" : "Quick Actions",
        title: isDark
          ? (isKm ? "ប្តូរទៅផ្ទៃភ្លឺ (Light Mode)" : "Switch to Light Mode")
          : (isKm ? "ប្តូរទៅផ្ទៃងងឹត (Dark Mode)" : "Switch to Dark Mode"),
        subtitle: isKm ? "កែសម្រួលរូបរាងផ្ទាំងបង្ហាញភ្លាមៗ" : "Toggle visual color theme",
        keywords: "theme dark light mode appearance",
        icon: isDark ? FiSun : FiMoon,
        action: () => toggleTheme(),
      },
      {
        id: "action-lang",
        category: isKm ? "សកម្មភាពរហ័ស" : "Quick Actions",
        title: language === "km" ? "ប្តូរភាសាទៅជា English" : "Switch language to Khmer (ភាសាខ្មែរ)",
        subtitle: isKm ? "ផ្លាស់ប្តូរភាសាប្រព័ន្ធ KH / EN" : "Toggle platform language KH / EN",
        keywords: "language khmer english translate km en",
        icon: FiGlobe,
        action: () => setLanguage(language === "km" ? "en" : "km"),
      },
    ];
  }, [isKm, isDark, language, user, navigate, setLanguage, toggleTheme]);

  // Filter items based on user query + dynamic global search action
  const filteredItems = useMemo(() => {
    const trimmed = query.trim();
    const q = trimmed.toLowerCase();
    if (!q) return items;

    const globalSearchAction = {
      id: "search-global-action",
      category: isKm ? "ស្វែងរកទូទាំងវេទិកា" : "Global Search",
      title: isKm ? `ស្វែងរក "${trimmed}" លើ Smart Community` : `Search platform for "${trimmed}"`,
      subtitle: isKm ? "ស្វែងរកវគ្គសិក្សា អ្នកណែនាំ ការងារ ជំនាញ និងសហគមន៍" : "Explore Courses, Mentors, Jobs, Skills & Community",
      icon: FiSearch,
      action: () => navigate(`/search?q=${encodeURIComponent(trimmed)}&type=all`),
    };

    const matched = items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.keywords && item.keywords.toLowerCase().includes(q))
    );

    return [globalSearchAction, ...matched];
  }, [items, query, isKm, navigate]);

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
      } else if (query.trim()) {
        navigate(`/search?q=${encodeURIComponent(query.trim())}&type=all`);
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
