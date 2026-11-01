import { useEffect } from "react";
import { Link, useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";
import logo from "../assets/logo/logo1.png";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import RealtimeToastHub from "../components/ui/RealtimeToastHub";
import "./AuthLayout.css";

export default function AuthLayout() {
  const location = useLocation();
  const outlet = useOutlet();
  const reduceMotion = useReducedMotion();
  const { language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  const isKm = language === "km";
  const toggleLanguage = () => {
    setLanguage(language === "km" ? "en" : "km");
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  const isRegisterPage = location.pathname.includes("/register");
  const isLoginPage = location.pathname.includes("/login");
  const isRecoveryPage =
    location.pathname.includes("/forgot-password") ||
    location.pathname.includes("/reset-password") ||
    location.pathname.includes("/verify-email");

  return (
    <div className="auth-shell">
      <a className="skip-link" href="#auth-main-content">
        {isKm ? "រំលងទៅកាន់មាតិកា" : "Skip to content"}
      </a>

      {/* Background Liquid Ambience */}
      <div className="bg-blobs" aria-hidden="true">
        <i className="blob b1" />
        <i className="blob b2" />
        <i className="blob b3" />
      </div>

      {/* Minimal Distraction-Free Header */}
      <header className="auth-minimal-nav glass">
        <div className="auth-nav-left">
          <Link to="/" className="auth-brand-link" aria-label="Smart Community Home">
            <img src={logo} alt="Smart Community" className="auth-nav-logo" />
            <span className="auth-nav-brand-text">
              <strong>Smart</strong>Community
            </span>
          </Link>

          <Link to="/" className="auth-back-home-btn">
            <FiArrowLeft className="auth-back-arrow" />
            <span>{isKm ? "ត្រឡប់ទៅទំព័រដើម" : "Back to Home"}</span>
          </Link>
        </div>

        <div className="auth-nav-right">
          {isRegisterPage && (
            <div className="auth-nav-switch-hint">
              <span className="auth-hint-text">
                {isKm ? "មានគណនីរួចហើយ?" : "Already have an account?"}
              </span>
              <Link to="/login" className="auth-switch-action-btn">
                {isKm ? "ចូលគណនី" : "Sign In"}
              </Link>
            </div>
          )}

          {isLoginPage && (
            <div className="auth-nav-switch-hint">
              <span className="auth-hint-text">
                {isKm ? "មិនទាន់មានគណនី?" : "New to Smart Community?"}
              </span>
              <Link to="/register" className="auth-switch-action-btn primary">
                {isKm ? "ចុះឈ្មោះ" : "Sign Up"}
              </Link>
            </div>
          )}

          {isRecoveryPage && (
            <div className="auth-nav-switch-hint">
              <span className="auth-hint-text">
                {isKm ? "ចាំលេខសម្ងាត់បានវិញ?" : "Remember password?"}
              </span>
              <Link to="/login" className="auth-switch-action-btn">
                {isKm ? "ចូលគណនី" : "Sign In"}
              </Link>
            </div>
          )}

          <div className="auth-nav-controls">
            <button
              type="button"
              className="auth-icon-pill"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? "☀️" : "🌙"}
            </button>

            <button
              type="button"
              className="auth-icon-pill auth-lang-pill"
              onClick={toggleLanguage}
              aria-label="Toggle language"
              title="Toggle language"
            >
              {language === "km" ? "EN" : "ខ្មែរ"}
            </button>
          </div>
        </div>
      </header>

      {/* Auth Content Stage */}
      <main className="auth-stage" id="auth-main-content">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            className="auth-stage-route"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6, scale: 0.99 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.26, ease: [0.16, 1, 0.3, 1] }
            }
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Minimal Distraction-Free Footer */}
      <footer className="auth-minimal-footer">
        <div className="auth-footer-inner">
          <p className="auth-footer-copy">
            © {new Date().getFullYear()} Smart Community • {isKm ? "វេទិកាអភិវឌ្ឍន៍ជំនាញ & អាជីពបច្ចេកវិទ្យា" : "Skill & Career Development Platform"}
          </p>
          <div className="auth-footer-links">
            <Link to="/courses">{isKm ? "វគ្គសិក្សា" : "Courses"}</Link>
            <span className="dot">•</span>
            <Link to="/mentorship">{isKm ? "អ្នកណែនាំ" : "Mentorship"}</Link>
            <span className="dot">•</span>
            <Link to="/jobs">{isKm ? "កម្មសិក្សា" : "Internships"}</Link>
            <span className="dot">•</span>
            <Link to="/forum">{isKm ? "ហ្វូរ៉ុម" : "Forum"}</Link>
          </div>
        </div>
      </footer>

      <RealtimeToastHub />
    </div>
  );
}
