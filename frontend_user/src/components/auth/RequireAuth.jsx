import { Link, useLocation } from "react-router-dom";
import { FiArrowRight, FiLock, FiShield } from "react-icons/fi";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";

const RequireAuth = ({ children, allowedRoles = null }) => {
  const { user, isLoading } = useGlobleContext();
  const { language, t } = useLanguage();
  const isKm = language === "km";
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

  // Role-based Access Control Check
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const userRole = user.role || "student";
    const isAllowed = allowedRoles.includes(userRole);

    if (!isAllowed) {
      const roleText = allowedRoles.join(isKm ? " ឬ " : " or ");
      return (
        <main className="auth-required-state">
          <section className="auth-required-card access-denied-card">
            <span className="auth-required-icon access-denied-icon">
              <FiShield />
            </span>
            <p className="eyebrow" style={{ color: "var(--red, #ef4444)" }}>
              {isKm ? "គ្មានសិទ្ធិចូលប្រើ (403 Forbidden)" : "Access Denied (403 Forbidden)"}
            </p>
            <h1>{isKm ? "អ្នកមិនមានសិទ្ធិចូលទំព័រនេះទេ" : "Restricted Page"}</h1>
            <p>
              {isKm
                ? `ទំព័រនេះតម្រូវឱ្យមានតួនាទីជា [${roleText}]។ គណនីរបស់អ្នកបច្ចុប្បន្នមានតួនាទីជា [${userRole}]។`
                : `This page is restricted to [${roleText}] roles. Your current account role is [${userRole}].`}
            </p>
            <div className="auth-required-actions">
              <Link className="btn primary" to="/dashboard">
                {isKm ? "ត្រឡប់ទៅ Workspace" : "Go to Workspace"} <FiArrowRight />
              </Link>
              <Link className="btn outline" to="/">
                {isKm ? "ទំព័រដើម" : "Home"}
              </Link>
            </div>
          </section>
        </main>
      );
    }
  }

  return children;
};

export default RequireAuth;
