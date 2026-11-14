import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiBookOpen,
  FiBriefcase,
  FiGithub,
  FiHeart,
  FiMapPin,
  FiUsers,
} from "react-icons/fi";
import logo from "../assets/logo/logo1.png";
import { useLanguage } from "../context/LanguageContext";

const footerGroups = [
  {
    titleKey: "learn",
    icon: FiBookOpen,
    links: [
      ["courses", "/courses"],
      ["liveSessions", "/sessions"],
      ["careerRoadmap", "/career"],
    ],
  },
  {
    titleKey: "connect",
    icon: FiUsers,
    links: [
      ["findMentors", "/mentorship"],
      ["skillExchange", "/skill-exchange"],
      ["communityForum", "/forum"],
    ],
  },
  {
    titleKey: "opportunities",
    icon: FiBriefcase,
    links: [
      ["internships", "/jobs"],
      ["cvStudio", "/cv-studio"],
      ["messages", "/messages"],
    ],
  },
];

const Footer = () => {
  const { language, t } = useLanguage();
  const isKm = language === "km";

  return (
    <footer className="site-footer site-footer-no-cta" id="site-footer">
      <div className="footer-orb footer-orb-one" aria-hidden="true" />
      <div className="footer-orb footer-orb-two" aria-hidden="true" />

      <div className="site-footer-inner">
        <div className="footer-main">
          <div className="footer-identity">
            <div className="footer-brand-lockup">
              <Link
                to="/"
                className="footer-logo"
                aria-label={t("nav.homeLabel")}
              >
                <img src={logo} alt="Smart Community Skill and Career" />
              </Link>
              <div className="footer-brand-name">
                <strong>{t("footer.brand")}</strong>
                <span>{t("footer.brandTagline")}</span>
              </div>
            </div>
            <p>{t("footer.description")}</p>
            <div className="footer-location">
              <span>
                <FiMapPin /> {t("footer.cambodia")}
              </span>
              <span>
                <FiHeart /> {t("footer.builtForLearners")}
              </span>
            </div>
          </div>

          <nav className="footer-nav-grid" aria-label={t("footer.navigation")}>
            {footerGroups.map(({ titleKey, icon: Icon, links }) => (
              <div className="footer-column" key={titleKey}>
                <h3>
                  <Icon /> {t(`footer.${titleKey}`)}
                </h3>
                {links.map(([labelKey, to]) => (
                  <Link to={to} key={to}>
                    {labelKey === "cvStudio"
                      ? isKm
                        ? "បង្កើត PDF CV (ឥតគិតថ្លៃ)"
                        : "Free CV Builder (PDF)"
                      : t(`footer.${labelKey}`)}
                    <FiArrowRight />
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>

        <div className="site-footer-bottom">
          <span>
            © {new Date().getFullYear()} {t("footer.copyright")}
          </span>
          <div>
            <span>{t("footer.closing")}</span>
            <a
              href="https://github.com/khoem168/Smart_Community_Skill_Career_Development_Platform"
              target="_blank"
              rel="noreferrer"
              aria-label={t("footer.githubLabel")}
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
