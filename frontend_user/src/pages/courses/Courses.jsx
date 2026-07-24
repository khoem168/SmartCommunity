import { Link } from "react-router-dom";
import "./Courses.css";
import { sampleCourses } from "./courseData";

const Courses = () => {
  return (
    <main className="courses-page">
      <section className="page-hero courses-hero">
        <div className="hero-content">
          <p className="eyebrow">Learning</p>
          <h1>Explore curated courses that boost your career.</h1>
          <p>
            Browse skill-building tracks, follow progress, and learn from top
            mentors in web development, design, data, and more.
          </p>
        </div>
      </section>

      <section className="section container">
        <div className="section-header">
          <div>
            <h2>Recommended courses</h2>
            <p>Find training paths for your next role or promotion.</p>
          </div>
          <button className="btn outline">View all courses</button>
        </div>

        <div className="courses-grid">
          {sampleCourses.map((course) => (
            <article key={course.title} className="course-card">
              <span className="course-category">{course.category}</span>
              <h3>{course.title}</h3>
              <p>Mentor: {course.mentor}</p>
              <div className="course-meta">
                <span>{course.lessons} lessons</span>
                <span>{course.duration}</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
              <div className="course-footer">
                <span>{course.progress}% complete</span>
                <Link
                  to={`/courses/${course.id}`}
                  className="btn primary small"
                >
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Courses;
