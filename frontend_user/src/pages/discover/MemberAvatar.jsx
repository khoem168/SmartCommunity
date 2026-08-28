import { useState } from "react";
import { memberInitials } from "./memberPresentation";

const MemberAvatar = ({ member, profile = false }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const className = profile ? "discover-profile-avatar" : "discover-avatar";
  const showImage = Boolean(member.avatarUrl && !imageFailed);

  return (
    <span className={`${className}${showImage ? " has-image" : ""}`}>
      {showImage ? (
        <img
          src={member.avatarUrl}
          alt={`${member.name} profile`}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        memberInitials(member.name)
      )}
    </span>
  );
};

export default MemberAvatar;
