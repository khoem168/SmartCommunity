import { useParams, Link } from "react-router-dom";
import { sampleCourses } from "./courseData";
import "./CourseDetail.css";

const CourseDetail = () => {
  const { courseId } = useParams();
  const course = sampleCourses.find((item) => item.id === courseId);

  if (!course) {
    return (
      <main className="course-detail-page">
        <section className="section container">
          <h1>Course not found</h1>
          <p>The requested course could not be located.</p>
          <Link to="/courses" className="btn outline">
            Back to courses
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="course-detail-page">
      <section className="course-detail-hero">
        <div className="container detail-header">
          <div>
            <p className="eyebrow">Course detail</p>
            <h1>{course.title}</h1>
            <p>{course.description}</p>
          </div>
          <div className="course-meta-card">
            <span className="course-category">{course.category}</span>
            <p>
              Mentor: <strong>{course.mentor}</strong>
            </p>
            <p>Duration: {course.duration}</p>
            <p>Lessons: {course.lessons}</p>
            <p>Progress: {course.progress}%</p>
            <Link to="/courses" className="btn outline detail-back">
              Back to courses
            </Link>
          </div>
        </div>
      </section>

      <section className="container detail-section">
        <div className="detail-card">
          <h2>What you'll learn</h2>
          <ul>
            {course.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="detail-card">
          <h2>Course actions</h2>
          <button className="btn primary">Start course</button>
          <button className="btn outline">Save for later</button>
        </div>
      </section>
    </main>
  );
};

export default CourseDetail;
