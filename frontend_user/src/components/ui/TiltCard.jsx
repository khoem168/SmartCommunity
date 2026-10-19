import { useEffect, useRef } from "react";

// Decorative only: no layout changes, and no movement for touch/reduced motion.
export default function TiltCard({ children, className = "", ...props }) {
  const ref = useRef(null);
  useEffect(() => {
    const element = ref.current;
    const allowed = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let frame;
    const reset = () => {
      cancelAnimationFrame(frame);
      element.style.removeProperty("transform");
    };
    const move = (event) => {
      if (!allowed.matches || event.pointerType === "touch") return;
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        element.style.transform = `perspective(1000px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
      });
    };
    allowed.addEventListener("change", reset);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerleave", reset);
    element.addEventListener("pointercancel", reset);
    return () => {
      reset();
      allowed.removeEventListener("change", reset);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", reset);
      element.removeEventListener("pointercancel", reset);
    };
  }, []);
  return <article ref={ref} className={`sc-tilt ${className}`} {...props}>{children}</article>;
}
