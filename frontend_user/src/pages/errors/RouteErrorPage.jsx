import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import {
  IoArrowBackOutline,
  IoHomeOutline,
  IoRefreshOutline,
  IoSearchOutline,
} from "react-icons/io5";
import { useLanguage } from "../../context/LanguageContext";
import "./RouteErrorPage.css";

const ErrorView = ({ error = null, notFound = false }) => {
  const { t } = useLanguage();
  const routeStatus = isRouteErrorResponse(error) ? error.status : null;
  const missing = notFound || routeStatus === 404;
  const status = missing ? "404" : String(routeStatus || "500");

  return (
    <main className="route-error-page">
      <div className="route-error-orb route-error-orb-one" aria-hidden="true" />
      <div className="route-error-orb route-error-orb-two" aria-hidden="true" />

      <section className="route-error-card" aria-labelledby="route-error-title">
        <div className="route-error-icon" aria-hidden="true">
          {missing ? <IoSearchOutline /> : <IoRefreshOutline />}
        </div>
        <span className="route-error-code">{status}</span>
        <p className="route-error-kicker">
          {missing ? t("common.notFoundKicker") : t("common.errorKicker")}
        </p>
        <h1 id="route-error-title">
          {missing ? t("common.notFoundTitle") : t("common.errorTitle")}
        </h1>
        <p className="route-error-description">
          {missing
            ? t("common.notFoundDescription")
            : t("common.errorDescription")}
        </p>

        <div className="route-error-actions">
          <Link to="/" className="route-error-primary">
            <IoHomeOutline />
            {t("common.goHome")}
          </Link>
          {missing ? (
            <button type="button" onClick={() => window.history.back()}>
              <IoArrowBackOutline />
              {t("common.goBack")}
            </button>
          ) : (
            <button type="button" onClick={() => window.location.reload()}>
              <IoRefreshOutline />
              {t("common.tryAgain")}
            </button>
          )}
        </div>
      </section>
    </main>
  );
};

export const RouteErrorBoundary = () => {
  const error = useRouteError();
  return <ErrorView error={error} />;
};

export const NotFoundPage = () => <ErrorView notFound />;
