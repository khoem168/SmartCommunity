import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  IoArrowForward,
  IoArrowBack,
  IoBriefcaseOutline,
  IoCheckmarkCircle,
  IoFlashOutline,
  IoPeopleOutline,
  IoSchoolOutline,
  IoSparklesOutline,
  IoTrendingUpOutline,
  IoSearchOutline,
  IoShieldCheckmarkOutline,
  IoSwapHorizontalOutline,
  IoPlayCircleOutline,
  IoChevronDownOutline,
  IoRibbonOutline,
  IoFlameOutline,
  IoCodeSlashOutline,
  IoHardwareChipOutline,
  IoColorPaletteOutline,
  IoAnalyticsOutline,
  IoCheckmark,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { fetchStats } from "../../services/platformService";
import LearningScene from "../../components/ui/LearningScene";
import FeatureDirectory from "../../components/ui/FeatureDirectory";
import heangChhengKhoemPhoto from "../../assets/team/heang-chheng-khoem.jpg";
import hornPiseyPhoto from "../../assets/team/horn-pisey.jpg";
import krySoranuthPhoto from "../../assets/team/kry-soranuth.jpg";
import muyKalinPhoto from "../../assets/team/muy-kalin.jpg";
import samrithRatanaPhoto from "../../assets/team/samrith-ratana.jpg";
import "./Home.css";
import "./CampusHome.css";

const personaData = {
  student: {
    key: "student",
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80",
    titleKey: "personaStudentTitle",
    descKey: "personaStudentDesc",
    points: [
      "personaStudentPoint1",
      "personaStudentPoint2",
      "personaStudentPoint3",
    ],
    ctaKey: "personaStudentCta",
    link: "/courses",
    badge: "100% Free Starter",
  },
  switcher: {
    key: "switcher",
    image:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=80",
    titleKey: "personaSwitcherTitle",
    descKey: "personaSwitcherDesc",
    points: [
      "personaSwitcherPoint1",
      "personaSwitcherPoint2",
      "personaSwitcherPoint3",
    ],
    ctaKey: "personaSwitcherCta",
    link: "/mentorship",
    badge: "Fast-Track Mentorship",
  },
  seeker: {
    key: "seeker",
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80",
    titleKey: "personaSeekerTitle",
    descKey: "personaSeekerDesc",
    points: [
      "personaSeekerPoint1",
      "personaSeekerPoint2",
      "personaSeekerPoint3",
    ],
    ctaKey: "personaSeekerCta",
    link: "/jobs",
    badge: "Direct Hiring",
  },
  mentor: {
    key: "mentor",
    image:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80",
    titleKey: "personaMentorTitle",
    descKey: "personaMentorDesc",
    points: [
      "personaMentorPoint1",
      "personaMentorPoint2",
      "personaMentorPoint3",
    ],
    ctaKey: "personaMentorCta",
    link: "/register",
    badge: "Earn & Mentor",
  },
};

const tracksList = [
  {
    id: "frontend",
    title: "Frontend & Web Apps",
    titleKey: "frontend",
    icon: <IoCodeSlashOutline />,
    color: "#0f766e",
    bg: "#ecfdf5",
    courses: 28,
    jobs: 19,
    skills: ["React", "Next.js", "TypeScript", "Tailwind"],
    trending: true,
    link: "/courses",
  },
  {
    id: "backend",
    title: "Backend & Cloud Architecture",
    titleKey: "backend",
    icon: <IoHardwareChipOutline />,
    color: "#2563eb",
    bg: "#eff6ff",
    courses: 24,
    jobs: 26,
    skills: ["Node.js", "Go", "Docker", "PostgreSQL", "AWS"],
    trending: true,
    link: "/courses",
  },
  {
    id: "uiux",
    title: "UI/UX & Product Design",
    titleKey: "uiux",
    icon: <IoColorPaletteOutline />,
    color: "#7c3aed",
    bg: "#f5f3ff",
    courses: 18,
    jobs: 14,
    skills: ["Figma", "Design Systems", "User Research", "Wireframing"],
    trending: false,
    link: "/courses",
  },
  {
    id: "dataSkills",
    title: "AI, ML & Data Analytics",
    titleKey: "dataSkills",
    icon: <IoAnalyticsOutline />,
    color: "#ea580c",
    bg: "#fff7ed",
    courses: 20,
    jobs: 16,
    skills: ["Python", "Pandas", "LLM APIs", "SQL", "Tableau"],
    trending: true,
    link: "/courses",
  },
  {
    id: "cyberSecurity",
    title: "Cybersecurity & Defense",
    titleKey: "cyberSecurity",
    icon: <IoShieldCheckmarkOutline />,
    color: "#0284c7",
    bg: "#f0f9ff",
    courses: 14,
    jobs: 11,
    skills: ["Network Security", "SOC", "Ethical Hacking", "DevSecOps"],
    trending: false,
    link: "/courses",
  },
  {
    id: "marketing",
    title: "Digital Growth & Marketing",
    titleKey: "marketing",
    icon: <IoTrendingUpOutline />,
    color: "#db2777",
    bg: "#fdf2f8",
    courses: 16,
    jobs: 15,
    skills: ["SEO", "Performance Ads", "Analytics", "Content"],
    trending: false,
    link: "/courses",
  },
];

const featuredMentors = [
  {
    id: "muy-kalin",
    name: "MUY KALIN",
    role: "Full-stack & Frontend Development",
    company: "Cambodian Mekong University",
    avatar: muyKalinPhoto,
    focus: "Web, API & database development",
    summary:
      "Builds responsive React interfaces and connects frontend experiences with backend services and databases.",
    tags: ["React.js", "Node.js", "PHP", "MySQL"],
  },
  {
    id: "horn-pisey",
    name: "HORN PISEY",
    role: "IT Audit & Cyber Risk",
    company: "Camma Microfinance Limited",
    avatar: hornPiseyPhoto,
    focus: "ITGC, compliance & risk controls",
    summary:
      "Supports IT audits across access management, network security, backup, recovery, and control improvement.",
    tags: ["IT Audit", "ITGC", "Cyber Risk", "Power BI"],
  },
  {
    id: "kry-soranuth",
    name: "KRY SORANUTH",
    role: "Cybersecurity & Network Foundations",
    company: "Cambodian Mekong University",
    avatar: krySoranuthPhoto,
    focus: "Security, Linux & network fundamentals",
    summary:
      "Focuses on cybersecurity foundations, risk assessment, Linux administration, Python, and network security.",
    tags: ["Cybersecurity", "Linux", "Python", "Networking"],
  },
  {
    id: "samrith-ratana",
    name: "SAMRITH RATANA",
    role: "B2B Account & Technical Support",
    company: "Viettel (Cambodia) PTE. LTD.",
    avatar: samrithRatanaPhoto,
    focus: "Enterprise accounts & client support",
    summary:
      "Brings experience in corporate client communication, service proposals, account support, and technical setup.",
    tags: ["B2B", "Client Support", "MS Office", "IT Setup"],
  },
  {
    id: "heang-chheng-khoem",
    name: "HEANG CHHENGKHOEM",
    role: "Digital Marketing & IT Support",
    company: "888 UP FAST CASH",
    avatar: heangChhengKhoemPhoto,
    focus: "Digital growth, automation & operations",
    summary:
      "Works across social media, local SEO, campaign analytics, technical support, automation, and content production.",
    tags: ["Digital Marketing", "SEO", "IT Support", "Automation"],
  },
];

const faqItems = [
  { qKey: "faq1Q", aKey: "faq1A" },
  { qKey: "faq2Q", aKey: "faq2A" },
  { qKey: "faq3Q", aKey: "faq3A" },
  { qKey: "faq4Q", aKey: "faq4A" },
];

const splitHeroLines = (value) =>
  String(value)
    .split("\n")
    .flatMap((segment) => segment.match(/[^។.!?]+[។.!?]?/g) || [segment])
    .map((line) => line.trim())
    .filter(Boolean);

const Home = () => {
  const { user } = useGlobleContext();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [activePersona, setActivePersona] = useState("student");
  const [activeTrackFilter] = useState("all");
  const [openFaq, setOpenFaq] = useState(0);
  const [platformStats, setPlatformStats] = useState(null);
  const [activeMentorIndex, setActiveMentorIndex] = useState(0);
  const [mentorCarouselPaused, setMentorCarouselPaused] = useState(false);
  const heroVisualRef = useRef(null);

  const heroTitleLines = splitHeroLines(t("home.heroTitle"));
  const heroAccentLines = splitHeroLines(t("home.heroAccent"));

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      navigate("/courses");
      return;
    }
    navigate(`/courses?search=${encodeURIComponent(query)}`);
  };

  const handleTagClick = (tag) => {
    navigate(`/courses?search=${encodeURIComponent(tag)}`);
  };

  useEffect(() => {
    let isActive = true;

    fetchStats()
      .then((stats) => {
        if (isActive) setPlatformStats(stats);
      })
      .catch(() => {
        if (isActive) setPlatformStats({});
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const revealElements = document.querySelectorAll(".home-page .reveal");
    const navbar = document.querySelector(".navbar");

    const updateHeaderState = () => {
      navbar?.classList.toggle("landing-header-scrolled", window.scrollY > 8);
    };

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });

    if (reduceMotion) {
      revealElements.forEach((element) => element.classList.add("in-view"));
      return () => {
        window.removeEventListener("scroll", updateHeaderState);
        navbar?.classList.remove("landing-header-scrolled");
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    revealElements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateHeaderState);
      navbar?.classList.remove("landing-header-scrolled");
    };
  }, [language]);

  useEffect(() => {
    const visual = heroVisualRef.current;
    if (!visual) return undefined;

    const supportsTilt = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!supportsTilt || reduceMotion) return undefined;

    let frameId = 0;
    const updateTilt = (event) => {
      const bounds = visual.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;

      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        visual.style.setProperty("--hero-tilt-x", `${(-y * 4).toFixed(2)}deg`);
        visual.style.setProperty("--hero-tilt-y", `${(x * 5).toFixed(2)}deg`);
        visual.style.setProperty("--hero-shift-x", `${(x * 4).toFixed(2)}px`);
        visual.style.setProperty("--hero-shift-y", `${(y * 3).toFixed(2)}px`);
      });
    };
    const resetTilt = () => {
      window.cancelAnimationFrame(frameId);
      visual.style.removeProperty("--hero-tilt-x");
      visual.style.removeProperty("--hero-tilt-y");
      visual.style.removeProperty("--hero-shift-x");
      visual.style.removeProperty("--hero-shift-y");
    };

    visual.addEventListener("pointermove", updateTilt, { passive: true });
    visual.addEventListener("pointerleave", resetTilt);

    return () => {
      window.cancelAnimationFrame(frameId);
      visual.removeEventListener("pointermove", updateTilt);
      visual.removeEventListener("pointerleave", resetTilt);
    };
  }, []);

  useEffect(() => {
    featuredMentors.forEach((mentor) => {
      const image = new Image();
      image.src = mentor.avatar;
      image.decode?.().catch(() => undefined);
    });
  }, []);

  const filteredTracks =
    activeTrackFilter === "all"
      ? tracksList
      : tracksList.filter((track) => track.id === activeTrackFilter);

  const currentPersona = personaData[activePersona] || personaData.student;
  const activeMentor = featuredMentors[activeMentorIndex];
  const showPreviousMentor = () => {
    setActiveMentorIndex((current) =>
      (current - 1 + featuredMentors.length) % featuredMentors.length,
    );
  };
  const showNextMentor = () => {
    setActiveMentorIndex((current) =>
      (current + 1) % featuredMentors.length,
    );
  };
  const formatPlatformStat = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return "—";
    return numericValue.toLocaleString(language === "km" ? "km-KH" : "en-US");
  };

  return (
    <main className="home-page">
      {/* 1. HERO SECTION */}
      <section
        className="home-hero campus-hero"
      >
        <div className="hero-glow-sphere hero-glow-1" aria-hidden="true" />
        <div className="hero-glow-sphere hero-glow-2" aria-hidden="true" />

        <div className="home-container hero-grid">
          <div className="hero-copy">
            <div className="hero-badge-pill">
              <span className="live-ping" />
              <span className="hero-badge-text">
                {t("home.heroBadge") || t("home.eyebrow")}
              </span>
            </div>

            <h1>
              {heroTitleLines.map((line, index) => (
                <span
                  className={`hero-line-mask hero-line-delay-${index + 1}`}
                  key={line}
                >
                  <span className="hero-line-inner">{line}</span>
                </span>
              ))}
              {heroAccentLines.map((line) => (
                <span
                  className="hero-line-mask hero-line-accent hero-line-delay-3"
                  key={line}
                >
                  <span className="hero-line-inner">{line}</span>
                </span>
              ))}
            </h1>

            <p>{t("home.heroDescription")}</p>

            <span className="hero-discover-label">
              {language === "km" ? "ស្វែងរក និងរៀន" : "Discover & Learn"}
            </span>

            {/* Interactive Search Bar */}
            <form className="hero-search-bar" onSubmit={handleSearchSubmit}>
              <div className="search-input-wrap">
                <IoSearchOutline className="search-icon" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("home.searchPlaceholder")}
                  aria-label={t("home.searchPlaceholder")}
                />
              </div>
              <button type="submit" className="search-submit-btn">
                {t("home.searchButton")}
                <IoArrowForward />
              </button>
            </form>

            {/* Trending Quick Tags */}
            <details className="hero-search-suggestions">
              <summary>
                <IoFlameOutline /> {t("home.trendingSearches")}
                <IoChevronDownOutline />
              </summary>
              <div className="hero-trending-tags">
              <button
                type="button"
                className="trending-tag"
                onClick={() => handleTagClick("React")}
              >
                {t("home.tagReact")}
              </button>
              <button
                type="button"
                className="trending-tag"
                onClick={() => handleTagClick("UI/UX")}
              >
                {t("home.tagUiUx")}
              </button>
              <button
                type="button"
                className="trending-tag"
                onClick={() => handleTagClick("Python")}
              >
                {t("home.tagPython")}
              </button>
              <button
                type="button"
                className="trending-tag"
                onClick={() => handleTagClick("Cloud")}
              >
                {t("home.tagCloud")}
              </button>
              </div>
            </details>

            {/* Action Buttons */}
            <div className="hero-actions">
              <Link
                to={user ? "/dashboard" : "/register"}
                className="home-btn primary"
              >
                {user ? t("home.openDashboard") : t("home.startFree")}
                <IoArrowForward />
              </Link>
              <Link to="/career" className="home-btn secondary">
                {t("home.exploreRoadmap")}
              </Link>
              <Link to="/jobs" className="home-btn tertiary">
                {t("home.exploreInternships")}
              </Link>
            </div>

            {/* Trust Proof Badges */}
            <div className="hero-proof" aria-label={t("home.highlightsLabel")}>
              <span>
                <IoCheckmarkCircle />
                {t("home.guidedMentorship")}
              </span>
              <span>
                <IoCheckmarkCircle />
                {t("home.skillExchange")}
              </span>
              <span>
                <IoCheckmarkCircle />
                {t("home.verifiedOpportunities")}
              </span>
              <span>
                <IoShieldCheckmarkOutline />
                {t("home.khqrSecure")}
              </span>
            </div>
          </div>

          {/* Interactive Hero Visual with Floating Live Cards */}
          <div className="hero-visual" ref={heroVisualRef}>
            <LearningScene />
          </div>
        </div>
      </section>

      <FeatureDirectory />

      {/* 2. STATS & LIVE PLATFORM METRICS */}
      <section
        className="home-container stats-strip reveal"
        aria-label={t("home.statsLabel")}
      >
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <IoPeopleOutline />
          </div>
          <div className="stat-content">
            <strong>{formatPlatformStat(platformStats?.users)}</strong>
            <span>{t("home.statsLearnersLabel")}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <IoRibbonOutline />
          </div>
          <div className="stat-content">
            <strong>{formatPlatformStat(platformStats?.mentors)}</strong>
            <span>{t("home.statsMentorsLabel")}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <IoSchoolOutline />
          </div>
          <div className="stat-content">
            <strong>{formatPlatformStat(platformStats?.courses)}</strong>
            <span>{t("home.statsCoursesLabel")}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <IoBriefcaseOutline />
          </div>
          <div className="stat-content">
            <strong>{formatPlatformStat(platformStats?.jobs)}</strong>
            <span>{t("home.statsPlacementLabel")}</span>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE PERSONA PATH SWITCHER */}
      <section className="home-section persona-section">
        <div className="home-container">
          <div className="section-heading text-center reveal">
            <span className="section-kicker">{t("home.personaKicker")}</span>
            <h2>{t("home.personaTitle")}</h2>
            <p className="section-desc">{t("home.personaSubtitle")}</p>
          </div>

          <div className="persona-tabs-nav reveal">
            <button
              type="button"
              className={`persona-tab-btn ${activePersona === "student" ? "active" : ""}`}
              aria-pressed={activePersona === "student"}
              onClick={() => setActivePersona("student")}
            >
              {t("home.personaTabStudent")}
            </button>
            <button
              type="button"
              className={`persona-tab-btn ${activePersona === "switcher" ? "active" : ""}`}
              aria-pressed={activePersona === "switcher"}
              onClick={() => setActivePersona("switcher")}
            >
              {t("home.personaTabSwitcher")}
            </button>
            <button
              type="button"
              className={`persona-tab-btn ${activePersona === "seeker" ? "active" : ""}`}
              aria-pressed={activePersona === "seeker"}
              onClick={() => setActivePersona("seeker")}
            >
              {t("home.personaTabSeeker")}
            </button>
            <button
              type="button"
              className={`persona-tab-btn ${activePersona === "mentor" ? "active" : ""}`}
              aria-pressed={activePersona === "mentor"}
              onClick={() => setActivePersona("mentor")}
            >
              {t("home.personaTabMentor")}
            </button>
          </div>

          <div className="persona-display-card reveal">
            <div className="persona-content-col">
              <div className="persona-badge-tag">{currentPersona.badge}</div>
              <h3>{t(`home.${currentPersona.titleKey}`)}</h3>
              <p>{t(`home.${currentPersona.descKey}`)}</p>

              <ul className="persona-points-list">
                {currentPersona.points.map((ptKey) => (
                  <li key={ptKey}>
                    <div className="check-bullet">
                      <IoCheckmark />
                    </div>
                    <span>{t(`home.${ptKey}`)}</span>
                  </li>
                ))}
              </ul>

              <div className="persona-cta-wrap">
                <Link to={currentPersona.link} className="home-btn primary">
                  {t(`home.${currentPersona.ctaKey}`)}
                  <IoArrowForward />
                </Link>
                <Link to="/career" className="text-link">
                  {t("home.exploreRoadmap")}
                  <IoArrowForward />
                </Link>
              </div>
            </div>

            <div className="persona-visual-col">
              <div className="persona-img-frame">
                <img
                  src={currentPersona.image}
                  alt={t(`home.${currentPersona.titleKey}`)}
                />
                <div className="persona-img-overlay-card">
                  <IoSparklesOutline />
                  <div>
                    <strong>Smart Community Ecosystem</strong>
                    <span>Personalized learning & mentoring</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE ECOSYSTEM BENTO GRID */}
      <section className="home-section bento-section">
        <div className="home-container">
          <div className="section-heading text-center reveal">
            <span className="section-kicker">{t("home.toolsKicker")}</span>
            <h2>{t("home.toolsTitle")}</h2>
            <p className="section-desc">{t("home.toolsSubtitle")}</p>
          </div>

          <div className="bento-grid">
            {/* Bento Card 1: Courses & Academy */}
            <article className="bento-card card-large reveal reveal-card">
              <div className="bento-card-header">
                <span className="bento-badge academy">
                  <IoSchoolOutline /> {t("home.pillarCoursesBadge")}
                </span>
                <span className="bento-number">01</span>
              </div>
              <div className="bento-body">
                <h3>{t("home.pillarCoursesTitle")}</h3>
                <p>{t("home.pillarCoursesDesc")}</p>

                <div className="bento-preview-chips">
                  <span className="preview-chip">
                    <IoPlayCircleOutline /> Free Lesson Previews
                  </span>
                  <span className="preview-chip">
                    <IoShieldCheckmarkOutline /> Bakong KHQR
                  </span>
                  <span className="preview-chip">
                    <IoRibbonOutline /> Verified Certificate
                  </span>
                </div>
              </div>
              <div className="bento-footer">
                <Link to="/courses" className="bento-action-link">
                  {t("home.pillarCoursesAction")}
                  <IoArrowForward />
                </Link>
              </div>
            </article>

            {/* Bento Card 2: 1:1 Mentorship */}
            <article className="bento-card reveal reveal-card">
              <div className="bento-card-header">
                <span className="bento-badge mentorship">
                  <IoPeopleOutline /> {t("home.pillarMentorsBadge")}
                </span>
                <span className="bento-number">02</span>
              </div>
              <div className="bento-body">
                <h3>{t("home.pillarMentorsTitle")}</h3>
                <p>{t("home.pillarMentorsDesc")}</p>
                <div className="mentor-avatars-preview">
                  {featuredMentors.slice(0, 3).map((member) => (
                    <img
                      key={member.id}
                      src={member.avatar}
                      alt={member.name}
                    />
                  ))}
                  <span className="more-mentors">+2</span>
                </div>
              </div>
              <div className="bento-footer">
                <Link to="/mentorship" className="bento-action-link">
                  {t("home.pillarMentorsAction")}
                  <IoArrowForward />
                </Link>
              </div>
            </article>

            {/* Bento Card 3: Skill Exchange */}
            <article className="bento-card reveal reveal-card">
              <div className="bento-card-header">
                <span className="bento-badge exchange">
                  <IoSwapHorizontalOutline /> {t("home.pillarExchangeBadge")}
                </span>
                <span className="bento-number">03</span>
              </div>
              <div className="bento-body">
                <h3>{t("home.pillarExchangeTitle")}</h3>
                <p>{t("home.pillarExchangeDesc")}</p>
                <div className="exchange-swap-visual">
                  <span className="skill-pill offer">Python / JS</span>
                  <div className="swap-icon">
                    <IoSwapHorizontalOutline />
                  </div>
                  <span className="skill-pill need">UI/UX Design</span>
                </div>
              </div>
              <div className="bento-footer">
                <Link to="/community" className="bento-action-link">
                  {t("home.pillarExchangeAction")}
                  <IoArrowForward />
                </Link>
              </div>
            </article>

            {/* Bento Card 4: Verified Careers & Jobs */}
            <article className="bento-card card-large reveal reveal-card">
              <div className="bento-card-header">
                <span className="bento-badge jobs">
                  <IoBriefcaseOutline /> {t("home.pillarJobsBadge")}
                </span>
                <span className="bento-number">04</span>
              </div>
              <div className="bento-body">
                <h3>{t("home.pillarJobsTitle")}</h3>
                <p>{t("home.pillarJobsDesc")}</p>

                <div className="bento-preview-chips">
                  <span className="preview-chip">
                    <IoCheckmarkCircle /> Direct Employer Apply
                  </span>
                  <span className="preview-chip">
                    <IoFlashOutline /> Fast-Track Internships
                  </span>
                  <span className="preview-chip">
                    <IoTrendingUpOutline /> Career Readiness Match
                  </span>
                </div>
              </div>
              <div className="bento-footer">
                <Link to="/jobs" className="bento-action-link">
                  {t("home.pillarJobsAction")}
                  <IoArrowForward />
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 5. IN-DEMAND SKILL TRACKS EXPLORER */}
      <section className="home-section tracks-section">
        <div className="home-container">
          <div className="section-heading-split reveal">
            <div>
              <span className="section-kicker">{t("home.tracksKicker")}</span>
              <h2>{t("home.tracksTitle")}</h2>
              <p className="section-desc">{t("home.tracksSubtitle")}</p>
            </div>
            <Link to="/discover" className="home-btn secondary">
              {t("home.allTracks")}
              <IoArrowForward />
            </Link>
          </div>

          <div className="tracks-grid reveal">
            {filteredTracks.map((track) => (
              <div className="track-card" key={track.id}>
                <div
                  className="track-icon-badge"
                  style={{ background: track.bg, color: track.color }}
                >
                  {track.icon}
                </div>

                <div className="track-card-header">
                  <h3>{t(`home.${track.titleKey}`) || track.title}</h3>
                  {track.trending && (
                    <span className="trending-chip">
                      <IoFlameOutline /> Hot
                    </span>
                  )}
                </div>

                <div className="track-stats-row">
                  <span>{track.courses} Courses</span>
                  <span aria-hidden="true">•</span>
                  <span>{track.jobs} Openings</span>
                </div>

                <div className="track-tags-list">
                  {track.skills.map((skill) => (
                    <span className="track-tag" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>

                <Link to={track.link} className="track-card-btn">
                  {t("home.viewTrackDetails")}
                  <IoArrowForward />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FEATURED MENTORS SPOTLIGHT */}
      <section
        id="project-team"
        className="home-section mentors-spotlight-section"
      >
        <div className="home-container">
          <div className="section-heading-split reveal">
            <div>
              <span className="section-kicker">
                {t("home.featuredMentorsKicker")}
              </span>
              <h2>{t("home.featuredMentorsTitle")}</h2>
              <p className="section-desc">{t("home.featuredMentorsDesc")}</p>
            </div>
            <Link to="/community" className="home-btn primary">
              {t("home.viewAllMentors")}
              <IoArrowForward />
            </Link>
          </div>

          <div
            className={`mentor-carousel ${mentorCarouselPaused ? "is-paused" : ""}`}
            role="region"
            aria-roledescription="carousel"
            aria-label="Smart Community project team"
            onMouseEnter={() => setMentorCarouselPaused(true)}
            onMouseLeave={() => setMentorCarouselPaused(false)}
            onFocusCapture={() => setMentorCarouselPaused(true)}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setMentorCarouselPaused(false);
              }
            }}
          >
            <div className="mentor-carousel-stage" aria-live="polite">
              <article className="mentor-showcase-card" key={activeMentor.id}>
                <div className="mentor-showcase-media">
                  <img
                    src={activeMentor.avatar}
                    alt={`${activeMentor.name} — Smart Community team member`}
                    width="260"
                    height="320"
                    decoding="async"
                    draggable="false"
                  />
                  <span className="mentor-showcase-verified">
                    <IoShieldCheckmarkOutline /> Verified team member
                  </span>
                </div>

                <div className="mentor-showcase-content">
                  <div className="mentor-showcase-meta">
                    <span className="mentor-team-pill">
                      <IoPeopleOutline /> Project team
                    </span>
                    <span className="mentor-slide-count">
                      {String(activeMentorIndex + 1).padStart(2, "0")} / {String(featuredMentors.length).padStart(2, "0")}
                    </span>
                  </div>

                  <h3>{activeMentor.name}</h3>
                  <p className="mentor-showcase-role">{activeMentor.role}</p>
                  <p className="mentor-showcase-company">{activeMentor.company}</p>
                  <p className="mentor-showcase-summary">{activeMentor.summary}</p>

                  <div className="mentor-showcase-focus">
                    <span>Focus</span>
                    <strong>{activeMentor.focus}</strong>
                  </div>

                  <div className="mentor-skills-tags">
                    {activeMentor.tags.map((tag) => (
                      <span className="mentor-tag" key={tag}>{tag}</span>
                    ))}
                  </div>

                  <Link to="/community" className="mentor-book-btn">
                    {t("home.bookSessionBtn")}
                    <IoArrowForward />
                  </Link>
                </div>
              </article>
            </div>

            <div className="mentor-carousel-controls">
              <div className="mentor-carousel-arrows">
                <button type="button" onClick={showPreviousMentor} aria-label="Previous team member">
                  <IoArrowBack />
                </button>
                <button type="button" onClick={showNextMentor} aria-label="Next team member">
                  <IoArrowForward />
                </button>
              </div>

              <div className="mentor-carousel-dots" aria-label="Choose a team member">
                {featuredMentors.map((mentor, index) => (
                  <button
                    type="button"
                    key={mentor.id}
                    className={index === activeMentorIndex ? "active" : ""}
                    onClick={() => setActiveMentorIndex(index)}
                    aria-label={`Show ${mentor.name}`}
                    aria-current={index === activeMentorIndex ? "true" : undefined}
                  />
                ))}
              </div>

              <div className="mentor-carousel-progress" aria-hidden="true">
                <span
                  key={activeMentor.id}
                  onAnimationEnd={() => {
                    setActiveMentorIndex(
                      (current) => (current + 1) % featuredMentors.length,
                    );
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. 4-STEP SEAMLESS JOURNEY */}
      <section className="home-section journey-section">
        <div className="home-container">
          <div className="section-heading text-center reveal">
            <span className="section-kicker">{t("home.howItWorks")}</span>
            <h2>{t("home.pathTitle")}</h2>
          </div>

          <div className="journey-grid reveal">
            <div className="journey-step-card">
              <div className="step-badge">1</div>
              <h4>{t("home.step1Title")}</h4>
              <p>{t("home.step1Desc")}</p>
            </div>

            <div className="journey-step-card">
              <div className="step-badge">2</div>
              <h4>{t("home.step2Title")}</h4>
              <p>{t("home.step2Desc")}</p>
            </div>

            <div className="journey-step-card">
              <div className="step-badge">3</div>
              <h4>{t("home.step3Title")}</h4>
              <p>{t("home.step3Desc")}</p>
            </div>

            <div className="journey-step-card">
              <div className="step-badge">4</div>
              <h4>{t("home.step4Title")}</h4>
              <p>{t("home.step4Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. INTERACTIVE FAQ ACCORDION */}
      <section className="home-section faq-section">
        <div className="home-container faq-container">
          <div className="section-heading text-center reveal">
            <span className="section-kicker">{t("home.faqKicker")}</span>
            <h2>{t("home.faqTitle")}</h2>
            <p className="section-desc">{t("home.faqSubtitle")}</p>
          </div>

          <div className="faq-accordion-list reveal">
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  className={`faq-accordion-item ${isOpen ? "open" : ""}`}
                  key={index}
                >
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    aria-expanded={isOpen}
                  >
                    <span>{t(`home.${item.qKey}`)}</span>
                    <span className="faq-toggle-icon">
                      <IoChevronDownOutline />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="faq-answer-pane">
                      <p>{t(`home.${item.aKey}`)}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </main>
  );
};

export default Home;
