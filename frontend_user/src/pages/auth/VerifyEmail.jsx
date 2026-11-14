import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FiMail,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiArrowLeft,
  FiShield,
  FiRefreshCw,
} from "react-icons/fi";
import {
  resendVerificationRequest,
  verifyEmailRequest,
} from "../../services/authService";
import { useLanguage } from "../../context/LanguageContext";
import { ButtonLoader } from "../../components/ui/LoadingStates";
import "./Auth.css";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const requestedRedirect = searchParams.get("redirect") || "";
  const redirectTo =
    requestedRedirect.startsWith("/") && !requestedRedirect.startsWith("//")
      ? requestedRedirect
      : "";
  const loginPath = redirectTo
    ? `/login?redirect=${encodeURIComponent(redirectTo)}`
    : "/login";
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const { t, language } = useLanguage();
  const isKm = language === "km";
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [devUrl, setDevUrl] = useState("");
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return;
    let active = true;
    verifyEmailRequest(token)
      .then((response) => {
        if (active) setStatus(response.message);
      })
      .catch((err) => {
        if (active) {
          setStatus("");
          setError(err.message || t("auth.verifyError"));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [t, token]);

  const handleResend = async (event) => {
    event.preventDefault();
    if (!email) return setError(isKm ? "សូមបញ្ចូលអ៊ីមែលរបស់អ្នក" : "Please enter your email");
    setLoading(true);
    setError("");
    setDevUrl("");
    try {
      const response = await resendVerificationRequest(email.trim().toLowerCase());
      setStatus(response.message);
      setDevUrl(response.devVerificationUrl || "");
    } catch (err) {
      setError(err.message || t("auth.resendError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-card auth-card-unified auth-card-login ios-glass-card">
      <div className="auth-header">
        <h1>{t("auth.verifyTitle")}</h1>
        <p>{t("auth.verifyDescription")}</p>
      </div>

      <div className="auth-form">
        {error && (
          <div className="auth-error ios-alert-glass">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {status && (
          <div className="auth-success ios-alert-glass">
            <FiCheckCircle />
            <span>{status}</span>
          </div>
        )}

        {loading && token && (
          <div className="auth-verifying-pulse">
            <FiRefreshCw className="spin-icon" />
            <span>{t("auth.verifying")}</span>
          </div>
        )}

        {devUrl && (
          <div className="dev-test-banner">
            <span className="dev-test-tag">Developer Preview</span>
            <a className="auth-dev-link" href={devUrl}>
              {t("auth.openDevVerification")}
            </a>
          </div>
        )}

        {/* If verified successfully, provide direct CTA */}
        {status && token && (
          <Link to={loginPath} className="ios-submit-btn">
            <span>{t("auth.returnLogin")}</span>
            <FiArrowRight />
          </Link>
        )}

        {/* Resend form if no token or token failed */}
        {!token && (
          <form className="auth-nested-form" onSubmit={handleResend}>
            <div className="ios-input-group">
              <label htmlFor="verify-email-input">{t("auth.accountEmail")}</label>
              <div className="ios-field-wrap">
                <FiMail className="ios-field-icon" aria-hidden="true" />
                <input
                  id="verify-email-input"
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
                <ButtonLoader>{t("auth.sending")}</ButtonLoader>
              ) : (
                <>
                  <span>{t("auth.resendBtn")}</span>
                  <FiArrowRight />
                </>
              )}
            </button>
          </form>
        )}

        <div className="auth-card-footer-row">
          <Link to={loginPath} className="auth-link-back">
            <FiArrowLeft />
            <span>{t("auth.returnLogin")}</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default VerifyEmail;
