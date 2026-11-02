import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  FiSearch,
  FiX,
  FiBookOpen,
  FiUsers,
  FiBriefcase,
  FiRepeat,
  FiMessageSquare,
  FiMapPin,
  FiClock,
  FiFilter,
  FiArrowRight,
  FiCheckCircle,
  FiDollarSign,
  FiSliders,
} from "react-icons/fi";
import { fetchGlobalSearch } from "../../services/searchService";
import { useLanguage } from "../../context/LanguageContext";
import "./SearchResultsPage.css";

// Helper component for query text highlighting
function HighlightedText({ text = "", highlight = "" }) {
  if (!highlight || !text) return <>{text}</>;
  const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = String(text).split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="search-highlight-mark">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isKm = language === "km";

  // URL State
  const queryParam = searchParams.get("q") || "";
  const typeParam = searchParams.get("type") || "all";
  const levelParam = searchParams.get("level") || "All";
  const priceParam = searchParams.get("price") || "All";
  const jobTypeParam = searchParams.get("jobType") || "All";
  const sortParam = searchParams.get("sort") || "relevance";

  // Local State
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [activeType, setActiveType] = useState(typeParam);
  const [levelFilter, setLevelFilter] = useState(levelParam);
  const [priceFilter, setPriceFilter] = useState(priceParam);
  const [jobTypeFilter, setJobTypeFilter] = useState(jobTypeParam);
  const [sortOrder, setSortOrder] = useState(sortParam);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState({
    query: "",
    type: "all",
    counts: { all: 0, courses: 0, mentors: 0, jobs: 0, skills: 0, community: 0 },
    data: { courses: [], mentors: [], jobs: [], skills: [], community: [] },
  });

  const abortControllerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Sync state when URL search params change
  useEffect(() => {
    setSearchQuery(queryParam);
    setActiveType(typeParam);
    setLevelFilter(levelParam);
    setPriceFilter(priceParam);
    setJobTypeFilter(jobTypeParam);
    setSortOrder(sortParam);
  }, [queryParam, typeParam, levelParam, priceParam, jobTypeParam, sortParam]);

  // Execute Search API call
  const executeSearch = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchGlobalSearch(
        {
          q: queryParam,
          type: typeParam,
          level: levelParam !== "All" ? levelParam : null,
          price: priceParam !== "All" ? priceParam : null,
          jobType: jobTypeParam !== "All" ? jobTypeParam : null,
          sort: sortParam !== "relevance" ? sortParam : null,
        },
        controller.signal
      );

      setResults(data);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Search failed:", err);
        setError(isKm ? "មានបញ្ហាក្នុងការទាញយកទិន្នន័យស្វែងរក។ សូមព្យាយាមម្តងទៀត។" : "Failed to load search results. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [queryParam, typeParam, levelParam, priceParam, jobTypeParam, sortParam, isKm]);

  useEffect(() => {
    executeSearch();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [executeSearch]);

  // Update URL params helper
  const updateParams = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === null || v === "" || v === "All" || v === "all" || v === "relevance") {
        if (k === "type" && v === "all") updated.delete("type");
        else if (k !== "q") updated.delete(k);
        else updated.set(k, "");
      } else {
        updated.set(k, v);
      }
    });
    setSearchParams(updated, { replace: false });
  };

  // Handle Search Input Submit
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    updateParams({ q: searchQuery.trim() });
  };

  // Handle Clear Search
  const handleClear = () => {
    setSearchQuery("");
    updateParams({ q: "" });
    searchInputRef.current?.focus();
  };

  // Category Tabs Configuration
  const tabs = useMemo(
    () => [
      {
        id: "all",
        label: isKm ? "ទាំងអស់" : "All Results",
        icon: FiSliders,
        count: results.counts.all,
      },
      {
        id: "courses",
        label: isKm ? "វគ្គសិក្សា" : "Courses",
        icon: FiBookOpen,
        count: results.counts.courses,
      },
      {
        id: "mentors",
        label: isKm ? "អ្នកណែនាំ" : "Mentors",
        icon: FiUsers,
        count: results.counts.mentors,
      },
      {
        id: "jobs",
        label: isKm ? "ឱកាសការងារ" : "Jobs & Internships",
        icon: FiBriefcase,
        count: results.counts.jobs,
      },
      {
        id: "skills",
        label: isKm ? "ផ្លាស់ប្តូរជំនាញ" : "Skill Exchange",
        icon: FiRepeat,
        count: results.counts.skills,
      },
      {
        id: "community",
        label: isKm ? "សហគមន៍" : "Community",
        icon: FiMessageSquare,
        count: results.counts.community,
      },
    ],
    [isKm, results.counts]
  );

  const handleTabClick = (tabId) => {
    setActiveType(tabId);
    updateParams({ type: tabId });
  };

  return (
    <div className="search-page-container">
      {/* 1. HERO SEARCH HEADER */}
      <section className="search-hero-banner glass">
        <div className="search-hero-content">
          <div className="search-badge-pill">
            <FiSearch className="badge-icon" />
            <span>{isKm ? "ប្រព័ន្ធស្វែងរកទូទាំងវេទិកា V6" : "Unified Global Discovery V6"}</span>
          </div>

          <h1 className="search-hero-title">
            {isKm ? (
              <>
                ស្វែងរកអ្វីដែលអ្នកត្រូវការក្នុង <span className="text-gradient">Smart Community</span>
              </>
            ) : (
              <>
                Find Anything in <span className="text-gradient">Smart Community</span>
              </>
            )}
          </h1>

          <p className="search-hero-desc">
            {isKm
              ? "ស្វែងរកវគ្គសិក្សា អ្នកណែនាំជំនាញ ឱកាសការងារ ដៃគូហាត់សមជំនាញ និងការពិភាក្សាក្នុងសហគមន៍នៅកន្លែងតែមួយ។"
              : "Explore courses, verified mentors, internships, skill exchange partners, and community knowledge from one place."}
          </p>

          {/* Unified Global Search Input Bar */}
          <form className="search-bar-unified glass" onSubmit={handleSearchSubmit}>
            <FiSearch className="search-bar-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="search-bar-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isKm
                  ? "វាយពាក្យគន្លឹះ (ឧ. React, Cloud, Python, Intern, ឬឈ្មោះអ្នកណែនាំ)..."
                  : "Search anything (e.g., React, Cloud, Python, Intern, or Mentor name)..."
              }
              aria-label={isKm ? "ស្វែងរក" : "Search"}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-bar-clear-btn"
                onClick={handleClear}
                aria-label={isKm ? "សម្អាត" : "Clear input"}
              >
                <FiX />
              </button>
            )}
            <button type="submit" className="btn btn-primary search-bar-submit-btn">
              {isKm ? "ស្វែងរក" : "Search"}
            </button>
          </form>

          {/* Popular Suggested Query Chips */}
          <div className="search-suggested-chips">
            <span className="chips-label">{isKm ? "ពាក្យពេញនិយម៖" : "Trending:"}</span>
            {["React", "Node.js", "Python", "Cloud", "UI/UX", "Internship"].map((chip) => (
              <button
                key={chip}
                type="button"
                className="chip-btn"
                onClick={() => {
                  setSearchQuery(chip);
                  updateParams({ q: chip });
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. CATEGORY TABS & FILTER BAR */}
      <section className="search-control-bar glass">
        <div className="search-tabs-scrollable">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`search-tab-item ${isActive ? "active" : ""}`}
                onClick={() => handleTabClick(tab.id)}
              >
                <Icon className="tab-icon" />
                <span className="tab-label">{tab.label}</span>
                <span className="tab-count-badge">{tab.count}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Category Filters */}
        <div className="search-filter-controls">
          {/* Courses Filters */}
          {(activeType === "courses" || activeType === "all") && (
            <>
              <div className="filter-select-wrap">
                <FiFilter className="filter-select-icon" />
                <select
                  value={levelFilter}
                  onChange={(e) => {
                    setLevelFilter(e.target.value);
                    updateParams({ level: e.target.value });
                  }}
                  className="filter-select"
                  aria-label="Level Filter"
                >
                  <option value="All">{isKm ? "កម្រិតទាំងអស់" : "All Levels"}</option>
                  <option value="beginner">{isKm ? "កម្រិតដំបូង (Beginner)" : "Beginner"}</option>
                  <option value="intermediate">{isKm ? "កម្រិតមធ្យម (Intermediate)" : "Intermediate"}</option>
                  <option value="advanced">{isKm ? "កម្រិតខ្ពស់ (Advanced)" : "Advanced"}</option>
                </select>
              </div>

              <div className="filter-select-wrap">
                <FiDollarSign className="filter-select-icon" />
                <select
                  value={priceFilter}
                  onChange={(e) => {
                    setPriceFilter(e.target.value);
                    updateParams({ price: e.target.value });
                  }}
                  className="filter-select"
                  aria-label="Price Filter"
                >
                  <option value="All">{isKm ? "តម្លៃទាំងអស់" : "All Prices"}</option>
                  <option value="Free">{isKm ? "ឥតគិតថ្លៃ (Free)" : "Free"}</option>
                  <option value="Paid">{isKm ? "មានគិតថ្លៃ (Paid)" : "Paid"}</option>
                </select>
              </div>
            </>
          )}

          {/* Job Type Filter */}
          {(activeType === "jobs" || activeType === "all") && (
            <div className="filter-select-wrap">
              <FiBriefcase className="filter-select-icon" />
              <select
                value={jobTypeFilter}
                onChange={(e) => {
                  setJobTypeFilter(e.target.value);
                  updateParams({ jobType: e.target.value });
                }}
                className="filter-select"
                aria-label="Job Type Filter"
              >
                <option value="All">{isKm ? "ប្រភេទការងារទាំងអស់" : "All Job Types"}</option>
                <option value="full_time">{isKm ? "ពេញម៉ោង (Full Time)" : "Full Time"}</option>
                <option value="part_time">{isKm ? "ក្រៅម៉ោង (Part Time)" : "Part Time"}</option>
                <option value="internship">{isKm ? "កម្មសិក្សា (Internship)" : "Internship"}</option>
              </select>
            </div>
          )}

          {/* Sorting */}
          <div className="filter-select-wrap">
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                updateParams({ sort: e.target.value });
              }}
              className="filter-select"
              aria-label="Sort Order"
            >
              <option value="relevance">{isKm ? "តម្រៀបតាមភាពសមស្រប" : "Sort: Relevance"}</option>
              <option value="newest">{isKm ? "តម្រៀបតាមថ្មីបំផុត" : "Sort: Newest"}</option>
            </select>
          </div>
        </div>
      </section>

      {/* 3. SEARCH RESULTS DISPLAY */}
      <main className="search-results-main">
        {/* Loading Skeletons */}
        {loading && (
          <div className="search-skeletons-grid">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="search-card-skeleton glass pulse">
                <div className="skeleton-thumb" />
                <div className="skeleton-content">
                  <div className="skeleton-line-sm" />
                  <div className="skeleton-line-lg" />
                  <div className="skeleton-line-md" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="search-state-card glass search-error-state">
            <div className="state-icon-wrap error-icon">
              <FiX />
            </div>
            <h3>{isKm ? "មានបញ្ហាពេលស្វែងរក" : "Something went wrong"}</h3>
            <p>{error}</p>
            <button type="button" className="btn btn-primary" onClick={executeSearch}>
              {isKm ? "ព្យាយាមម្តងទៀត" : "Retry Search"}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && results.counts.all === 0 && (
          <div className="search-state-card glass search-empty-state">
            <div className="state-icon-wrap empty-icon">
              <FiSearch />
            </div>
            <h3>
              {isKm
                ? `រកមិនឃើញលទ្ធផលសម្រាប់ "${queryParam || "ការស្វែងរក"}" ទេ`
                : `No results found for "${queryParam || "your query"}"`}
            </h3>
            <p>
              {isKm
                ? "សូមពិនិត្យមើលអក្ខរាវិរុទ្ធ ឬសាកល្បងស្វែងរកដោយប្រើពាក្យគន្លឹះទូទៅបន្ថែមទៀត។"
                : "Try checking your spelling, removing filters, or searching for broader terms like 'React', 'Cloud', or 'Mentorship'."}
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearchQuery("");
                setLevelFilter("All");
                setPriceFilter("All");
                setJobTypeFilter("All");
                setSearchParams({});
              }}
            >
              {isKm ? "សម្អាតការស្វែងរក និង Filters" : "Clear All Search & Filters"}
            </button>
          </div>
        )}

        {/* Results Content */}
        {!loading && !error && results.counts.all > 0 && (
          <div className="search-results-content">
            {/* Summary Header */}
            <div className="search-results-meta-header">
              <span className="results-count-text">
                {isKm
                  ? `រកឃើញ ${results.counts[activeType] || results.counts.all} លទ្ធផល${queryParam ? ` សម្រាប់ "${queryParam}"` : ""
                  }`
                  : `Found ${results.counts[activeType] || results.counts.all} results${queryParam ? ` for "${queryParam}"` : ""
                  }`}
              </span>
            </div>

            {/* SECTION 1: COURSES */}
            {(activeType === "all" || activeType === "courses") &&
              results.data.courses.length > 0 && (
                <section className="search-category-section">
                  <div className="section-header-row">
                    <div className="section-title-wrap">
                      <FiBookOpen className="sec-icon icon-courses" />
                      <h2>{isKm ? "វគ្គសិក្សា (Courses)" : "Courses"}</h2>
                      <span className="sec-badge">{results.counts.courses}</span>
                    </div>
                    {activeType === "all" && results.counts.courses > 4 && (
                      <button
                        type="button"
                        className="see-all-link"
                        onClick={() => handleTabClick("courses")}
                      >
                        {isKm ? "មើលវគ្គសិក្សាទាំងអស់" : "View all courses"} <FiArrowRight />
                      </button>
                    )}
                  </div>

                  <div className="search-cards-grid">
                    {results.data.courses.map((course) => (
                      <article key={course.id} className="search-card course-card glass">
                        {course.imageUrl && (
                          <div className="card-media-wrap">
                            <img src={course.imageUrl} alt={course.title} className="card-thumb" />
                            <span className="badge-pill level-pill">{course.level}</span>
                          </div>
                        )}
                        <div className="card-body">
                          <span className="card-category-tag">{course.courseCategory}</span>
                          <h3 className="card-title">
                            <Link to={course.route}>
                              <HighlightedText text={course.title} highlight={queryParam} />
                            </Link>
                          </h3>
                          <p className="card-instructor">
                            <FiUsers className="inline-icon" /> {course.subtitle}
                          </p>
                          <p className="card-description">
                            <HighlightedText text={course.description} highlight={queryParam} />
                          </p>
                          <div className="card-footer-row">
                            <span className="card-price">
                              {course.price === 0 ? (
                                <strong className="text-free">{isKm ? "ឥតគិតថ្លៃ" : "Free"}</strong>
                              ) : (
                                <strong>${course.price} {course.currency}</strong>
                              )}
                            </span>
                            <Link to={course.route} className="btn btn-outline-sm">
                              {isKm ? "មើលវគ្គសិក្សា" : "Explore Course"} <FiArrowRight />
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

            {/* SECTION 2: MENTORS */}
            {(activeType === "all" || activeType === "mentors") &&
              results.data.mentors.length > 0 && (
                <section className="search-category-section">
                  <div className="section-header-row">
                    <div className="section-title-wrap">
                      <FiUsers className="sec-icon icon-mentors" />
                      <h2>{isKm ? "អ្នកណែនាំជំនាញ (Mentors)" : "Mentors"}</h2>
                      <span className="sec-badge">{results.counts.mentors}</span>
                    </div>
                    {activeType === "all" && results.counts.mentors > 4 && (
                      <button
                        type="button"
                        className="see-all-link"
                        onClick={() => handleTabClick("mentors")}
                      >
                        {isKm ? "មើលអ្នកណែនាំទាំងអស់" : "View all mentors"} <FiArrowRight />
                      </button>
                    )}
                  </div>

                  <div className="search-cards-grid">
                    {results.data.mentors.map((mentor) => (
                      <article key={mentor.id} className="search-card mentor-card glass">
                        <div className="mentor-card-header">
                          <img
                            src={
                              mentor.imageUrl ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                mentor.title
                              )}&background=2563eb&color=fff`
                            }
                            alt={mentor.title}
                            className="mentor-avatar"
                          />
                          <div className="mentor-header-info">
                            <h3 className="card-title">
                              <Link to={mentor.route}>
                                <HighlightedText text={mentor.title} highlight={queryParam} />
                              </Link>
                              {mentor.isVerified && (
                                <FiCheckCircle className="verified-badge-icon" title="Verified Mentor" />
                              )}
                            </h3>
                            <p className="mentor-profession">
                              <HighlightedText text={mentor.subtitle} highlight={queryParam} />
                            </p>
                          </div>
                        </div>
                        <div className="card-body">
                          <p className="card-description">
                            <HighlightedText text={mentor.description} highlight={queryParam} />
                          </p>
                          {mentor.skills && mentor.skills.length > 0 && (
                            <div className="skills-pill-group">
                              {mentor.skills.map((skill, idx) => (
                                <span key={idx} className="skill-mini-pill">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="card-footer-row">
                            <span className="meta-text">
                              <FiMapPin className="inline-icon" /> {mentor.location}
                            </span>
                            <Link to={mentor.route} className="btn btn-outline-sm">
                              {isKm ? "កក់ម៉ោងពិភាក្សា" : "Book Mentor"} <FiArrowRight />
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

            {/* SECTION 3: JOBS & INTERNSHIPS */}
            {(activeType === "all" || activeType === "jobs") &&
              results.data.jobs.length > 0 && (
                <section className="search-category-section">
                  <div className="section-header-row">
                    <div className="section-title-wrap">
                      <FiBriefcase className="sec-icon icon-jobs" />
                      <h2>{isKm ? "ឱកាសការងារ (Jobs & Internships)" : "Jobs & Internships"}</h2>
                      <span className="sec-badge">{results.counts.jobs}</span>
                    </div>
                    {activeType === "all" && results.counts.jobs > 4 && (
                      <button
                        type="button"
                        className="see-all-link"
                        onClick={() => handleTabClick("jobs")}
                      >
                        {isKm ? "មើលការងារទាំងអស់" : "View all jobs"} <FiArrowRight />
                      </button>
                    )}
                  </div>

                  <div className="search-cards-grid">
                    {results.data.jobs.map((job) => (
                      <article key={job.id} className="search-card job-card glass">
                        <div className="job-card-header">
                          <div className="company-logo-avatar">
                            {job.imageUrl ? (
                              <img src={job.imageUrl} alt={job.subtitle} />
                            ) : (
                              <span>{job.subtitle?.charAt(0) || "J"}</span>
                            )}
                          </div>
                          <div className="job-header-meta">
                            <h3 className="card-title">
                              <Link to={job.route}>
                                <HighlightedText text={job.title} highlight={queryParam} />
                              </Link>
                            </h3>
                            <p className="company-name">
                              {job.subtitle}
                              {job.isCompanyVerified && (
                                <FiCheckCircle className="verified-badge-icon" title="Verified Company" />
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="card-body">
                          <p className="card-description">
                            <HighlightedText text={job.description} highlight={queryParam} />
                          </p>
                          <div className="job-badges-group">
                            <span className="badge-pill">{job.jobType.replace("_", " ")}</span>
                            <span className="badge-pill stipend-pill">{job.stipend}</span>
                            <span className="meta-text">
                              <FiMapPin className="inline-icon" /> {job.location}
                            </span>
                          </div>
                          <div className="card-footer-row">
                            <span className="meta-text">
                              <FiClock className="inline-icon" />{" "}
                              {job.deadline
                                ? new Date(job.deadline).toLocaleDateString()
                                : isKm
                                  ? "បើកទទួលពាក្យ"
                                  : "Open deadline"}
                            </span>
                            <Link to={job.route} className="btn btn-outline-sm">
                              {isKm ? "ដាក់ពាក្យឥឡូវ" : "Apply Now"} <FiArrowRight />
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

            {/* SECTION 4: SKILL EXCHANGE */}
            {(activeType === "all" || activeType === "skills") &&
              results.data.skills.length > 0 && (
                <section className="search-category-section">
                  <div className="section-header-row">
                    <div className="section-title-wrap">
                      <FiRepeat className="sec-icon icon-skills" />
                      <h2>{isKm ? "ផ្លាស់ប្តូរជំនាញ (Skill Exchange)" : "Skill Exchange"}</h2>
                      <span className="sec-badge">{results.counts.skills}</span>
                    </div>
                    {activeType === "all" && results.counts.skills > 4 && (
                      <button
                        type="button"
                        className="see-all-link"
                        onClick={() => handleTabClick("skills")}
                      >
                        {isKm ? "មើលដៃគូជំនាញទាំងអស់" : "View all skill partners"} <FiArrowRight />
                      </button>
                    )}
                  </div>

                  <div className="search-cards-grid">
                    {results.data.skills.map((skillUser) => (
                      <article key={skillUser.id} className="search-card skill-card glass">
                        <div className="skill-card-header">
                          <img
                            src={
                              skillUser.imageUrl ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                skillUser.title
                              )}&background=6366f1&color=fff`
                            }
                            alt={skillUser.title}
                            className="member-avatar"
                          />
                          <div>
                            <h3 className="card-title">
                              <Link to={skillUser.route}>
                                <HighlightedText text={skillUser.title} highlight={queryParam} />
                              </Link>
                            </h3>
                            <p className="member-role">{skillUser.subtitle}</p>
                          </div>
                        </div>
                        <div className="card-body">
                          {skillUser.offeredSkills?.length > 0 && (
                            <div className="swap-skills-block">
                              <span className="swap-label teach-label">
                                {isKm ? "ចេះបង្រៀន (Can Teach):" : "Can Teach:"}
                              </span>
                              <div className="skills-pill-group">
                                {skillUser.offeredSkills.map((s, i) => (
                                  <span key={i} className="skill-mini-pill teach-pill">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {skillUser.wantedSkills?.length > 0 && (
                            <div className="swap-skills-block">
                              <span className="swap-label learn-label">
                                {isKm ? "ចង់រៀន (Wants to Learn):" : "Wants to Learn:"}
                              </span>
                              <div className="skills-pill-group">
                                {skillUser.wantedSkills.map((s, i) => (
                                  <span key={i} className="skill-mini-pill learn-pill">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="card-footer-row">
                            <span className="meta-text">
                              <FiMapPin className="inline-icon" /> {skillUser.location}
                            </span>
                            <Link to={skillUser.route} className="btn btn-outline-sm">
                              {isKm ? "ស្នើប្តូរជំនាញ" : "Request Swap"} <FiArrowRight />
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

            {/* SECTION 5: COMMUNITY FORUM */}
            {(activeType === "all" || activeType === "community") &&
              results.data.community.length > 0 && (
                <section className="search-category-section">
                  <div className="section-header-row">
                    <div className="section-title-wrap">
                      <FiMessageSquare className="sec-icon icon-community" />
                      <h2>{isKm ? "សហគមន៍ពិភាក្សា (Community Forum)" : "Community Forum"}</h2>
                      <span className="sec-badge">{results.counts.community}</span>
                    </div>
                    {activeType === "all" && results.counts.community > 4 && (
                      <button
                        type="button"
                        className="see-all-link"
                        onClick={() => handleTabClick("community")}
                      >
                        {isKm ? "មើលការពិភាក្សាទាំងអស់" : "View all discussions"} <FiArrowRight />
                      </button>
                    )}
                  </div>

                  <div className="search-cards-grid">
                    {results.data.community.map((post) => (
                      <article key={post.id} className="search-card forum-card glass">
                        <div className="card-body">
                          <span className="card-category-tag">{post.forumCategory}</span>
                          <h3 className="card-title">
                            <Link to={post.route}>
                              <HighlightedText text={post.title} highlight={queryParam} />
                            </Link>
                          </h3>
                          <p className="card-description">
                            <HighlightedText text={post.description} highlight={queryParam} />
                          </p>
                          <div className="card-footer-row">
                            <span className="meta-text">{post.subtitle}</span>
                            <Link to={post.route} className="btn btn-outline-sm">
                              {isKm ? "អានការពិភាក្សា" : "Read Discussion"} <FiArrowRight />
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
          </div>
        )}
      </main>
    </div>
  );
}
