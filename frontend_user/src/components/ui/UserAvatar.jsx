import { useMemo, useState } from "react";
import {
  getAvatarCandidates,
  getUserInitials,
  getUserName,
} from "../../utils/userPresentation";
import "./UserAvatar.css";

const UserAvatar = ({
  user = {},
  className = "",
  icon = null,
  alt = "",
  size = null,
  style = undefined,
}) => {
  const name = getUserName(user);
  const candidates = useMemo(
    () => getAvatarCandidates(user),
    [user],
  );
  const [failedSources, setFailedSources] = useState(() => new Set());
  const source = candidates.find((candidate) => !failedSources.has(candidate)) || "";

  const resolvedStyle = size
    ? {
        "--avatar-size": typeof size === "number" ? `${size}px` : size,
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
        minWidth: typeof size === "number" ? `${size}px` : size,
        minHeight: typeof size === "number" ? `${size}px` : size,
        fontSize: typeof size === "number" ? `${Math.round(size * 0.36)}px` : undefined,
        ...style,
      }
    : style;

  return (
    <span
      className={`user-avatar-shell ${source ? "has-image" : "is-fallback"} ${className}`.trim()}
      title={name}
      style={resolvedStyle}
    >
      {source ? (
        <img
          src={source}
          alt={alt || `${name} profile`}
          loading="lazy"
          onError={() =>
            setFailedSources((current) => new Set(current).add(source))
          }
        />
      ) : (
        icon || getUserInitials(name)
      )}
    </span>
  );
};

export default UserAvatar;
