import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiBookOpen,
  FiBriefcase,
  FiGithub,
  FiHeart,
  FiMapPin,
  FiMessageCircle,
  FiUsers,
} from "react-icons/fi";
import logo from "../assets/logo/logo1.png";

const footerGroups = [
  {
    title: "Learn",
    icon: FiBookOpen,
    links: [
      ["Courses", "/courses"],
      ["Live sessions", "/sessions"],
      ["Career roadmap", "/career"],
    ],
  },
  {
    title: "Connect",
    icon: FiUsers,
    links: [
      ["Find mentors", "/mentorship"],
      ["Skill exchange", "/community"],
      ["Community forum", "/forum"],
    ],
  },
  {
    title: "Opportunities",
    icon: FiBriefcase,
    links: [
      ["Internships", "/jobs"],
      ["Discover members", "/discover"],
      ["Messages", "/messages"],
    ],
  },
];

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-orb footer-orb-one" />
      <div className="footer-orb footer-orb-two" />

      <div className="site-footer-inner">
        <section className="footer-cta">
          <div className="footer-cta-icon">
            <FiMessageCircle />
          </div>
          <div>
            <p>Build your next opportunity</p>
            <h2>Learn, connect, and grow with your community.</h2>
          </div>
          <div className="footer-cta-actions">
            <Link to="/courses" className="footer-button secondary">
              Explore courses
            </Link>
            <Link to="/register" className="footer-button primary">
              Join for free <FiArrowRight />
            </Link>
          </div>
        </section>

        <div className="footer-main">
          <div className="footer-identity">
            <Link to="/" className="footer-logo" aria-label="Smart Community home">
              <img src={logo} alt="Smart Community Skill and Career" />
            </Link>
            <p>
              A trusted space to build practical skills, learn from mentors,
              exchange knowledge, and move confidently toward a meaningful
              career.
            </p>
            <div className="footer-location">
              <span>
                <FiMapPin /> Cambodia
              </span>
              <span>
                <FiHeart /> Built for learners
              </span>
            </div>
          </div>

          <nav className="footer-nav-grid" aria-label="Footer navigation">
            {footerGroups.map(({ title, icon: Icon, links }) => (
              <div className="footer-column" key={title}>
                <h3>
                  <Icon /> {title}
                </h3>
                {links.map(([label, to]) => (
                  <Link to={to} key={to}>
                    {label}
                    <FiArrowRight />
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>

        <div className="site-footer-bottom">
          <span>
            © {new Date().getFullYear()} Smart Community Skill &amp; Career
            Development Platform
          </span>
          <div>
            <span>Learning · Connection · Career growth</span>
            <a
              href="https://github.com/khoem168/Smart_Community_Skill_Career_Development_Platform"
              target="_blank"
              rel="noreferrer"
              aria-label="View project on GitHub"
            >
              <FiGithub /> GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
