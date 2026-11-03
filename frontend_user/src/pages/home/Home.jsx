import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiArrowRight,
  FiUsers,
  FiBookOpen,
  FiBriefcase,
  FiClock,
  FiMapPin,
  FiFileText,
  FiCheckCircle,
} from "react-icons/fi";
import { MdVerified } from "react-icons/md";

import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  fetchStats,
  fetchMentors,
  fetchInternships,
} from "../../services/platformService";
import { fetchCourses } from "../../services/courseService";
import DotField from "../../components/ui/DotField";
import DashBanner from "../../components/ui/DashBanner";

import heangChhengKhoemPhoto from "../../assets/team/heang-chheng-khoem.jpg";
import hornPiseyPhoto from "../../assets/team/horn-pisey.jpg";
import krySoranuthPhoto from "../../assets/team/kry-soranuth.jpg";
import muyKalinPhoto from "../../assets/team/muy-kalin.jpg";
import samrithRatanaPhoto from "../../assets/team/samrith-ratana.jpg";

import "./Home.css";

const FALLBACK_COURSES = [
  {
    id: "c1",
    slug: "react-modern-web",
    titleEn: "Modern Web Development with React",
    titleKm: "ការអភិវឌ្ឍគេហទំព័រទំនើបជាមួយ React",
    categoryEn: "Technology",
    categoryKm: "បច្ចេកវិទ្យា",
    levelEn: "Beginner",
    levelKm: "កម្រិតដំបូង",
    price: 15,
    instructor: "Muy Kalin",
    duration: "4h 12m",
  },
  {
    id: "c2",
    slug: "ui-ux-design-essentials",
    titleEn: "UI/UX Design Essentials & Figma",
    titleKm: "មូលដ្ឋានគ្រឹះនៃការរចនា UI/UX & Figma",
    categoryEn: "Design",
    categoryKm: "ការរចនា",
    levelEn: "Beginner",
    levelKm: "កម្រិតដំបូង",
    price: 0,
    instructor: "Sophea Chan",
    duration: "3h 45m",
  },
  {
    id: "c3",
    slug: "python-data-foundations",
    titleEn: "Python & Data Analysis Foundations",
    titleKm: "មូលដ្ឋានគ្រឹះ Python និងការវិភាគទិន្នន័យ",
    categoryEn: "Data & AI",
    categoryKm: "ទិន្នន័យ & AI",
    levelEn: "Intermediate",
    levelKm: "កម្រិតមធ្យម",
    price: 20,
    instructor: "Dara Sok",
    duration: "4h 20m",
  },
];

const CMU_TEAM_MENTORS = [
  {
    key: "muy-kalin",
    name: "MUY KALIN",
    roleEn: "Full-Stack & Frontend",
    roleKm: "អភិវឌ្ឍន៍គេហទំព័រ Full-Stack",
    company: "Cambodian Mekong University",
    avatar: muyKalinPhoto,
    skills: ["React.js", "Node.js", "MySQL"],
  },
  {
    key: "horn-pisey",
    name: "HORN PISEY",
    roleEn: "IT Audit & Cyber Risk",
    roleKm: "សវនកម្ម IT & ហានិភ័យប្រព័ន្ធ",
    company: "Camma Microfinance",
    avatar: hornPiseyPhoto,
    skills: ["IT Audit", "Cyber Risk", "Power BI"],
  },
  {
    key: "kry-soranuth",
    name: "KRY SORANUTH",
    roleEn: "Cybersecurity & Network",
    roleKm: "សន្តិសុខបណ្តាញ & Network",
    company: "Cambodian Mekong University",
    avatar: krySoranuthPhoto,
    skills: ["Cybersecurity", "Linux", "Python"],
  },
  {
    key: "samrith-ratana",
    name: "SAMRITH RATANA",
    roleEn: "B2B & Technical Support",
    roleKm: "គាំទ្របច្ចេកទេស & B2B",
    company: "Viettel (Cambodia)",
    avatar: samrithRatanaPhoto,
    skills: ["B2B Support", "IT Setup", "Cloud"],
  },
  {
    key: "heang-chheng-khoem",
    name: "HEANG CHHENGKHOEM",
    roleEn: "Digital Marketing & IT",
    roleKm: "ទីផ្សារឌីជីថល & គាំទ្រ IT",
    company: "Smart Community Lead",
    avatar: heangChhengKhoemPhoto,
    skills: ["Digital Marketing", "SEO", "Automation"],
  },
];

const FALLBACK_INTERNSHIPS = [
  {
    id: "j1",
    title: "Frontend Developer Intern",
    company: "Angkor Tech Solutions",
    location: "Phnom Penh",
    typeLabel: "Hybrid",
    stipendLabel: "$150/mo",
    isVerified: true,
  },
  {
    id: "j2",
    title: "UI/UX Product Design Intern",
    company: "Mekong Digital Studio",
    location: "Phnom Penh",
    typeLabel: "Full Time",
    stipendLabel: "$140/mo",
    isVerified: true,
  },
  {
    id: "j3",
    title: "Data & Business Analyst Intern",
    company: "Khmer FinTech Lab",
    location: "Remote",
    typeLabel: "Remote",
    stipendLabel: "$160/mo",
    isVerified: true,
  },
];

const QUICK_TOPICS = [
  { labelEn: "React & Web", labelKm: "គេហទំព័រ & React", query: "React" },
  { labelEn: "UI/UX Design", labelKm: "រចនា UI/UX", query: "Design" },
  { labelEn: "Python & Data", labelKm: "Python & ទិន្នន័យ", query: "Python" },
  { labelEn: "Internships", labelKm: "កម្មសិក្សា", query: "Intern", type: "jobs" },
];

const formatInternshipType = (raw = "") => {
  const clean = String(raw || "").replace(/_/g, " ").trim();
  if (!clean) return "Full Time";
  return clean.replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function Home() {
  const navigate = useNavigate();
  const { user } = useGlobleContext();
  const { language } = useLanguage();
  const isKm = language === "km";

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("courses");
  const [platformStats, setPlatformStats] = useState(null);
  const [liveCourses, setLiveCourses] = useState([]);
  const [liveMentors, setLiveMentors] = useState([]);
  const [liveInternships, setLiveInternships] = useState([]);

  const searchInputRef = useRef(null);

  // ⌘K or Ctrl+K focuses hero search cleanly
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Load real platform snapshot & top featured items silently
  useEffect(() => {
    let active = true;

    fetchStats()
      .then((stats) => {
        if (active && stats) setPlatformStats(stats);
      })
      .catch(() => {});

    fetchCourses()
      .then((res) => {
        if (active && Array.isArray(res?.courses) && res.courses.length > 0) {
          setLiveCourses(res.courses.slice(0, 3));
        }
      })
      .catch(() => {});

    fetchMentors()
      .then((rows) => {
        if (active && Array.isArray(rows) && rows.length > 0) {
          setLiveMentors(rows);
        }
      })
      .catch(() => {});

    fetchInternships()
      .then((rows) => {
        if (active && Array.isArray(rows) && rows.length > 0) {
          setLiveInternships(rows.slice(0, 3));
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const handleHeroSearch = (e) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      navigate("/search");
      return;
    }
    navigate(`/search?q=${encodeURIComponent(q)}&type=all`);
  };

  const handleTopicClick = (topic) => {
    const targetType = topic.type || "all";
    navigate(`/search?q=${encodeURIComponent(topic.query)}&type=${targetType}`);
  };

  // Normalize 3 featured courses
  const featuredCourses = useMemo(() => {
    if (liveCourses.length > 0) {
      return liveCourses.slice(0, 3).map((c) => ({
        id: c.id,
        slug: c.slug || c.id,
        title: c.title,
        category: c.category || (isKm ? "បច្ចេកវិទ្យា" : "Technology"),
        level: c.level || (isKm ? "គ្រប់កម្រិត" : "All Levels"),
        price: Number(c.price || 0),
        instructor: c.instructorName || c.instructor || "Smart Community",
        duration: c.duration || "4h",
      }));
    }
    return FALLBACK_COURSES.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: isKm ? c.titleKm : c.titleEn,
      category: isKm ? c.categoryKm : c.categoryEn,
      level: isKm ? c.levelKm : c.levelEn,
      price: c.price,
      instructor: c.instructor,
      duration: c.duration,
    }));
  }, [liveCourses, isKm]);

  // Match CMU team members with real mentor IDs when available
  const teamMembers = useMemo(() => {
    return CMU_TEAM_MENTORS.map((member) => {
      const matched = liveMentors.find(
        (m) =>
          String(m.fullName || m.name || "")
            .trim()
            .toLowerCase() === member.name.toLowerCase(),
      );
      return {
        ...member,
        mentorPath: matched?.id ? `/mentorship/${matched.id}` : "/mentorship",
      };
    });
  }, [liveMentors]);

  // Normalize 3 featured mentors for the Mentors tab
  const featuredMentors = useMemo(() => {
    if (liveMentors.length >= 3) {
      return liveMentors.slice(0, 3).map((m) => {
        const localMatch = CMU_TEAM_MENTORS.find(
          (tm) =>
            tm.name.toLowerCase() ===
            String(m.fullName || m.name || "").trim().toLowerCase(),
        );
        return {
          id: m.id,
          name: m.fullName || m.name,
          role:
            m.profession ||
            (localMatch ? (isKm ? localMatch.roleKm : localMatch.roleEn) : "Verified Mentor"),
          company: m.company || localMatch?.company || "Smart Community",
          avatar: m.avatarUrl || localMatch?.avatar || muyKalinPhoto,
          skills:
            Array.isArray(m.skills) && m.skills.length > 0
              ? m.skills.slice(0, 3)
              : localMatch?.skills || ["Mentorship", "Career"],
          path: m.id ? `/mentorship/${m.id}` : "/mentorship",
        };
      });
    }
    return teamMembers.slice(0, 3).map((m) => ({
      id: m.key,
      name: m.name,
      role: isKm ? m.roleKm : m.roleEn,
      company: m.company,
      avatar: m.avatar,
      skills: m.skills,
      path: m.mentorPath,
    }));
  }, [liveMentors, teamMembers, isKm]);

  // Normalize 3 featured internships
  const featuredInternships = useMemo(() => {
    if (liveInternships.length > 0) {
      return liveInternships.slice(0, 3).map((item) => ({
        id: item.id,
        title: item.title,
        company: item.company || "Verified Partner",
        location: item.location || (item.isRemote ? "Remote" : "Phnom Penh"),
        typeLabel: item.isRemote
          ? "Remote"
          : formatInternshipType(item.internshipType),
        stipendLabel: item.stipend
          ? typeof item.stipend === "number"
            ? `$${item.stipend}/mo`
            : String(item.stipend)
          : isKm
            ? "ប្រាក់ឧបត្ថម្ភសមរម្យ"
            : "Paid Stipend",
        isVerified: Boolean(item.isCompanyVerified ?? true),
      }));
    }
    return FALLBACK_INTERNSHIPS;
  }, [liveInternships, isKm]);

  const mentorCtaPath =
    user?.role === "mentor"
      ? "/dashboard"
      : user
        ? "/mentorship?apply=1"
        : "/register?role=mentor";

  const recruiterCtaPath =
    user?.role === "recruiter"
      ? "/post-job"
      : user
        ? "/dashboard"
        : "/register?role=recruiter";

  const activeCatalogLink =
    activeTab === "courses"
      ? {
          to: "/courses",
          label: isKm ? "មើលវគ្គសិក្សាទាំងអស់" : "View all courses",
        }
      : activeTab === "mentors"
        ? {
            to: "/mentorship",
            label: isKm ? "មើលអ្នកណែនាំទាំងអស់" : "Browse all mentors",
          }
        : {
            to: "/jobs",
            label: isKm ? "មើលកម្មសិក្សាទាំងអស់" : "Browse all internships",
          };

  return (
    <main className="home-minimal" id="home">
      {/* ====================================================================
          1. FOCUSED HERO + UNIFIED SEARCH + 3 ROLE ENTRY CARDS
          ==================================================================== */}
      <section className="hm-hero" id="top">
        <DotField />

        <div className="container hm-hero-inner">
          <div className="hm-eyebrow">
            <span className="hm-live-dot" aria-hidden="true" />
            <span>
              {isKm
                ? "Smart Community • វេទិកាអភិវឌ្ឍន៍ជំនាញ & អាជីព"
                : "Smart Community • Skill & Career Platform"}
            </span>
          </div>

          <h1 className="hm-title">
            {isKm ? (
              <>
                កសាងជំនាញពិតប្រាកដ
                <br />
                <span className="hm-title-accent">
                  ពង្រីកឱកាសការងារក្នុងក្តីស្រមៃ
                </span>
              </>
            ) : (
              <>
                Build real-world skills.
                <br />
                <span className="hm-title-accent">Launch your dream career.</span>
              </>
            )}
          </h1>

          <p className="hm-subtitle">
            {isKm
              ? "រៀនជំនាញបច្ចេកវិទ្យា ជួបអ្នកណែនាំផ្ទាល់ 1:1 និងដាក់ពាក្យចូលកម្មសិក្សាដែលបានផ្ទៀងផ្ទាត់នៅកន្លែងតែមួយ។"
              : "Learn practical tech skills, connect 1:1 with verified mentors, and apply directly for internships in one unified workspace."}
          </p>

          <form className="hm-search-bar" onSubmit={handleHeroSearch}>
            <FiSearch className="hm-search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isKm
                  ? "ស្វែងរកវគ្គសិក្សា, អ្នកណែនាំ, ឬកម្មសិក្សា..."
                  : "Search courses, mentors, internships, or skills..."
              }
              aria-label={
                isKm ? "ស្វែងរកក្នុងប្រព័ន្ធ" : "Search across platform"
              }
            />
            <button
              type="button"
              className="hm-kbd-btn"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("open-command-palette"))
              }
              title={isKm ? "បើកផ្ទាំងស្វែងរករហ័ស (⌘K)" : "Quick Search (⌘K)"}
            >
              ⌘K
            </button>
            <button type="submit" className="hm-search-submit">
              {isKm ? "ស្វែងរក" : "Search"}
            </button>
          </form>

          <div className="hm-topics" aria-label={isKm ? "ប្រធានបទពេញនិយម" : "Popular topics"}>
            <span className="hm-topics-label">
              {isKm ? "ពេញនិយម៖" : "Popular:"}
            </span>
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic.query}
                type="button"
                className="hm-topic-chip"
                onClick={() => handleTopicClick(topic)}
              >
                {isKm ? topic.labelKm : topic.labelEn}
              </button>
            ))}
          </div>

          {/* 3 Clean Role Entry Cards (Zero Duplicate Feature Cards Below) */}
          <div className="hm-role-grid">
            <article className="hm-role-card">
              <div className="hm-role-top">
                <span className="hm-role-icon is-student" aria-hidden="true">
                  <FiBookOpen />
                </span>
                <span className="hm-role-tag">
                  {isKm ? "សម្រាប់សិស្ស & និស្សិត" : "Student"}
                </span>
              </div>
              <h2>
                {isKm
                  ? "រៀនជំនាញ និងរៀបចំ CV"
                  : "Learn skills & build your CV"}
              </h2>
              <p>
                {isKm
                  ? "សិក្សាវគ្គជំនាញអនុវត្តជាក់ស្តែង បង្កើត CV ស្តង់ដារជា PDF និងដាក់ពាក្យចូលកម្មសិក្សាផ្ទាល់។"
                  : "Enroll in practical tech courses, craft your PDF resume in CV Studio, and apply for verified internships."}
              </p>
              <Link to="/courses" className="hm-role-link is-student">
                <span>{isKm ? "មើលវគ្គសិក្សា" : "Explore Courses"}</span>
                <FiArrowRight aria-hidden="true" />
              </Link>
            </article>

            <article className="hm-role-card">
              <div className="hm-role-top">
                <span className="hm-role-icon is-mentor" aria-hidden="true">
                  <FiUsers />
                </span>
                <span className="hm-role-tag">
                  {isKm ? "សម្រាប់អ្នកណែនាំ" : "Mentor"}
                </span>
              </div>
              <h2>
                {isKm
                  ? "ណែនាំសិស្ស និងចែករំលែកបទពិសោធន៍"
                  : "Guide learners & host sessions"}
              </h2>
              <p>
                {isKm
                  ? "កំណត់កាលវិភាគទំនេរ រៀបចំការពិភាក្សាវីដេអូ 1:1 តាម Jitsi និងជួយតម្រង់ទិសនិស្សិតជំនាន់ក្រោយ។"
                  : "Set your availability calendar, host 1:1 live video mentorship rooms, and guide aspiring talent."}
              </p>
              <Link to={mentorCtaPath} className="hm-role-link is-mentor">
                <span>{isKm ? "ក្លាយជាអ្នកណែនាំ" : "Become a Mentor"}</span>
                <FiArrowRight aria-hidden="true" />
              </Link>
            </article>

            <article className="hm-role-card">
              <div className="hm-role-top">
                <span className="hm-role-icon is-recruiter" aria-hidden="true">
                  <FiBriefcase />
                </span>
                <span className="hm-role-tag">
                  {isKm ? "សម្រាប់ក្រុមហ៊ុន" : "Recruiter"}
                </span>
              </div>
              <h2>
                {isKm
                  ? "ប្រកាសការងារ និងជ្រើសរើសបុគ្គលិក"
                  : "Post jobs & discover talent"}
              </h2>
              <p>
                {isKm
                  ? "ផ្សព្វផ្សាយឱកាសកម្មសិក្សា ពិនិត្យ CV និស្សិត និងរៀបចំកាលវិភាគសម្ភាសន៍តាមប្រព័ន្ធ ATS។"
                  : "Publish verified internship openings, review student CVs, and coordinate interviews in one ATS."}
              </p>
              <Link to={recruiterCtaPath} className="hm-role-link is-recruiter">
                <span>{isKm ? "ស្វែងរកបេក្ខជន" : "Hire Talent"}</span>
                <FiArrowRight aria-hidden="true" />
              </Link>
            </article>
          </div>

          {/* Quiet Inline Metrics Bar (Replaces 4 Heavy Stat Cards) */}
          <div className="hm-metrics-bar" aria-label={isKm ? "ស្ថិតិសង្ខេប" : "Platform overview"}>
            <div className="hm-metric-item">
              <strong>{platformStats?.users ? `${platformStats.users}+` : "20+"}</strong>
              <span>{isKm ? "អ្នកសិក្សាសកម្ម" : "Active Learners"}</span>
            </div>
            <span className="hm-metric-sep" aria-hidden="true" />
            <div className="hm-metric-item">
              <strong>{platformStats?.courses ?? 6}</strong>
              <span>{isKm ? "វគ្គសិក្សាអនុវត្ត" : "Practical Courses"}</span>
            </div>
            <span className="hm-metric-sep" aria-hidden="true" />
            <div className="hm-metric-item">
              <strong>{platformStats?.mentors ?? 5}</strong>
              <span>{isKm ? "អ្នកណែនាំជំនាញ" : "Verified Mentors"}</span>
            </div>
            <span className="hm-metric-sep" aria-hidden="true" />
            <div className="hm-metric-item">
              <strong>{platformStats?.jobs ?? 5}</strong>
              <span>{isKm ? "ឱកាសកម្មសិក្សា" : "Open Internships"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          2. FEATURED OPPORTUNITIES (SEGMENTED TABS — MAX 3 CARDS ON SCREEN)
          ==================================================================== */}
      <section className="hm-section" id="discover">
        <div className="container">
          <div className="hm-section-head">
            <div>
              <p className="hm-kicker">
                {isKm ? "ឱកាសលេចធ្លោក្នុងប្រព័ន្ធ" : "DISCOVER PLATFORM"}
              </p>
              <h2 className="hm-section-title">
                {isKm ? "ឱកាសសិក្សា និងអាជីព" : "Featured Opportunities"}
              </h2>
            </div>

            <div
              className="hm-tabs"
              role="tablist"
              aria-label={isKm ? "ជ្រើសរើសប្រភេទឱកាស" : "Opportunity categories"}
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "courses"}
                className={`hm-tab ${activeTab === "courses" ? "is-active" : ""}`}
                onClick={() => setActiveTab("courses")}
              >
                <FiBookOpen aria-hidden="true" />
                <span>{isKm ? "វគ្គសិក្សា" : "Courses"}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "mentors"}
                className={`hm-tab ${activeTab === "mentors" ? "is-active" : ""}`}
                onClick={() => setActiveTab("mentors")}
              >
                <FiUsers aria-hidden="true" />
                <span>{isKm ? "អ្នកណែនាំ" : "Mentors"}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "internships"}
                className={`hm-tab ${activeTab === "internships" ? "is-active" : ""}`}
                onClick={() => setActiveTab("internships")}
              >
                <FiBriefcase aria-hidden="true" />
                <span>{isKm ? "កម្មសិក្សា" : "Internships"}</span>
              </button>
            </div>
          </div>

          {activeTab === "courses" && (
            <div className="hm-opp-grid" role="tabpanel">
              {featuredCourses.map((course) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.slug}`}
                  className="hm-opp-card"
                >
                  <div className="hm-opp-top">
                    <span className="hm-opp-cat">{course.category}</span>
                    <span className="hm-opp-pill">{course.level}</span>
                  </div>
                  <h3 className="hm-opp-title">{course.title}</h3>
                  <div className="hm-opp-meta">
                    <span>{course.instructor}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      <FiClock aria-hidden="true" /> {course.duration}
                    </span>
                  </div>
                  <div className="hm-opp-footer">
                    <span
                      className={`hm-opp-price ${course.price === 0 ? "is-free" : ""}`}
                    >
                      {course.price > 0
                        ? `$${course.price} · KHQR`
                        : isKm
                          ? "ឥតគិតថ្លៃ"
                          : "Free"}
                    </span>
                    <span className="hm-opp-action">
                      {isKm ? "មើលមេរៀន" : "View Course"}{" "}
                      <FiArrowRight aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {activeTab === "mentors" && (
            <div className="hm-opp-grid" role="tabpanel">
              {featuredMentors.map((mentor) => (
                <Link
                  key={mentor.id}
                  to={mentor.path}
                  className="hm-opp-card"
                >
                  <div className="hm-mentor-head">
                    <img
                      src={mentor.avatar}
                      alt={mentor.name}
                      className="hm-mentor-avatar"
                      loading="lazy"
                    />
                    <div className="hm-mentor-info">
                      <div className="hm-mentor-name-row">
                        <h3>{mentor.name}</h3>
                        <MdVerified
                          className="hm-verified-icon"
                          aria-label="Verified"
                        />
                      </div>
                      <p>{mentor.role}</p>
                    </div>
                  </div>
                  <div className="hm-skill-row">
                    {mentor.skills.map((skill) => (
                      <span key={skill} className="hm-skill-chip">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="hm-opp-footer">
                    <span className="hm-opp-sub">{mentor.company}</span>
                    <span className="hm-opp-action">
                      {isKm ? "កក់ម៉ោង 1:1" : "Book 1:1"}{" "}
                      <FiArrowRight aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {activeTab === "internships" && (
            <div className="hm-opp-grid" role="tabpanel">
              {featuredInternships.map((job) => (
                <Link key={job.id} to="/jobs" className="hm-opp-card">
                  <div className="hm-opp-top">
                    <span className="hm-opp-company">
                      {job.company}
                      {job.isVerified && (
                        <FiCheckCircle
                          className="hm-company-check"
                          aria-label="Verified company"
                        />
                      )}
                    </span>
                    <span className="hm-opp-pill">{job.typeLabel}</span>
                  </div>
                  <h3 className="hm-opp-title">{job.title}</h3>
                  <div className="hm-opp-meta">
                    <span>
                      <FiMapPin aria-hidden="true" /> {job.location}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{job.stipendLabel}</span>
                  </div>
                  <div className="hm-opp-footer">
                    <span className="hm-opp-sub">
                      {isKm ? "ដាក់ពាក្យជាមួយ PDF CV" : "Direct PDF CV Apply"}
                    </span>
                    <span className="hm-opp-action">
                      {isKm ? "ដាក់ពាក្យ" : "Apply"}{" "}
                      <FiArrowRight aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="hm-more-row">
            <Link to={activeCatalogLink.to} className="hm-more-btn">
              <span>{activeCatalogLink.label}</span>
              <FiArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. HOW IT WORKS (UNIFIED 3-STEP PANEL — NO FLOATING CARD CLUTTER)
          ==================================================================== */}
      <section className="hm-section hm-workflow-section" id="how-it-works">
        <div className="container">
          <div className="hm-section-head is-centered">
            <p className="hm-kicker">
              {isKm ? "ដំណើរឆ្ពោះទៅកាន់អាជីព" : "HOW IT WORKS"}
            </p>
            <h2 className="hm-section-title">
              {isKm
                ? "៣ ជំហានសាមញ្ញពីការសិក្សាទៅកាន់ការងារ"
                : "Three simple steps from learning to hired"}
            </h2>
          </div>

          <div className="hm-steps-panel">
            <div className="hm-step-col">
              <div className="hm-step-header">
                <span className="hm-step-num">01</span>
                <span className="hm-step-icon" aria-hidden="true">
                  <FiBookOpen />
                </span>
              </div>
              <h3>{isKm ? "រៀនជំនាញជាក់ស្តែង" : "Learn Practical Skills"}</h3>
              <p>
                {isKm
                  ? "សិក្សាវគ្គជំនាញបច្ចេកវិទ្យាឥតគិតថ្លៃ ឬបង់តាម Bakong KHQR និងផ្លាស់ប្តូរជំនាញជាមួយមិត្តភក្តិ។"
                  : "Master industry tech courses with free lessons or instant Bakong KHQR access, plus peer skill swaps."}
              </p>
              <Link to="/courses" className="hm-step-link">
                {isKm ? "ចាប់ផ្តើមរៀន" : "Browse Courses"}{" "}
                <FiArrowRight aria-hidden="true" />
              </Link>
            </div>

            <div className="hm-step-col">
              <div className="hm-step-header">
                <span className="hm-step-num">02</span>
                <span className="hm-step-icon" aria-hidden="true">
                  <FiFileText />
                </span>
              </div>
              <h3>
                {isKm
                  ? "បង្កើត CV & ជួបអ្នកណែនាំ"
                  : "Build CV & Meet Mentors"}
              </h3>
              <p>
                {isKm
                  ? "រៀបចំ CV ស្តង់ដារជា PDF ដោយស្វ័យប្រវត្តិក្នុង CV Studio និងកក់ម៉ោងពិភាក្សា 1:1 ជាមួយអ្នកណែនាំ។"
                  : "Auto-compile an A4 recruiter-ready PDF resume in CV Studio and book 1:1 mentor guidance."}
              </p>
              <Link to="/cv-studio" className="hm-step-link">
                {isKm ? "បើក CV Studio" : "Open CV Studio"}{" "}
                <FiArrowRight aria-hidden="true" />
              </Link>
            </div>

            <div className="hm-step-col">
              <div className="hm-step-header">
                <span className="hm-step-num">03</span>
                <span className="hm-step-icon" aria-hidden="true">
                  <FiBriefcase />
                </span>
              </div>
              <h3>
                {isKm ? "ដាក់ពាក្យចូលកម្មសិក្សា" : "Apply & Track Live"}
              </h3>
              <p>
                {isKm
                  ? "ដាក់ពាក្យដោយផ្ទាល់ទៅកាន់ក្រុមហ៊ុនដែលបានផ្ទៀងផ្ទាត់ និងតាមដានរាល់ដំណាក់កាលសម្ភាសន៍។"
                  : "Apply directly to verified partner companies with your PDF CV and track every hiring stage live."}
              </p>
              <Link to="/jobs" className="hm-step-link">
                {isKm ? "ស្វែងរកការងារ" : "Explore Internships"}{" "}
                <FiArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          4. BORDERLESS CMU RESEARCH TEAM SIGNATURE (ZERO HEAVY CARDS)
          ==================================================================== */}
      <section className="hm-team-section" id="team">
        <div className="container">
          <p className="hm-team-kicker">
            {isKm
              ? "អភិវឌ្ឍដោយក្រុមនិស្សិតស្រាវជ្រាវសារណា • សាកលវិទ្យាល័យមេគង្គកម្ពុជា (CMU)"
              : "CAMBODIAN MEKONG UNIVERSITY • GRADUATION RESEARCH TEAM"}
          </p>
          <div className="hm-team-row">
            {teamMembers.map((member) => (
              <Link
                key={member.key}
                to={member.mentorPath}
                className="hm-team-person"
              >
                <div className="hm-team-avatar-wrap">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    loading="lazy"
                  />
                  <span className="hm-team-verified" aria-hidden="true">
                    <MdVerified />
                  </span>
                </div>
                <strong>{member.name}</strong>
                <span>{isKm ? member.roleKm : member.roleEn}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. CLOSING CTA BANNER
          ==================================================================== */}
      <DashBanner />
    </main>
  );
}
