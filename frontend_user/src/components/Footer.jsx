import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <strong>Smart Community Skill & Career Development Platform</strong>
          <p>
            Learn practical skills, connect with mentors, exchange knowledge,
            and move confidently toward career opportunities.
          </p>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link to="/courses">Learning paths</Link>
          <Link to="/mentorship">Find mentors</Link>
          <Link to="/jobs">Internships</Link>
          <Link to="/community">Skill exchange</Link>
          <Link to="/forum">Community forum</Link>
          <Link to="/career">Career roadmap</Link>
        </nav>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Smart Community Platform</span>
          <span>Built for learning, connection, and career growth.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
