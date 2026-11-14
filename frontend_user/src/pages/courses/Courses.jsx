import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FiArrowRight,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiSearch,
  FiVideo,
  FiX,
  FiAward,
  FiLayers,
} from "react-icons/fi";
import CourseArtworkBanner from "../../components/ui/CourseArtworkBanner";
import { SkeletonGrid } from "../../components/ui/LoadingStates";
import { useLanguage } from "../../context/LanguageContext";
import { fetchCourses } from "../../services/courseService";
import { enrichCourseRecord } from "../../utils/bilingualCatalog";
import "./Courses.css";

const Courses = () => {
  const { language, t } = useLanguage();
  const isKm = language === "km";
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("search") || "";
  const setQuery = (value) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set("search", value);
        else next.delete("search");
        return next;
      },
      { replace: true },
    );
  };
  const [category, setCategory] = useState("All");

  useEffect(() => {
    fetchCourses()
      .then((response) => {
        const raw = response.courses || [];
        setCourses(raw.map((c, idx) => enrichCourseRecord(c, idx)));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(courses.map((course) => course.category))],
    [courses],
  );

  const visibleCourses = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return courses.filter(
      (course) =>
        (category === "All" || course.category === category) &&
        (!needle ||
          String(course.titleEn || "").toLowerCase().includes(needle) ||
          String(course.titleKm || "").toLowerCase().includes(needle) ||
          String(course.descEn || "").toLowerCase().includes(needle) ||
          String(course.descKm || "").toLowerCase().includes(needle)),
    );
  }, [category, courses, query]);

  return (
    <main className="courses-page">
      <section className="courses-hero">
        <div className="courses-hero-glow" />
        <div className="container courses-hero-inner">
          <div className="courses-hero-content">
            <div className="courses-hero-badge">
              <FiAward className="hero-badge-icon" />
              <span>
                {isKm
                  ? "បណ្ណាល័យវគ្គសិក្សាផ្លូវការ • ២០ វគ្គសិក្សាស្តង់ដារ"
                  : "Official Course Library • 20 Career Tracks"}
              </span>
            </div>
            <h1>
              {isKm
                ? "រៀនជំនាញបច្ចេកវិទ្យា និងកសាងអាជីពឱ្យរីកចម្រើន"
                : "Master Practical Tech Skills & Build Your Career"}
            </h1>
            <p className="courses-hero-desc">
              {isKm
                ? "សមាជិកដែលបានចុះឈ្មោះគណនី អាចអានឯកសារមេរៀន PDF ដោយឥតគិតថ្លៃគ្រប់មេរៀន និងអាចដោះសោវីដេអូបង្រៀនពេញលេញក្នុងតម្លៃថេរ $12.00 ក្នុងមួយវគ្គសិក្សា។"
                : "Registered members get free access to all lesson PDF study guides, and can unlock full HD video lessons for a fixed $12.00 per course."}
            </p>

            <div className="courses-hero-stats-row">
              <div className="hero-stat-pill">
                <strong>២០</strong>
                <span>{isKm ? "វគ្គសិក្សាជំនាញ" : "Career Courses"}</span>
              </div>
              <div className="hero-stat-pill">
                <strong>៨០+</strong>
                <span>{isKm ? "មេរៀនអនុវត្តជាក់ស្តែង" : "Structured Lessons"}</span>
              </div>
              <div className="hero-stat-pill highlight-free">
                <strong>100%</strong>
                <span>{isKm ? "ឯកសារ PDF ឥតគិតថ្លៃ" : "Free Study Guides"}</span>
              </div>
              <div className="hero-stat-pill highlight-paid">
                <strong>$12</strong>
                <span>{isKm ? "ដោះសោវីដេអូពេញលេញ" : "Video Unlock (KHQR)"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container courses-library">
        {/* Top Control Bar: Results count & Search */}
        <div className="courses-toolbar-top">
          <div className="courses-count-indicator">
            <span className="count-live-dot" />
            <span>
              {isKm
                ? `បង្ហាញ ${visibleCourses.length} នៃ ${courses.length} វគ្គសិក្សា`
                : `Showing ${visibleCourses.length} of ${courses.length} courses`}
            </span>
          </div>

          <div className="course-search-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              value={query}
              aria-label={t("coursesPage.searchPlaceholder")}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                isKm
                  ? "ស្វែងរកតាមឈ្មោះវគ្គសិក្សា បច្ចេកវិទ្យា ឬជំនាញ…"
                  : "Search courses by title, tech stack, or skill…"
              }
              className="course-search-input"
            />
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <FiX />
              </button>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <div
          className="course-category-scroll-track"
          aria-label={t("coursesPage.categoriesLabel")}
        >
          {categories.map((item) => {
            const matchedCourse = courses.find((c) => c.category === item);
            const count =
              item === "All"
                ? courses.length
                : courses.filter((c) => c.category === item).length;
            const label =
              item === "All"
                ? isKm
                  ? "ទាំងអស់"
                  : "All Courses"
                : isKm && matchedCourse?.catKm
                  ? matchedCourse.catKm
                  : item;

            return (
              <button
                type="button"
                key={item}
                className={`category-chip ${category === item ? "active" : ""}`}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                <span>{label}</span>
                <span className="chip-badge">{count}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <SkeletonGrid
            className="courses-grid"
            count={6}
            label={t("coursesPage.loading")}
            variant="course"
          />
        ) : error ? (
          <div className="course-state error">
            <strong>{t("coursesPage.loadErrorTitle")}</strong>
            <p>{error}</p>
          </div>
        ) : visibleCourses.length ? (
          <div className="courses-grid">
            {visibleCourses.map((course) => {
              const coursePath = `/courses/${course.slug}`;
              const displayTitle = isKm ? course.titleKm : course.titleEn;
              const displayDesc = isKm ? course.descKm : course.descEn;
              const displayLevel = isKm ? course.levelKm : course.levelEn;
              const displayDuration = isKm
                ? course.durationKm || course.duration || "6 ម៉ោង"
                : course.durationEn || "6h 15m";

              return (
                <article key={course.id} className="ck-course-card">
                  <Link
                    to={coursePath}
                    className="ck-course-media-link"
                    aria-label={t("coursesPage.viewCourse", {
                      title: displayTitle,
                    })}
                  >
                    <CourseArtworkBanner course={course} />
                  </Link>

                  <div className="ck-course-body">
                    <div className="ck-card-access-row">
                      <div className="ck-card-access-pills">
                        <span className="ck-access-badge badge-free">
                          <FiFileText />
                          <span>{isKm ? "PDF ឥតគិតថ្លៃ" : "Free PDF"}</span>
                        </span>
                        <span className="ck-access-badge badge-paid">
                          <FiVideo />
                          <span>{isKm ? "វីដេអូ $12" : "Video $12"}</span>
                        </span>
                      </div>
                      <span className={`ck-level-tag level-${(course.level || "beginner").toLowerCase()}`}>
                        {displayLevel}
                      </span>
                    </div>

                    <h3 className="ck-card-title">
                      <Link to={coursePath} title={displayTitle}>
                        {displayTitle}
                      </Link>
                    </h3>

                    <p className="ck-card-desc">{displayDesc}</p>

                    <div className="ck-instructor-line">
                      <span className="ck-instructor-avatar-wrap">🎓</span>
                      <span className="ck-instructor-name">
                        {isKm ? "បណ្ឌិត្យសភា Smart Community" : "Smart Community Academy"}
                      </span>
                      <span className="ck-verified-badge" title="Official Verified Course">✓</span>
                    </div>

                    <div className="ck-card-meta-row">
                      <span>
                        <FiBookOpen />
                        {course.lessons || course.lessonCount || 4}{" "}
                        {isKm ? "មេរៀន" : "Lessons"}
                      </span>
                      <span>
                        <FiClock />
                        {displayDuration}
                      </span>
                    </div>

                    <Link to={coursePath} className="ck-card-cta-full">
                      <span>
                        {course.isEnrolled
                          ? isKm
                            ? "ចូលរៀនបន្ត"
                            : "Continue Learning"
                          : isKm
                            ? "មើលមេរៀន & អាន PDF"
                            : "View Course & Free PDF"}
                      </span>
                      <FiArrowRight className="cta-arrow" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="course-empty-state">
            <FiSearch className="empty-icon" />
            <strong>{isKm ? "រកមិនឃើញវគ្គសិក្សាដែលត្រូវនឹងពាក្យស្វែងរកទេ" : "No courses match your search"}</strong>
            <p>
              {isKm
                ? "សូមសាកល្បងផ្លាស់ប្តូរពាក្យគន្លឹះ ឬជ្រើសរើសប្រភេទវគ្គសិក្សា «ទាំងអស់» ឡើងវិញ។"
                : "Try adjusting your search terms or switch category to 'All Courses'."}
            </p>
            <button
              type="button"
              className="reset-search-btn"
              onClick={() => {
                setQuery("");
                setCategory("All");
              }}
            >
              {isKm ? "កំណត់ឡើងវិញទាំងអស់" : "Reset All Filters"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

export default Courses;
