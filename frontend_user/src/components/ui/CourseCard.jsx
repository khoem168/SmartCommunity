import { Link } from "react-router-dom";
import { FiArrowUpRight, FiBookOpen, FiCheck, FiClock } from "react-icons/fi";
import { useLanguage } from "../../context/LanguageContext";
import TiltCard from "./TiltCard";

export default function CourseCard({ course }) {
  const { language, t } = useLanguage();
  const to = `/courses/${encodeURIComponent(course.slug)}`;
  const level = String(course.level || "").toLowerCase();
  const price = Number(course.price) > 0
    ? new Intl.NumberFormat(language === "km" ? "km-KH" : "en-US", { style: "currency", currency: course.currency || "USD" }).format(course.price)
    : t("refresh.free");
  return (
    <TiltCard className="sc-course">
      <Link to={to} className="sc-course-image" aria-label={`${t("refresh.preview")}: ${course.title}`}>
        {course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" loading="lazy" onError={event => { event.currentTarget.style.display = "none"; }} /> : <FiBookOpen aria-hidden="true" />}
        {course.level && <span>{["beginner", "intermediate", "advanced"].includes(level) ? t(`refresh.${level}`) : course.level}</span>}
      </Link>
      <div className="sc-course-body">
        <p className="sc-kicker">{course.category}</p>
        <h3><Link to={to}>{course.title}</Link></h3>
        <p className="sc-course-description">{course.description}</p>
        <div className="sc-course-meta"><span><FiBookOpen /> {t("refresh.lessons", { count: course.lessonCount || 0 })}</span>{course.duration && <span><FiClock /> {course.duration}</span>}</div>
        <div className="sc-course-bottom"><strong>{course.isEnrolled ? <><FiCheck /> {t("refresh.enrolled")}</> : price}</strong><Link to={to} aria-label={`${t("refresh.preview")}: ${course.title}`}><FiArrowUpRight /></Link></div>
        {Number(course.price) > 0 && !course.isEnrolled && <small className="sc-khqr">{t("refresh.bakong")}</small>}
      </div>
    </TiltCard>
  );
}
