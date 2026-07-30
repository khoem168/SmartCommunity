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
import { fetchCourses } from "../../services/courseService";
import "./Courses.css";

const money = (amount, currency) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KHR" ? 0 : 2,
  }).format(Number(amount || 0));

const Courses = () => {
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
            <h1>Learn practical skills. Build a career that moves forward.</h1>
            <p>
              Preview the first lesson free, then unlock the complete course
              securely with Bakong KHQR.
            </p>
            <div className="courses-trust-row">
              <span>
                <FiPlayCircle /> Free lesson previews
              </span>
              <span>
                <FiCheckCircle /> Lifetime course access
              </span>
              <span>
                <FiBookOpen /> Video and PDF resources
              </span>
            </div>
          </div>
          <div className="courses-hero-stat">
            <strong>{courses.length || 3}</strong>
            <span>Career-ready learning paths</span>
            <small>Learn at your own pace on any device.</small>
          </div>
        </div>
      </section>

      <section className="container courses-library">
        <header className="courses-library-header">
          <div>
            <p className="courses-kicker">Course library</p>
            <h2>Choose your next skill</h2>
          </div>
          <label className="course-search">
            <FiSearch />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search courses"
            />
          </label>
        </header>

        <div className="course-filters" aria-label="Course categories">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              className={category === item ? "active" : ""}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="course-state">
            <span className="course-loader" />
            <strong>Loading live courses…</strong>
          </div>
        ) : error ? (
          <div className="course-state error">
            <strong>Courses could not be loaded</strong>
            <p>{error}</p>
          </div>
        ) : visibleCourses.length ? (
          <div className="courses-grid">
            {visibleCourses.map((course) => (
              <article key={course.id} className="course-card">
                <Link
                  to={`/courses/${course.slug}`}
                  className="course-cover"
                  aria-label={`View ${course.title}`}
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
                        <FiCheckCircle /> Enrolled
                      </span>
                    )}
                  </div>
                  <h3>
                    <Link to={`/courses/${course.slug}`}>{course.title}</Link>
                  </h3>
                  <p>{course.description}</p>
                  <div className="course-meta">
                    <span>
                      <FiBookOpen /> {course.lessonCount} lessons
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
                      <small>{course.progress}% complete</small>
                    </div>
                  ) : (
                    <div className="course-preview-note">
                      <FiPlayCircle /> {course.previewCount} free preview
                    </div>
                  )}
                  <footer>
                    <div>
                      <small>{course.isEnrolled ? "Your course" : "Full access"}</small>
                      <strong>
                        {course.isEnrolled
                          ? "Continue learning"
                          : money(course.price, course.currency)}
                      </strong>
                    </div>
                    <Link to={`/courses/${course.slug}`} className="course-arrow">
                      {course.isEnrolled ? <FiArrowRight /> : <FiLock />}
                    </Link>
                  </footer>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="course-state">
            <strong>No courses match your search</strong>
            <p>Try another title or category.</p>
          </div>
        )}
      </section>
    </main>
  );
};

export default Courses;
