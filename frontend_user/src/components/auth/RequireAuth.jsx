import { Link, useLocation } from "react-router-dom";
import { FiArrowRight, FiLock } from "react-icons/fi";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";

const RequireAuth = ({ children }) => {
  const { user, isLoading } = useGlobleContext();
  const { t } = useLanguage();
  const location = useLocation();
  const redirectPath = `${location.pathname}${location.search}`;
  const redirectQuery = encodeURIComponent(redirectPath);

  if (isLoading) {
    return (
      <main className="auth-required-state">
        <section className="auth-required-card">
          <span className="auth-required-icon">
            <FiLock />
          </span>
          <p>{t("protected.loading")}</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="auth-required-state">
        <section className="auth-required-card">
          <span className="auth-required-icon">
            <FiLock />
          </span>
          <p className="eyebrow">{t("protected.eyebrow")}</p>
          <h1>{t("protected.title")}</h1>
          <p>{t("protected.description")}</p>
          <div className="auth-required-actions">
            <Link
              className="btn primary"
              to={`/register?redirect=${redirectQuery}`}
            >
              {t("protected.createAccount")} <FiArrowRight />
            </Link>
            <Link
              className="btn outline"
              to={`/login?redirect=${redirectQuery}`}
            >
              {t("protected.signIn")}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return children;
};

export default RequireAuth;
