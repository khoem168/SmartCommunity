import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
  const { t } = useLanguage();
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
    setLoading(true);
    setError("");
    setDevUrl("");
    try {
      const response = await resendVerificationRequest(email);
      setStatus(response.message);
      setDevUrl(response.devVerificationUrl || "");
    } catch (err) {
      setError(err.message || t("auth.resendError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <h1>{t("auth.verifyTitle")}</h1>
          <p>{t("auth.verifyDescription")}</p>
        </div>
        <div className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          {(status || (loading && token)) && (
            <div className="auth-success">
              {status || t("auth.verifying")}
            </div>
          )}
          {devUrl && (
            <a className="auth-dev-link" href={devUrl}>
              {t("auth.openDevVerification")}
            </a>
          )}
          {!token && (
            <form className="auth-form auth-nested-form" onSubmit={handleResend}>
              <label>
                {t("auth.accountEmail")}
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <button className="btn primary auth-submit" disabled={loading}>
                {loading ? <ButtonLoader>{t("auth.sending")}</ButtonLoader> : t("auth.resend")}
              </button>
            </form>
          )}
          <p className="auth-footer">
            {loading ? (
              t("auth.pleaseWait")
            ) : (
              <Link to={loginPath}>{t("auth.continueLogin")}</Link>
            )}
          </p>
        </div>
      </section>
    </main>
  );
};

export default VerifyEmail;
