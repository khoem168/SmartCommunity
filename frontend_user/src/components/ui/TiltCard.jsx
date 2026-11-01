import { useEffect, useRef } from "react";
import "./TiltCard.css";

export default function TiltCard({
  children,
  className = "",
  maxTilt = 8,
  perspective = 1000,
  glare = true,
  as: Component = "div",
  ...props
}) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const allowed = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );

    let frame;
    const reset = () => {
      cancelAnimationFrame(frame);
      element.style.transform = "";
    };

    const move = (event) => {
      if (!allowed.matches || event.pointerType === "touch") return;
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      element.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      element.style.setProperty("--my", `${event.clientY - rect.top}px`);

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        element.style.transform = `perspective(${perspective}px) rotateX(${-y * maxTilt}deg) rotateY(${x * maxTilt}deg) scale(1.02)`;
      });
    };

    allowed.addEventListener("change", reset);
    element.addEventListener("pointermove", move, { passive: true });
    element.addEventListener("pointerleave", reset);
    element.addEventListener("pointercancel", reset);

    return () => {
      reset();
      allowed.removeEventListener("change", reset);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", reset);
      element.removeEventListener("pointercancel", reset);
    };
  }, [maxTilt, perspective]);

  return (
    <Component
      ref={ref}
      className={`glass tilt-card ${glare ? "has-glare" : ""} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
