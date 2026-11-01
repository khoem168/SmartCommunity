import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useGlobleContext } from "../../context/GlobleContext";
import "./DashBanner.css";

export default function DashBanner({ onAuthClick }) {
  const canvasRef = useRef(null);
  const { language } = useLanguage();
  const { user } = useGlobleContext();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = null;
    let isVisible = true;
    let w = 0;
    let h = 0;

    const calm =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    window.addEventListener("resize", resize);
    resize();

    const observer = new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
      if (isVisible && !calm) {
        cancelAnimationFrame(animId);
        animId = requestAnimationFrame(draw);
      }
    });
    observer.observe(parent);

    const draw = (ts) => {
      if (!isVisible) return;
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.72;
      const cy = h * 0.5;
      ctx.lineCap = "round";
      ctx.lineWidth = 3;

      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      for (let i = 1; i <= 16; i++) {
        const r = i * 28 + 10;
        const n = Math.floor(r / 10);
        const dir = i % 2 ? 1 : -1;
        const baseAlpha = Math.max(0.08, (1 - i / 18) * (isDark ? 0.75 : 0.35));
        ctx.strokeStyle = isDark
          ? `rgba(96, 165, 250, ${baseAlpha})`
          : `rgba(37, 99, 235, ${baseAlpha})`;

        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2 + (calm ? 0 : ts * 0.00018 * dir);
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7);
          ctx.stroke();
        }
      }

      if (!calm) {
        animId = requestAnimationFrame(draw);
      }
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  const headline =
    language === "km"
      ? "ត្រៀមខ្លួនចាប់ផ្តើមដំណើរហើយឬនៅ?"
      : "Ready to start your journey?";

  const startLearningLabel =
    language === "km" ? "ចាប់ផ្តើមរៀន" : "Start learning";

  const accountActionLabel = user
    ? language === "km"
      ? "បើកផ្ទាំងគ្រប់គ្រង"
      : "Open dashboard"
    : language === "km"
      ? "បង្កើតគណនី"
      : "Create account";

  return (
    <section className="dash-banner-section" style={{ paddingTop: 0 }}>
      <div className="container">
        <div className="cta reveal">
          <canvas ref={canvasRef} aria-hidden="true" />
          <div className="cta-in">
            <h2>{headline}</h2>
            <div className="cta-actions">
              <Link className="btn btn-l" to="/courses">
                {startLearningLabel}
              </Link>
              {user ? (
                <Link className="btn btn-d" to="/dashboard">
                  {accountActionLabel}
                </Link>
              ) : onAuthClick ? (
                <button
                  type="button"
                  className="btn btn-d"
                  onClick={onAuthClick}
                >
                  {accountActionLabel}
                </button>
              ) : (
                <Link className="btn btn-d" to="/register">
                  {accountActionLabel}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
