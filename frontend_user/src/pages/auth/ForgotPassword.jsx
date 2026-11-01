import { useState } from "react";
import { Link } from "react-router-dom";
import { FiMail, FiArrowRight, FiArrowLeft, FiKey, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { forgotPasswordRequest } from "../../services/authService";
import { useLanguage } from "../../context/LanguageContext";
import { ButtonLoader } from "../../components/ui/LoadingStates";
import "./Auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { t, language } = useLanguage();
  const isKm = language === "km";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setResetUrl("");

    if (!email) return setError(isKm ? "សូមបញ្ចូលអ៊ីមែលរបស់អ្នក" : "Please enter your email address");
    if (!email.includes("@")) return setError(t("auth.invalidEmail"));

    setLoading(true);
    try {
      const response = await forgotPasswordRequest(email.trim().toLowerCase());
      setMessage(response.message);
      setResetUrl(response.devResetUrl || "");
    } catch (err) {
      setError(err.message || t("auth.forgotError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-card ios-glass-card">
      {/* Brand Badge */}
      <div className="auth-brand-badge">
        <div className="auth-logo-squircle recovery-squircle">
          <FiKey className="recovery-key-icon" />
        </div>
        <span className="auth-brand-eyebrow">
          <span>{isKm ? "ស្តារលេខសម្ងាត់ឡើងវិញ" : "Account Recovery"}</span>
        </span>
      </div>

      <div className="auth-header">
        <h1>{t("auth.forgotTitle")}</h1>
        <p>{t("auth.forgotDescription")}</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && (
          <div className="auth-error ios-alert-glass">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="auth-success ios-alert-glass">
            <FiCheckCircle />
            <span>{message}</span>
          </div>
        )}

        {resetUrl && (
          <div className="dev-test-banner">
            <span className="dev-test-tag">Developer Preview</span>
            <a className="auth-dev-link" href={resetUrl}>
              {t("auth.openDevReset")}
            </a>
          </div>
        )}

        {!message ? (
          <>
            <div className="ios-input-group">
              <label htmlFor="forgot-email">{t("auth.email")}</label>
              <div className="ios-field-wrap">
                <FiMail className="ios-field-icon" aria-hidden="true" />
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <button type="submit" className="ios-submit-btn" disabled={loading}>
              {loading ? (
                <ButtonLoader>{t("auth.creatingLink")}</ButtonLoader>
              ) : (
                <>
                  <span>{t("auth.sendReset")}</span>
                  <FiArrowRight />
                </>
              )}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="ios-submit-btn"
            onClick={() => setMessage("")}
          >
            <span>{isKm ? "ផ្ញើសារម្តងទៀត" : "Send Another Link"}</span>
          </button>
        )}

        <div className="auth-card-footer-row">
          <Link to="/login" className="auth-link-back">
            <FiArrowLeft />
            <span>{t("auth.returnLogin")}</span>
          </Link>
        </div>
      </form>
    </section>
  );
};

export default ForgotPassword;
