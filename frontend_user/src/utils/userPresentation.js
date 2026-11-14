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
  VANNAKSENG: {
    name: "Vannak Seng",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
  },
  SOPHEAPCHAN: {
    name: "Sopheap Chan",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  },
  BOPHAPICH: {
    name: "Bopha Pich",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
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
    user.avatar_url ||
    user.avatar ||
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

export const formatKhmerRelativeTime = (dateString, isKm = true) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return String(dateString);

  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const toKhmerNum = (num) => String(num).replace(/[0-9]/g, (d) => "០១២៣៤៥៦៧៨៩"[d]);

  if (!isKm) {
    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (diffSec < 45) return "ទើបតែមុននេះ";
  if (diffMin < 60) return `${toKhmerNum(diffMin)} នាទីមុន`;
  if (diffHour < 24) return `${toKhmerNum(diffHour)} ម៉ោងមុន`;

  const hours = date.getHours();
  const mins = date.getMinutes();
  const period = hours >= 12 ? "ល្ងាច" : "ព្រឹក";
  const formattedHours = hours % 12 || 12;
  const minsStr = mins < 10 ? "0" + mins : String(mins);

  if (diffDay === 1) {
    return `ម្សិលមិញ ម៉ោង ${toKhmerNum(formattedHours)}:${toKhmerNum(minsStr)} ${period}`;
  }
  if (diffDay < 7) {
    return `${toKhmerNum(diffDay)} ថ្ងៃមុន`;
  }

  const khmerMonths = [
    "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
    "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ",
  ];
  const day = toKhmerNum(date.getDate());
  const month = khmerMonths[date.getMonth()];
  const year = toKhmerNum(date.getFullYear());
  return `${day} ${month} ${year}, ម៉ោង ${toKhmerNum(formattedHours)}:${toKhmerNum(minsStr)} ${period}`;
};

