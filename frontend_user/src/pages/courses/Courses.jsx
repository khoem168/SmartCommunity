import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FaCode,
  FaDatabase,
  FaFigma,
  FaGitAlt,
  FaNodeJs,
  FaPython,
  FaReact,
} from "react-icons/fa";
import {
  FiArrowRight,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiPlayCircle,
  FiSearch,
} from "react-icons/fi";
import { SkeletonGrid } from "../../components/ui/LoadingStates";
import TiltCard from "../../components/ui/TiltCard";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { fetchCourses } from "../../services/courseService";
import { enrichCourseRecord } from "../../utils/bilingualCatalog";
import "./Courses.css";

const COVER_ICON_MAP = {
  react: FaReact,
  node: FaNodeJs,
  figma: FaFigma,
  python: FaPython,
  sql: FaDatabase,
  git: FaGitAlt,
};

const money = (amount, currency, locale = "en-US") =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KHR" ? 0 : 2,
  }).format(Number(amount || 0));

const Courses = () => {
  const { language, t } = useLanguage();
  const { user } = useGlobleContext();
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
          <div>
            <p className="courses-kicker">Smart Community Academy</p>
            <h1>{t("coursesPage.heroTitle")}</h1>
            <p>{t("coursesPage.heroDescription")}</p>
            <div className="courses-trust-row">
              <span>
                <FiPlayCircle /> {t("coursesPage.freePreviews")}
              </span>
              <span>
                <FiCheckCircle /> {t("coursesPage.lifetimeAccess")}
              </span>
              <span>
                <FiBookOpen /> {t("coursesPage.resources")}
              </span>
            </div>
          </div>
          <div className="courses-hero-stat">
            <strong>{loading || error ? "—" : courses.length}</strong>
            <span>{t("coursesPage.paths")}</span>
            <small>{t("coursesPage.anyDevice")}</small>
          </div>
        </div>
      </section>

      <section className="container courses-library">
        <header className="courses-library-header">
          <div>
            <p className="courses-kicker">{t("coursesPage.library")}</p>
            <h2>{t("coursesPage.chooseSkill")}</h2>
          </div>
          <label className="course-search">
            <FiSearch />
            <input
              value={query}
              aria-label={t("coursesPage.searchPlaceholder")}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("coursesPage.searchPlaceholder")}
            />
          </label>
        </header>

        <div
          className="course-filters"
          aria-label={t("coursesPage.categoriesLabel")}
        >
          {categories.map((item) => {
            const matchedCourse = courses.find((c) => c.category === item);
            const label =
              item === "All"
                ? t("coursesPage.all")
                : isKm && matchedCourse?.catKm
                  ? matchedCourse.catKm
                  : item;
            return (
              <button
                type="button"
                key={item}
                className={category === item ? "active" : ""}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {label}
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
              const accessPath = user
                ? coursePath
                : `/register?redirect=${encodeURIComponent(coursePath)}`;
              const isFree = Number(course.price || 0) <= 0;
              const priceLabel = isFree
                ? isKm
                  ? "ឥតគិតថ្លៃ"
                  : "Free"
                : money(
                    course.price,
                    course.currency || "USD",
                    isKm ? "km-KH" : "en-US",
                  );
              const displayTitle = isKm ? course.titleKm : course.titleEn;
              const displayDesc = isKm ? course.descKm : course.descEn;
              const displayCat = isKm ? course.catKm : course.catEn;
              const displayLevel = isKm ? course.levelKm : course.levelEn;
              const CoverIcon = COVER_ICON_MAP[course.iconKey] || FaCode;

              return (
                <TiltCard key={course.id} className="course-card">
                  <Link
                    to={accessPath}
                    className="course-cover course-cover-graphic"
                    style={{ background: course.gradient }}
                    aria-label={t("coursesPage.viewCourse", {
                      title: displayTitle,
                    })}
                  >
                    <div className="course-cover-dots" />
                    <span className="course-level">{displayLevel}</span>
                    <span className={`course-price-badge ${isFree ? "free" : "paid"}`}>
                      {priceLabel}
                    </span>
                    <div className="course-cover-art">
                      <div className="course-cover-emblem">
                        <CoverIcon />
                      </div>
                      <div className="course-cover-titles">
                        <strong>{course.bannerTitle}</strong>
                        <span>{course.bannerSub}</span>
                      </div>
                    </div>
                  </Link>
                  <div className="course-card-content">
                    <div className="course-card-topline">
                      <span className="course-category">{displayCat}</span>
                      {course.isEnrolled && (
                        <span className="course-owned">
                          <FiCheckCircle /> {t("coursesPage.enrolled")}
                        </span>
                      )}
                    </div>
                    <h3>
                      <Link to={accessPath}>{displayTitle}</Link>
                    </h3>
                    <p>{displayDesc}</p>
                    <div className="course-meta">
                      <span>
                        <FiBookOpen />{" "}
                        {t("coursesPage.lessons", {
                          count: course.lessons || course.lessonCount,
                        })}
                      </span>
                      <span>
                        <FiClock /> {isKm ? course.durationKm : course.durationEn}
                      </span>
                    </div>
                    {course.isEnrolled && (
                      <div className="course-progress">
                        <div>
                          <span style={{ width: `${course.progress}%` }} />
                        </div>
                        <small>
                          {t("coursesPage.complete", {
                            percent: course.progress,
                          })}
                        </small>
                      </div>
                    )}
                    <footer className="course-card-footer">
                      <Link to={accessPath} className="course-cta-btn">
                        <span>
                          {course.isEnrolled
                            ? t("coursesPage.continueLearning")
                            : isKm
                              ? "👉 ចូលរៀនឥឡូវនេះ"
                              : "👉 Start Learning"}
                        </span>
                        <FiArrowRight />
                      </Link>
                    </footer>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        ) : (
          <div className="course-state">
            <strong>{t("coursesPage.noMatchTitle")}</strong>
            <p>{t("coursesPage.noMatchDescription")}</p>
          </div>
        )}
      </section>
    </main>
  );
};

export default Courses;
