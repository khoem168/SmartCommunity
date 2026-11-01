import { forwardRef } from "react";
import "./Button.css";

const Button = forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "md",
      iconLeft = null,
      iconRight = null,
      loading = false,
      disabled = false,
      as: Component = "button",
      className = "",
      ...props
    },
    ref,
  ) => {
    const isActuallyDisabled = disabled || loading;
    const computedClassName = [
      "btn",
      `btn-${variant}`,
      `btn-${size}`,
      loading ? "is-loading" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <Component
        ref={ref}
        className={computedClassName}
        disabled={Component === "button" ? isActuallyDisabled : undefined}
        aria-disabled={isActuallyDisabled ? "true" : undefined}
        {...props}
      >
        {loading && <span className="btn-spinner" aria-hidden="true" />}
        {!loading && iconLeft && (
          <span className="btn-icon-left" aria-hidden="true">
            {iconLeft}
          </span>
        )}
        <span className="btn-text">{children}</span>
        {!loading && iconRight && (
          <span className="btn-icon-right" aria-hidden="true">
            {iconRight}
          </span>
        )}
      </Component>
    );
  },
);

Button.displayName = "Button";

export default Button;
