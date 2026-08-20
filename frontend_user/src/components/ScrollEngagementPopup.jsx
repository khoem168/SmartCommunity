import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  IoArrowForward,
  IoCheckmarkCircle,
  IoClose,
  IoSparklesOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../context/GlobleContext";
import { useLanguage } from "../context/LanguageContext";
import "./ScrollEngagementPopup.css";

const DISMISSED_STORAGE_KEY = "smartCommunityScrollPopupDismissedAt";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;
const POPUP_IMAGE =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=82";

const wasRecentlyDismissed = () => {
  try {
    const dismissedAt = Number(
      window.localStorage.getItem(DISMISSED_STORAGE_KEY),
    );
    return (
      Number.isFinite(dismissedAt) &&
      Date.now() - dismissedAt < DISMISS_DURATION
    );
  } catch {
    return false;
  }
};

const ScrollEngagementPopup = () => {
  const { pathname } = useLocation();
  const { user } = useGlobleContext();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(wasRecentlyDismissed);
  const [imageState, setImageState] = useState("loading");

  const isExcludedRoute =
    [
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/verify-email",
      "/messages",
      "/admin",
    ].some((route) => pathname.startsWith(route)) ||
    /^\/sessions\/[^/]+\/room\/?$/.test(pathname);

  useEffect(() => {
    if (dismissed || isExcludedRoute) return undefined;

    let showTimer;
    const handleScroll = () => {
      const scrollableDistance = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const triggerPoint = Math.min(
        760,
        Math.max(320, scrollableDistance * 0.32),
      );

      if (window.scrollY < triggerPoint) return;

      window.removeEventListener("scroll", handleScroll);
      showTimer = window.setTimeout(() => setVisible(true), 450);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.clearTimeout(showTimer);
    };
  }, [dismissed, isExcludedRoute, pathname]);

  useEffect(() => {
    if (!visible) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        try {
          window.localStorage.setItem(
            DISMISSED_STORAGE_KEY,
            String(Date.now()),
          );
        } catch {
          // The popup can still close if browser storage is unavailable.
        }
        setVisible(false);
        setDismissed(true);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [visible]);

  const dismissPopup = () => {
    try {
      window.localStorage.setItem(DISMISSED_STORAGE_KEY, String(Date.now()));
    } catch {
      // The popup can still close if browser storage is unavailable.
    }
    setVisible(false);
    setDismissed(true);
  };

  if (!visible || dismissed || isExcludedRoute) return null;

  const firstName = user?.fullName?.trim().split(/\s+/)[0];
  const content = user
    ? {
        eyebrow: firstName
          ? t("popup.memberEyebrowName", { name: firstName })
          : t("popup.memberEyebrow"),
        title: t("popup.memberTitle"),
        description: t("popup.memberDescription"),
        primaryLabel: t("popup.continueLearning"),
        primaryTo: "/courses",
        secondaryLabel: t("popup.openDashboard"),
        secondaryTo: "/dashboard",
        note: t("popup.memberNote"),
      }
    : {
        eyebrow: t("popup.guestEyebrow"),
        title: t("popup.guestTitle"),
        description: t("popup.guestDescription"),
        primaryLabel: t("popup.joinFree"),
        primaryTo: "/register",
        secondaryLabel: t("popup.exploreCourses"),
        secondaryTo: "/courses",
        note: t("popup.guestNote"),
      };

  return (
    <aside
      className="scroll-engagement-popup"
      role="dialog"
      aria-modal="false"
      aria-labelledby="scroll-popup-title"
      aria-describedby="scroll-popup-description"
    >
      <button
        type="button"
        className="scroll-popup-close"
        onClick={dismissPopup}
        aria-label={t("popup.close")}
      >
        <IoClose aria-hidden="true" />
      </button>

      <div className={`scroll-popup-media ${imageState}`}>
        {imageState !== "error" && (
          <img
            src={POPUP_IMAGE}
            alt={t("popup.imageAlt")}
            loading="eager"
            decoding="async"
            onLoad={() => setImageState("loaded")}
            onError={() => setImageState("error")}
          />
        )}

        {imageState === "loading" && (
          <div className="scroll-popup-image-loading" aria-live="polite">
            <span className="scroll-popup-loader" aria-hidden="true" />
            <span>{t("popup.loadingImage")}</span>
          </div>
        )}

        {imageState === "error" && (
          <div className="scroll-popup-image-fallback">
            <IoSparklesOutline aria-hidden="true" />
            <span>{t("popup.imageFallback")}</span>
          </div>
        )}

        <span className="scroll-popup-media-badge">
          <IoCheckmarkCircle aria-hidden="true" />
          {t("popup.imageBadge")}
        </span>
      </div>

      <div className="scroll-popup-body">
        <div className="scroll-popup-heading">
          <span className="scroll-popup-icon">
            <IoSparklesOutline aria-hidden="true" />
          </span>
          <div>
            <p className="scroll-popup-kicker">{content.eyebrow}</p>
            <h2 id="scroll-popup-title">{content.title}</h2>
          </div>
        </div>

        <p id="scroll-popup-description" className="scroll-popup-description">
          {content.description}
        </p>

        <div className="scroll-popup-actions">
          <Link
            className="scroll-popup-button primary"
            to={content.primaryTo}
            onClick={dismissPopup}
          >
            {content.primaryLabel}
            <IoArrowForward aria-hidden="true" />
          </Link>
          <Link
            className="scroll-popup-button secondary"
            to={content.secondaryTo}
            onClick={dismissPopup}
          >
            {content.secondaryLabel}
          </Link>
        </div>

        <p className="scroll-popup-note">
          <IoCheckmarkCircle aria-hidden="true" />
          {content.note}
        </p>
      </div>
    </aside>
  );
};

export default ScrollEngagementPopup;
