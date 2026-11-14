import { useEffect } from "react";
import { Link, useLocation, useOutlet } from "react-router-dom";
import { FiArrowLeft, FiGlobe, FiMoon, FiSun } from "react-icons/fi";
import logo from "../assets/logo/logo-mark.png";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import RealtimeToastHub from "../components/ui/RealtimeToastHub";
import "./AuthLayout.css";

export default function AuthLayout() {
  const location = useLocation();
  const outlet = useOutlet();
  const { language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  const isKm = language === "km";
  const toggleLanguage = () => {
    setLanguage(language === "km" ? "en" : "km");
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <div className="auth-shell">
      <a className="skip-link" href="#auth-main-content">
        {isKm ? "រំលងទៅកាន់មាតិកា" : "Skip to content"}
      </a>

      {/* Minimal Distraction-Free Header */}
      <header className="auth-minimal-nav">
        <div className="auth-nav-left">
          <Link to="/" className="auth-brand-link" aria-label="Smart Community Home">
            <img src={logo} alt="Smart Community" className="auth-nav-logo" />
            <span className="auth-nav-brand-text">
              Smart <span className="logo-accent">Community</span>
            </span>
          </Link>

          <Link to="/" className="auth-back-home-btn">
            <FiArrowLeft className="auth-back-arrow" />
            <span>{isKm ? "ត្រឡប់ទៅទំព័រដើម" : "Back to Home"}</span>
          </Link>
        </div>

        <div className="auth-nav-right">
          <div className="auth-nav-controls">
            <button
              type="button"
              className="auth-icon-pill"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? (isKm ? "ប្តូរទៅផ្ទៃភ្លឺ" : "Light mode") : (isKm ? "ប្តូរទៅផ្ទៃងងឹត" : "Dark mode")}
            >
              {isDark ? <FiSun size={15} /> : <FiMoon size={15} />}
            </button>

            <button
              type="button"
              className="auth-icon-pill auth-lang-pill"
              onClick={toggleLanguage}
              aria-label={
                isKm
                  ? "ភាសាបច្ចុប្បន្ន៖ ខ្មែរ។ ចុចដើម្បីប្តូរទៅ English"
                  : "Current language: English. Click to switch to Khmer"
              }
              title={
                isKm
                  ? "កំពុងប្រើភាសាខ្មែរ • ចុចប្តូរទៅ English"
                  : "Using English • Click to switch to ខ្មែរ"
              }
            >
              <FiGlobe size={14} className="auth-lang-globe" />
              <span className={`lang-opt ${isKm ? "active" : ""}`}>ខ្មែរ</span>
              <span className="lang-sep">/</span>
              <span className={`lang-opt ${!isKm ? "active" : ""}`}>EN</span>
            </button>
          </div>
        </div>
      </header>

      {/* Auth Content Stage */}
      <main className="auth-stage" id="auth-main-content">
        <div className="auth-stage-route">{outlet}</div>
      </main>

      {/* Minimal Distraction-Free Footer */}
      <footer className="auth-minimal-footer">
        <div className="auth-footer-inner">
          <p className="auth-footer-copy">
            © {new Date().getFullYear()} Smart Community •{" "}
            {isKm
              ? "វេទិកាផ្លាស់ប្តូរជំនាញ សិក្សាកូដ និងអភិវឌ្ឍអាជីព"
              : "Peer Skill Exchange, Tech Academy & Career Platform"}
          </p>
          <div className="auth-footer-links">
            <Link to="/courses">{isKm ? "វគ្គសិក្សា" : "Courses"}</Link>
            <span className="dot">•</span>
            <Link to="/skill-exchange">{isKm ? "ប្តូរជំនាញ" : "Skill Swap"}</Link>
            <span className="dot">•</span>
            <Link to="/mentorship">{isKm ? "អ្នកណែនាំ" : "Mentorship"}</Link>
            <span className="dot">•</span>
            <Link to="/jobs">{isKm ? "ការងារ" : "Jobs"}</Link>
          </div>
        </div>
      </footer>

      <RealtimeToastHub />
    </div>
  );
}
