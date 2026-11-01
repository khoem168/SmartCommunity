import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield, FiAlertCircle } from "react-icons/fi";
import logo from "../../assets/logo/logo1.png";
import GoogleLoginButton from "../../components/auth/GoogleLoginButton";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { ButtonLoader } from "../../components/ui/LoadingStates";
import "./Auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { googleLogin, loginUser } = useGlobleContext();
  const { t } = useLanguage();
  const requestedRedirect = searchParams.get("redirect") || "";
  const redirectTo =
    requestedRedirect.startsWith("/") && !requestedRedirect.startsWith("//")
      ? requestedRedirect
      : "/dashboard";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNeedsVerification(false);

    if (!email || !password) return setError(t("auth.enterCredentials"));
    if (!email.includes("@")) return setError(t("auth.invalidEmail"));

    setLoading(true);
    try {
      await loginUser({
        email: email.toLowerCase(),
        password,
        rememberMe: remember,
      });
      navigate(redirectTo);
    } catch (err) {
      setError(err.message || t("auth.loginError"));
      setNeedsVerification(err.code === "EMAIL_NOT_VERIFIED");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setError("");
    setLoading(true);
    try {
      await googleLogin({ credential, rememberMe: remember });
      navigate(redirectTo);
    } catch (err) {
      setError(err.message || t("auth.googleError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-ambient-orb auth-orb-1" aria-hidden="true" />
      <div className="auth-ambient-orb auth-orb-2" aria-hidden="true" />

      <section className="auth-card ios-glass-card">
        {/* Brand header badge */}
        <div className="auth-brand-badge">
          <div className="auth-logo-squircle">
            <img src={logo} alt="Smart Community" className="auth-brand-logo" />
          </div>
          <span className="auth-brand-eyebrow">
            <FiShield className="shield-icon" />
            <span>Smart Community ID</span>
          </span>
        </div>

        {/* iOS Segmented Auth Switcher */}
        <div className="ios-auth-switcher-track" role="tablist">
          <button type="button" className="ios-auth-switch-pill active" role="tab" aria-selected="true">
            {t("auth.login")}
          </button>
          <Link
            to={`/register${requestedRedirect ? `?redirect=${encodeURIComponent(requestedRedirect)}` : ""}`}
            className="ios-auth-switch-pill"
            role="tab"
            aria-selected="false"
          >
            {t("auth.createOne")}
          </Link>
        </div>

        <div className="auth-header">
          <h1>{t("auth.loginTitle")}</h1>
          <p>{t("auth.loginDescription")}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error ios-alert-glass">
              <FiAlertCircle className="error-icon" />
              <span>{error}</span>
            </div>
          )}
          {needsVerification && (
            <Link
              className="auth-dev-link"
              to={`/verify-email?email=${encodeURIComponent(email)}`}
            >
              {t("auth.resendVerification")}
            </Link>
          )}

          <div className="ios-input-group">
            <label htmlFor="login-email">{t("auth.email")}</label>
            <div className="ios-field-wrap">
              <FiMail className="ios-field-icon" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="ios-input-group">
            <div className="ios-label-row">
              <label htmlFor="login-password">{t("auth.password")}</label>
              <Link className="auth-link-sm" to="/forgot-password">
                {t("auth.forgotPassword")}
              </Link>
            </div>
            <div className="ios-field-wrap">
              <FiLock className="ios-field-icon" aria-hidden="true" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t("auth.enterPassword")}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="ios-field-eye"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="auth-row">
            <label className="auth-checkbox ios-checkbox-label">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span className="ios-checkbox-custom" />
              <span>{t("auth.rememberMe")}</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit ios-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <ButtonLoader>{t("auth.signingIn")}</ButtonLoader>
            ) : (
              <>
                <span>{t("auth.login")}</span>
                <FiArrowRight className="submit-arrow" />
              </>
            )}
          </button>

          <div className="auth-divider">
            <span>{t("auth.continueWith")}</span>
          </div>

          <div className="auth-google-wrapper">
            <GoogleLoginButton
              onCredential={handleGoogleCredential}
              onError={setError}
            />
          </div>

          <div className="auth-footer-box">
            <p className="auth-footer">
              {t("auth.noAccount")}{" "}
              <Link to="/register" className="auth-create-link">
                {t("auth.createOne")}
              </Link>
            </p>
          </div>
        </form>
      </section>
    </div>
  );
};

export default Login;
