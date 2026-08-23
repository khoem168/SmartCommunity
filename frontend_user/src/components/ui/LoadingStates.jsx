import "./LoadingStates.css";

const line = (className = "") => (
  <span className={`skeleton-block ${className}`} aria-hidden="true" />
);

export const ButtonLoader = ({ children }) => (
  <span className="button-loading-state" aria-live="polite">
    <span className="button-spinner" aria-hidden="true" />
    <span>{children}</span>
  </span>
);

export const CardSkeleton = ({ variant = "card" }) => (
  <article
    className={`skeleton-card skeleton-card-${variant}`}
    aria-hidden="true"
  >
    {variant === "course" && (
      <>
        {line("skeleton-media")}
        <div className="skeleton-card-body">
          {line("skeleton-chip")}
          {line("skeleton-title")}
          {line("skeleton-text")}
          {line("skeleton-text short")}
          <div className="skeleton-meta-row">
            {line("skeleton-pill")}
            {line("skeleton-pill")}
          </div>
          <div className="skeleton-footer-row">
            {line("skeleton-price")}
            {line("skeleton-action")}
          </div>
        </div>
      </>
    )}

    {variant === "mentor" && (
      <>
        <div className="skeleton-person-row">
          {line("skeleton-avatar")}
          <div>
            {line("skeleton-title compact")}
            {line("skeleton-text tiny")}
          </div>
        </div>
        {line("skeleton-text")}
        {line("skeleton-text short")}
        <div className="skeleton-meta-row">
          {line("skeleton-chip")}
          {line("skeleton-chip")}
          {line("skeleton-chip")}
        </div>
        <div className="skeleton-footer-row">
          {line("skeleton-pill")}
          {line("skeleton-action")}
        </div>
      </>
    )}

    {variant === "internship" && (
      <>
        <div className="skeleton-person-row">
          {line("skeleton-avatar square")}
          <div>
            {line("skeleton-chip")}
            {line("skeleton-title compact")}
            {line("skeleton-text tiny")}
          </div>
        </div>
        {line("skeleton-text")}
        {line("skeleton-text short")}
        <div className="skeleton-meta-row wrap">
          {line("skeleton-pill")}
          {line("skeleton-pill")}
          {line("skeleton-pill")}
        </div>
        <div className="skeleton-footer-row">
          {line("skeleton-price")}
          {line("skeleton-action")}
        </div>
      </>
    )}

    {variant === "session" && (
      <>
        <div className="skeleton-footer-row">
          {line("skeleton-chip")}
          {line("skeleton-chip")}
        </div>
        {line("skeleton-title")}
        {line("skeleton-text")}
        {line("skeleton-text short")}
        <div className="skeleton-person-row">
          {line("skeleton-avatar")}
          <div>
            {line("skeleton-text compact")}
            {line("skeleton-text tiny")}
          </div>
        </div>
        <div className="skeleton-meta-row wrap">
          {line("skeleton-pill")}
          {line("skeleton-pill")}
          {line("skeleton-pill")}
        </div>
      </>
    )}

    {variant === "career" && (
      <>
        <div className="skeleton-footer-row">
          {line("skeleton-chip")}
          {line("skeleton-pill")}
        </div>
        {line("skeleton-title")}
        {line("skeleton-text")}
        {line("skeleton-text short")}
        <div className="skeleton-meta-row wrap">
          {line("skeleton-chip")}
          {line("skeleton-chip")}
          {line("skeleton-chip")}
        </div>
        <div className="skeleton-footer-row">
          {line("skeleton-pill")}
          {line("skeleton-action")}
        </div>
      </>
    )}

    {variant === "community" && (
      <>
        <div className="skeleton-footer-row">
          {line("skeleton-avatar")}
          {line("skeleton-chip")}
        </div>
        {line("skeleton-title")}
        {line("skeleton-text")}
        {line("skeleton-text short")}
        <div className="skeleton-person-row">
          {line("skeleton-avatar")}
          <div>
            {line("skeleton-text compact")}
            {line("skeleton-text tiny")}
          </div>
        </div>
      </>
    )}

    {variant === "detail" && (
      <>
        {line("skeleton-kicker")}
        {line("skeleton-hero-title")}
        {line("skeleton-text wide")}
        {line("skeleton-text")}
        <div className="skeleton-meta-row wrap">
          {line("skeleton-pill")}
          {line("skeleton-pill")}
          {line("skeleton-pill")}
        </div>
        {line("skeleton-panel")}
      </>
    )}
  </article>
);

export const SkeletonGrid = ({
  count = 3,
  variant = "card",
  className = "skeleton-grid",
  label = "Loading content",
}) => (
  <div
    className={`${className} skeleton-grid-wrap`}
    aria-label={label}
    aria-busy="true"
  >
    {Array.from({ length: count }, (_, index) => (
      <CardSkeleton key={`${variant}-${index}`} variant={variant} />
    ))}
  </div>
);
