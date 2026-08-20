import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import GoogleLoginButton from "../../components/auth/GoogleLoginButton";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { ButtonLoader } from "../../components/ui/LoadingStates";
import "./Auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      await loginUser({ email: email.toLowerCase(), password, rememberMe: remember });
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
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <h1>{t("auth.loginTitle")}</h1>
          <p>{t("auth.loginDescription")}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          {needsVerification && (
            <Link className="auth-dev-link" to={`/verify-email?email=${encodeURIComponent(email)}`}>
              {t("auth.resendVerification")}
            </Link>
          )}

          <label>
            {t("auth.email")}
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              autoComplete="email"
            />
          </label>

          <label>
            {t("auth.password")}
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("auth.enterPassword")}
              autoComplete="current-password"
            />
          </label>

          <div className="auth-row">
            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              {t("auth.rememberMe")}
            </label>
            <Link className="auth-link" to="/forgot-password">
              {t("auth.forgotPassword")}
            </Link>
          </div>

          <button type="submit" className="btn primary auth-submit" disabled={loading}>
            {loading ? <ButtonLoader>{t("auth.signingIn")}</ButtonLoader> : t("auth.login")}
          </button>

          <div className="auth-divider">{t("auth.continueWith")}</div>
          <GoogleLoginButton onCredential={handleGoogleCredential} onError={setError} />

          <p className="auth-footer">
            {t("auth.noAccount")}{" "}
            <Link to="/register">{t("auth.createOne")}</Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default Login;
