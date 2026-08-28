import heangChhengKhoemPhoto from "../assets/team/heang-chheng-khoem.jpg";
import hornPiseyPhoto from "../assets/team/horn-pisey.jpg";
import krySoranuthPhoto from "../assets/team/kry-soranuth.jpg";
import muyKalinPhoto from "../assets/team/muy-kalin.jpg";
import samrithRatanaPhoto from "../assets/team/samrith-ratana.jpg";
import { API_BASE_URL } from "../services/api";

const teamProfiles = {
  MUYKALIN: { name: "MUY KALIN", avatarUrl: muyKalinPhoto },
  MUTKALIN: { name: "MUY KALIN", avatarUrl: muyKalinPhoto },
  HORNPISEY: { name: "HORN PISEY", avatarUrl: hornPiseyPhoto },
  KRYSORANUTH: { name: "KRY SORANUTH", avatarUrl: krySoranuthPhoto },
  SAMRITHRATANA: { name: "SAMRITH RATANA", avatarUrl: samrithRatanaPhoto },
  HEANGCHHENGKHOEM: {
    name: "HEANG CHHENGKHOEM",
    avatarUrl: heangChhengKhoemPhoto,
  },
};

const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, "");

export const userKey = (name = "") =>
  String(name).normalize("NFKC").replace(/[^a-z0-9]/gi, "").toUpperCase();

export const getUserName = (user = {}) =>
  user.fullName ||
  user.name ||
  user.senderName ||
  user.authorName ||
  user.hostName ||
  user.email ||
  "Community member";

export const getUserInitials = (name = "") =>
  String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

export const resolveMediaUrl = (value = "") => {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^(data:|blob:)/i.test(url)) return url;
  if (url.startsWith("/")) return `${apiOrigin}${url}`;
  if (/^uploads\//i.test(url)) return `${apiOrigin}/${url}`;

  try {
    const parsed = new URL(url);
    if (["localhost", "127.0.0.1"].includes(parsed.hostname)) {
      return `${apiOrigin}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    return url;
  }

  return url;
};

export const getAvatarCandidates = (user = {}) => {
  const teamProfile = teamProfiles[userKey(getUserName(user))];
  const suppliedAvatar =
    user.avatarUrl ||
    user.senderAvatarUrl ||
    user.authorAvatar ||
    user.hostAvatarUrl ||
    user.studentAvatar ||
    user.image ||
    "";

  return [
    ...new Set(
      [resolveMediaUrl(suppliedAvatar), teamProfile?.avatarUrl].filter(Boolean),
    ),
  ];
};

export const presentUser = (user = {}) => {
  const originalName = getUserName(user);
  const teamProfile = teamProfiles[userKey(originalName)];
  return {
    ...user,
    name: teamProfile?.name || originalName,
    avatarUrl: getAvatarCandidates(user)[0] || "",
  };
};

