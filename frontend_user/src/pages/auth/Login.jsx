import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiShield,
  FiAlertCircle,
} from "react-icons/fi";
import logo from "../../assets/logo/logo-mark.png";
import GoogleLoginButton from "../../components/auth/GoogleLoginButton";
import TwoFactorStep from "../../components/auth/TwoFactorStep";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { ButtonLoader } from "../../components/ui/LoadingStates";
import "./Auth.css";

const Login = () => {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.registeredEmail || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  // Set when the account needs its authenticator code after the password.
  // Register's Google button can also send the user here mid-sign-in.
  const [challenge, setChallenge] = useState(location.state?.twoFactorChallenge || null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { googleLogin, loginUser } = useGlobleContext();
  const { language, t } = useLanguage();
  const isKm = language === "km";

  const requestedRedirect = searchParams.get("redirect") || "";
  const redirectTo =
    requestedRedirect.startsWith("/") && !requestedRedirect.startsWith("//")
      ? requestedRedirect
      : "/dashboard";

  useEffect(() => {
    if (location.state?.registeredEmail) {
      setEmail(location.state.registeredEmail);
    }
  }, [location.state]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNeedsVerification(false);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      return setError(t("auth.enterCredentials"));
    }
    if (!trimmedEmail.includes("@")) {
      return setError(t("auth.invalidEmail"));
    }

    setLoading(true);
    try {
      const result = await loginUser({
        email: trimmedEmail,
        password,
        rememberMe: remember,
      });
      if (result?.twoFactorRequired) {
        setChallenge(result);
        setPassword("");
        return;
      }
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
      const result = await googleLogin({ credential, rememberMe: remember });
      if (result?.twoFactorRequired) {
        setChallenge(result);
        return;
      }
      navigate(redirectTo);
    } catch (err) {
      setError(err.message || t("auth.googleError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-card auth-card-unified auth-card-login ios-glass-card">
        <div className="auth-header">
          <h1>{t("auth.loginTitle")}</h1>
          <p>{t("auth.loginDescription")}</p>
        </div>

        {challenge ? (
          <TwoFactorStep
            challenge={challenge}
            onSuccess={(notice) => navigate(redirectTo, notice ? { state: { notice } } : undefined)}
            onCancel={() => {
              setChallenge(null);
              navigate(location.pathname + location.search, { replace: true, state: null });
            }}
          />
        ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="auth-error ios-alert-glass" role="alert">
              <FiAlertCircle className="error-icon" />
              <span>{error}</span>
            </div>
          )}
          {needsVerification && (
            <Link
              className="auth-dev-link"
              to={`/verify-email?email=${encodeURIComponent(email.trim())}`}
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
        )}
      </section>
    </div>
  );
};

export default Login;
