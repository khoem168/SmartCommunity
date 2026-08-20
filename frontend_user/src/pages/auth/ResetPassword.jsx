import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPasswordRequest } from "../../services/authService";
import { useLanguage } from "../../context/LanguageContext";
import { ButtonLoader } from "../../components/ui/LoadingStates";
import "./Auth.css";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!token) return setError(t("auth.missingToken"));
    if (password !== confirmPassword) return setError(t("auth.passwordsMismatch"));
    setLoading(true);
    try {
      const response = await resetPasswordRequest(token, password);
      setMessage(response.message);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || t("auth.resetError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <h1>{t("auth.resetTitle")}</h1>
          <p>{t("auth.resetDescription")}</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}
          <label>
            {t("auth.newPassword")}
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          <label>
            {t("auth.confirmPassword")}
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          <button className="btn primary auth-submit" disabled={loading || !token}>
            {loading ? <ButtonLoader>{t("auth.updating")}</ButtonLoader> : t("auth.resetPassword")}
          </button>
          <p className="auth-footer">
            <Link to="/login">{t("auth.returnLogin")}</Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default ResetPassword;
