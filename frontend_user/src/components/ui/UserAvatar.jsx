import { useMemo, useState } from "react";
import {
  getAvatarCandidates,
  getUserInitials,
  getUserName,
} from "../../utils/userPresentation";
import "./UserAvatar.css";

const UserAvatar = ({ user = {}, className = "", icon = null, alt = "" }) => {
  const name = getUserName(user);
  const candidates = useMemo(
    () => getAvatarCandidates(user),
    [user],
  );
  const [failedSources, setFailedSources] = useState(() => new Set());
  const source = candidates.find((candidate) => !failedSources.has(candidate)) || "";

  return (
    <span
      className={`user-avatar-shell ${source ? "has-image" : "is-fallback"} ${className}`.trim()}
      title={name}
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
