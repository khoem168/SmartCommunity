import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiArrowLeft,
  FiShield,
} from "react-icons/fi";
import { resetPasswordRequest } from "../../services/authService";
import { useLanguage } from "../../context/LanguageContext";
import { ButtonLoader } from "../../components/ui/LoadingStates";
import "./Auth.css";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t, language } = useLanguage();
  const isKm = language === "km";

  const isMatched = password && confirmPassword && password === confirmPassword;
  const isMismatch = password && confirmPassword && password !== confirmPassword;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!token) return setError(t("auth.missingToken"));
    if (password.length < 6) {
      return setError(isKm ? "លេខសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ" : "Password must be at least 6 characters");
    }
    if (password !== confirmPassword) {
      return setError(t("auth.passwordsMismatch"));
    }

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
    <section className="auth-card ios-glass-card">
      {/* Brand Badge */}
      <div className="auth-brand-badge">
        <div className="auth-logo-squircle recovery-squircle">
          <FiShield className="recovery-key-icon" />
        </div>
        <span className="auth-brand-eyebrow">
          <span>{isKm ? "សុវត្ថិភាពគណនី" : "Account Security"}</span>
        </span>
      </div>

      <div className="auth-header">
        <h1>{t("auth.resetTitle")}</h1>
        <p>{t("auth.resetDescription")}</p>
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

        {!token && (
          <div className="auth-error ios-alert-glass">
            <FiAlertCircle />
            <span>{isKm ? "តំណភ្ជាប់ផុតកំណត់ ឬមិនត្រឹមត្រូវ។ សូមស្នើសុំតំណថ្មី។" : "Invalid or missing token. Please request a new reset link."}</span>
          </div>
        )}

        {!message ? (
          <>
            <div className="ios-input-group">
              <label htmlFor="reset-new-password">{t("auth.newPassword")}</label>
              <div className="ios-field-wrap">
                <FiLock className="ios-field-icon" aria-hidden="true" />
                <input
                  id="reset-new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
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

            <div className="ios-input-group">
              <label htmlFor="reset-confirm-password">{t("auth.confirmPassword")}</label>
              <div className="ios-field-wrap">
                <FiLock className="ios-field-icon" aria-hidden="true" />
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="ios-field-eye"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {isMatched && (
                <span className="password-match-hint success">
                  <FiCheckCircle /> {isKm ? "លេខសម្ងាត់ត្រូវគ្នា" : "Passwords match"}
                </span>
              )}
              {isMismatch && (
                <span className="password-match-hint mismatch">
                  <FiAlertCircle /> {isKm ? "លេខសម្ងាត់មិនទាន់ត្រូវគ្នាទេ" : "Passwords do not match"}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="ios-submit-btn"
              disabled={loading || !token || !password || password !== confirmPassword}
            >
              {loading ? (
                <ButtonLoader>{t("auth.updating")}</ButtonLoader>
              ) : (
                <>
                  <span>{t("auth.resetPassword")}</span>
                  <FiArrowRight />
                </>
              )}
            </button>
          </>
        ) : (
          <Link to="/login" className="ios-submit-btn">
            <span>{t("auth.returnLogin")}</span>
            <FiArrowRight />
          </Link>
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

export default ResetPassword;
