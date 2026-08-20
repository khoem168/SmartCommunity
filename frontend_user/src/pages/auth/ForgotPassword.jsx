import { useState } from "react";
import { Link } from "react-router-dom";
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
  const { t } = useLanguage();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setResetUrl("");
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
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <h1>{t("auth.forgotTitle")}</h1>
          <p>{t("auth.forgotDescription")}</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}
          {resetUrl && (
            <a className="auth-dev-link" href={resetUrl}>
              {t("auth.openDevReset")}
            </a>
          )}
          <label>
            {t("auth.email")}
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              required
            />
          </label>
          <button className="btn primary auth-submit" disabled={loading}>
            {loading ? <ButtonLoader>{t("auth.creatingLink")}</ButtonLoader> : t("auth.sendReset")}
          </button>
          <p className="auth-footer">
            {t("auth.remembered")}{" "}
            <Link to="/login">{t("auth.returnLogin")}</Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default ForgotPassword;
