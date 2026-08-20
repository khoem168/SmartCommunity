import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiLock,
  FiPlayCircle,
  FiSearch,
} from "react-icons/fi";
import { SkeletonGrid } from "../../components/ui/LoadingStates";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { fetchCourses } from "../../services/courseService";
import "./Courses.css";

const money = (amount, currency, locale = "en-US") =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KHR" ? 0 : 2,
  }).format(Number(amount || 0));

const Courses = () => {
  const { language, t } = useLanguage();
  const { user } = useGlobleContext();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    fetchCourses()
      .then((response) => setCourses(response.courses || []))
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
          course.title.toLowerCase().includes(needle) ||
          course.description.toLowerCase().includes(needle)),
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
            <p>
              {t("coursesPage.heroDescription")}
            </p>
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
            <strong>{courses.length || 3}</strong>
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
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("coursesPage.searchPlaceholder")}
            />
          </label>
        </header>

        <div className="course-filters" aria-label={t("coursesPage.categoriesLabel")}>
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              className={category === item ? "active" : ""}
              onClick={() => setCategory(item)}
            >
              {item === "All" ? t("coursesPage.all") : item}
            </button>
          ))}
        </div>

        {loading ? (
          <SkeletonGrid
            className="courses-grid"
            count={3}
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

              return (
              <article key={course.id} className="course-card">
                <Link
                  to={accessPath}
                  className="course-cover"
                  aria-label={t("coursesPage.viewCourse", { title: course.title })}
                >
                  <img src={course.thumbnailUrl} alt="" />
                  <span className="course-level">{course.level}</span>
                  <span className="course-play">
                    <FiPlayCircle />
                  </span>
                </Link>
                <div className="course-card-content">
                  <div className="course-card-topline">
                    <span className="course-category">{course.category}</span>
                    {course.isEnrolled && (
                      <span className="course-owned">
                        <FiCheckCircle /> {t("coursesPage.enrolled")}
                      </span>
                    )}
                  </div>
                  <h3>
                    <Link to={accessPath}>{course.title}</Link>
                  </h3>
                  <p>{course.description}</p>
                  <div className="course-meta">
                    <span>
                      <FiBookOpen /> {t("coursesPage.lessons", { count: course.lessonCount })}
                    </span>
                    <span>
                      <FiClock /> {course.duration}
                    </span>
                  </div>
                  {course.isEnrolled ? (
                    <div className="course-progress">
                      <div>
                        <span style={{ width: `${course.progress}%` }} />
                      </div>
                      <small>{t("coursesPage.complete", { percent: course.progress })}</small>
                    </div>
                  ) : (
                    <div className="course-preview-note">
                      {user ? <FiPlayCircle /> : <FiLock />} {user ? t("coursesPage.freePreview", { count: course.previewCount }) : t("coursesPage.accountRequired")}
                    </div>
                  )}
                  <footer>
                    <div>
                      <small>{course.isEnrolled ? t("coursesPage.yourCourse") : t("coursesPage.fullAccess")}</small>
                      <strong>
                        {course.isEnrolled
                          ? t("coursesPage.continueLearning")
                          : user
                            ? money(course.price, course.currency, language === "km" ? "km-KH" : "en-US")
                            : t("coursesPage.createToView")}
                      </strong>
                    </div>
                    <Link to={accessPath} className="course-arrow">
                      {course.isEnrolled ? <FiArrowRight /> : <FiLock />}
                    </Link>
                  </footer>
                </div>
              </article>
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
