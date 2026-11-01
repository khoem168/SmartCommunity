import "./EmptyState.css";

export default function EmptyState({
  icon = "🔍",
  title,
  description,
  action = null,
  className = "",
}) {
  return (
    <div className={`glass empty empty-state-card ${className}`}>
      <div className="empty-icon big" aria-hidden="true">
        {icon}
      </div>
      {title && <h3 className="empty-title">{title}</h3>}
      {description && <p className="empty-desc muted">{description}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}
