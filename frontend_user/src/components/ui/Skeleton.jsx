import "./Skeleton.css";

export default function Skeleton({
  variant = "rect",
  width,
  height,
  borderRadius,
  className = "",
  count = 1,
  style = {},
  ...props
}) {
  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, index) => (
        <div
          key={index}
          className={`skel skel-${variant} ${className}`}
          style={{
            width: width || (variant === "circle" ? "48px" : "100%"),
            height: height || (variant === "text" ? "16px" : "48px"),
            borderRadius:
              borderRadius ||
              (variant === "circle"
                ? "50%"
                : variant === "pill"
                  ? "999px"
                  : "var(--radius-card, 24px)"),
            ...style,
          }}
          aria-hidden="true"
          {...props}
        />
      ))}
    </>
  );
}
