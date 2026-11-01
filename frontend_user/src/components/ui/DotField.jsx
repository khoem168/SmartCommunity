import { useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";

export default function DotField({ className = "" }) {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

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
    let dots = [];
    let mx = -999;
    let my = -999;

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
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots = [];
      const gap = w < 700 ? 32 : 30;
      for (let y = gap / 2; y < h; y += gap) {
        for (let x = gap / 2; x < w; x += gap) {
          dots.push({ bx: x, by: y, x, y });
        }
      }
    };

    const handlePointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
    };

    const handlePointerLeave = () => {
      mx = -999;
      my = -999;
    };

    parent.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    parent.addEventListener("pointerleave", handlePointerLeave, {
      passive: true,
    });
    window.addEventListener("resize", resize);

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

      for (let i = 0; i < dots.length; i++) {
        const p = dots[i];
        const dx = p.bx - mx;
        const dy = p.by - my;
        const dist = Math.hypot(dx, dy) || 1;
        const radius = 150;
        const push = dist < radius ? (1 - dist / radius) * 42 : 0;
        const wave = calm
          ? 0
          : Math.sin((p.bx + p.by) * 0.012 + ts * 0.0012) * 2.2;

        p.x += (p.bx + (dx / dist) * push - p.x) * 0.12;
        p.y += (p.by + (dy / dist) * push + wave - p.y) * 0.12;

        ctx.beginPath();
        ctx.fillStyle =
          push > 5
            ? "#3B6BFF"
            : isDark
              ? "rgba(255, 255, 255, 0.22)"
              : "rgba(15, 23, 42, 0.25)";
        ctx.arc(p.x, p.y, 1.3 + push * 0.035, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!calm) {
        animId = requestAnimationFrame(draw);
      }
    };

    resize();
    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      parent.removeEventListener("pointermove", handlePointerMove);
      parent.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", resize);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className={`dot-field-canvas ${className}`}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
}
