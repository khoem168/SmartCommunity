import { useEffect } from "react";
import {
  IoAlertCircleOutline,
  IoCheckmarkCircleOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoCloseOutline,
  IoFileTrayOutline,
  IoRefreshOutline,
} from "react-icons/io5";
import { number, pretty } from "../utils/format";

export const StatusBadge = ({ value }) => (
  <span className={`status-badge status-${String(value).toLowerCase()}`}>
    {pretty(value)}
  </span>
);

export const LoadingState = ({ label = "Loading live data…" }) => (
  <div className="state-card loading-state" role="status">
    <span className="spinner" />
    <strong>{label}</strong>
    <p>Synchronizing with the administration API.</p>
  </div>
);

export const EmptyState = ({ title, message, action }) => (
  <div className="state-card empty-state">
    <span className="state-icon">
      <IoFileTrayOutline />
    </span>
    <strong>{title}</strong>
    <p>{message}</p>
    {action}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="state-card error-state" role="alert">
    <span className="state-icon">
      <IoAlertCircleOutline />
    </span>
    <strong>Unable to load this view</strong>
    <p>{message}</p>
    {onRetry && (
      <button className="button secondary" type="button" onClick={onRetry}>
        <IoRefreshOutline /> Try again
      </button>
    )}
  </div>
);

export const Pagination = ({ pagination, onChange }) => {
  if (!pagination || pagination.pages <= 1) return null;
  return (
    <div className="pagination">
      <p>
        Page <strong>{pagination.page}</strong> of {pagination.pages} ·{" "}
        {number(pagination.total)} records
      </p>
      <div>
        <button
          type="button"
          aria-label="Previous page"
          disabled={pagination.page <= 1}
          onClick={() => onChange(pagination.page - 1)}
        >
          <IoChevronBackOutline />
        </button>
        <button
          type="button"
          aria-label="Next page"
          disabled={pagination.page >= pagination.pages}
          onClick={() => onChange(pagination.page + 1)}
        >
          <IoChevronForwardOutline />
        </button>
      </div>
    </div>
  );
};

export const Modal = ({ title, description, children, onClose, footer }) => {
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.classList.remove("modal-open");
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
            <IoCloseOutline />
            <span className="sr-only">Close</span>
          </button>
        </header>
        <div className="modal-content">{children}</div>
        {footer && <footer>{footer}</footer>}
      </section>
    </div>
  );
};

export const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(onClose, 3800);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.type || "success"}`} role="status">
      {toast.type === "error" ? (
        <IoAlertCircleOutline />
      ) : (
        <IoCheckmarkCircleOutline />
      )}
      <span>{toast.message}</span>
      <button type="button" onClick={onClose}>
        <IoCloseOutline />
      </button>
    </div>
  );
};
