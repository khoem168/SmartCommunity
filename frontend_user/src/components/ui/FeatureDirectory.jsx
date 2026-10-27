import { Link } from "react-router-dom";
import { FiArrowUpRight, FiBookOpen, FiUsers, FiCompass, FiGrid } from "react-icons/fi";
import { useLanguage } from "../../context/LanguageContext";
import { useGlobleContext } from "../../context/GlobleContext";
import communityOne from "../../assets/team/heang-chheng-khoem.jpg";
import communityTwo from "../../assets/team/horn-pisey.jpg";
import communityThree from "../../assets/team/muy-kalin.jpg";
import "./FeatureDirectory.css";

const groups = [
  { icon: FiBookOpen, en: "Learn & practise", km: "រៀន និងអនុវត្ត", links: [
    ["/courses", "Courses", "វគ្គសិក្សា"], ["/sessions", "Live sessions", "ថ្នាក់រៀនផ្ទាល់"], ["/mentorship", "Find a mentor", "ស្វែងរកគ្រូណែនាំ"],
  ] },
  { icon: FiUsers, en: "Connect & share", km: "ភ្ជាប់ និងចែករំលែក", links: [
    ["/community", "Community", "សហគមន៍"], ["/discover", "Discover members", "ស្វែងរកសមាជិក"], ["/skill-requests", "Skill exchange", "ការផ្លាស់ប្ដូរជំនាញ"], ["/forum", "Discussions", "វេទិកាពិភាក្សា"], ["/messages", "Messages", "សារ"],
  ] },
  { icon: FiCompass, en: "Shape your career", km: "រៀបចំអាជីព", links: [
    ["/career", "Career roadmap", "ផែនការអាជីព"], ["/jobs", "Internships & jobs", "ហាត់ការ និងការងារ"], ["/applications", "My applications", "ពាក្យស្នើសុំរបស់ខ្ញុំ"], ["/profile", "My profile", "ប្រវត្តិរូបរបស់ខ្ញុំ"],
  ] },
];

export default function FeatureDirectory() {
  const { language } = useLanguage();
  const { user } = useGlobleContext();
  const km = language === "km";
  return (
    <section className="feature-directory home-container" aria-label={km ? "ច្រកចូលមុខងារ" : "Feature directory"}>
      <div className="directory-intro">
        <Link className="directory-community" to="/community">
          <span className="directory-faces" aria-hidden="true">
            {[communityOne, communityTwo, communityThree].map((src) => <img src={src} key={src} alt="" loading="lazy" />)}
          </span>
          <span>{km ? "រៀន និងរីកចម្រើនជាមួយសហគមន៍" : "A community to learn and grow with"} <FiArrowUpRight /></span>
        </Link>
        <h2>{km ? "ថ្ងៃនេះ បងចង់ធ្វើអ្វី?" : "What will you explore today?"}</h2>
      </div>
      <div className="directory-shortcuts">
        {groups.map(({ icon: Icon, en, km: title, links }, i) => <Link key={en} to={links[0][0]} className={`directory-shortcut directory-${i}`}><span><Icon /></span><strong>{km ? title : en}</strong><FiArrowUpRight /></Link>)}
      </div>
      <details className="directory-details">
        <summary><FiGrid /><span>{km ? "មើលមុខងារទាំងអស់" : "Explore all tools"}</span><span className="directory-plus" aria-hidden="true">+</span></summary>
        <div className="directory-groups">
          {groups.map(({ en, km: title, links }) => <div key={en}><h3>{km ? title : en}</h3>{links.map(([to, label, khmer]) => <Link to={to} key={to}>{km ? khmer : label}<FiArrowUpRight /></Link>)}</div>)}
          <div><h3>{km ? "កន្លែងការងាររបស់ខ្ញុំ" : "My workspace"}</h3>
            <Link to="/dashboard">{km ? "ផ្ទាំងគ្រប់គ្រង" : "Dashboard"}<FiArrowUpRight /></Link>
            <Link to="/notifications">{km ? "ការជូនដំណឹង" : "Notifications"}<FiArrowUpRight /></Link>
            <Link to="/settings">{km ? "ការកំណត់" : "Settings"}<FiArrowUpRight /></Link>
            {user?.role === "recruiter" && <Link to="/my-posts">{km ? "គ្រប់គ្រងការជ្រើសរើស" : "Manage recruitment"}<FiArrowUpRight /></Link>}
            {user?.role === "admin" && <Link to="/admin">{km ? "រដ្ឋបាល" : "Administration"}<FiArrowUpRight /></Link>}
          </div>
        </div>
      </details>
    </section>
  );
}
