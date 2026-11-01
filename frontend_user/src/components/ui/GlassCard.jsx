import { useEffect, useRef } from "react";
import "./GlassCard.css";

const GlassCard = ({
  children,
  className = "",
  as: Component = "div",
  ...props
}) => {
  const cardRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const handlePointerMove = (e) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      el.style.setProperty("--my", `${e.clientY - rect.top}px`);
    };

    el.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => el.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return (
    <Component
      ref={cardRef}
      className={`glass glass-card ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export default GlassCard;
