import { useState, useEffect, useRef } from "react";

export default function AnimatedCounter({
  target = 0,
  duration = 1400,
  prefix = "",
  suffix = "",
  formatter = (val) => Math.round(val).toLocaleString(),
}) {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const hasAnimatedRef = useRef(false);

  const numTarget = typeof target === "number" ? target : parseInt(String(target).replace(/,/g, ""), 10) || 0;

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true;

          const startTime = performance.now();
          const startVal = 0;
          const endVal = numTarget;

          const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease Out Expo / Quart: 1 - Math.pow(1 - progress, 3)
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentVal = startVal + (endVal - startVal) * easeProgress;

            setCount(currentVal);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(endVal);
            }
          };

          requestAnimationFrame(animate);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [numTarget, duration]);

  return (
    <span ref={elementRef} className="animated-counter-value">
      {prefix}
      {formatter(count)}
      {suffix}
    </span>
  );
}
