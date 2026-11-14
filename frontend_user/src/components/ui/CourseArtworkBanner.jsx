import { useState } from "react";
import {
  IoLogoReact,
  IoLogoNodejs,
  IoLogoPython,
  IoLogoFigma,
  IoShieldCheckmarkOutline,
  IoGitBranchOutline,
  IoCloudOutline,
  IoPhonePortraitOutline,
  IoSparklesOutline,
  IoPlay,
  IoDocumentTextOutline,
} from "react-icons/io5";
import { useLanguage } from "../../context/LanguageContext";

const ARTWORK_THEMES = {
  frontend: {
    bg: "linear-gradient(135deg, #38bdf8 0%, #0284c7 52%, #0369a1 100%)",
    emblemBg: "#0f172a",
    emblemColor: "#38bdf8",
    label: "Frontend Web",
    youtubeId: "bMknfKXIFA8",
    Icon: IoLogoReact,
  },
  backend: {
    bg: "linear-gradient(135deg, #22c55e 0%, #16a34a 55%, #15803d 100%)",
    emblemBg: "#052e16",
    emblemColor: "#4ade80",
    label: "Backend & API",
    youtubeId: "Oe421EPjeBE",
    Icon: IoLogoNodejs,
  },
  design: {
    bg: "linear-gradient(135deg, #a855f7 0%, #7e22ce 55%, #6b21a8 100%)",
    emblemBg: "#2e1065",
    emblemColor: "#e879f9",
    label: "Figma UI/UX",
    youtubeId: "c9Wg6Cb_YlU",
    Icon: IoLogoFigma,
  },
  data: {
    bg: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 58%, #f59e0b 140%)",
    emblemBg: "#1e3a8a",
    emblemColor: "#facc15",
    label: "Python Data",
    youtubeId: "rfscVS0vtbw",
    Icon: IoLogoPython,
  },
  security: {
    bg: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 55%, #1e40af 100%)",
    emblemBg: "#0f172a",
    emblemColor: "#38bdf8",
    label: "Cybersecurity",
    youtubeId: "inWWhr5tnEA",
    Icon: IoShieldCheckmarkOutline,
  },
  career: {
    bg: "linear-gradient(135deg, #f97316 0%, #ea580c 55%, #c2410c 100%)",
    emblemBg: "#431407",
    emblemColor: "#ffffff",
    label: "Career Prep",
    youtubeId: "RGOj5yH7evk",
    Icon: IoGitBranchOutline,
  },
  cloud: {
    bg: "linear-gradient(135deg, #0284c7 0%, #0369a1 55%, #075985 100%)",
    emblemBg: "#082f49",
    emblemColor: "#38bdf8",
    label: "Docker & AWS",
    youtubeId: "fqMOX6JJhGo",
    Icon: IoCloudOutline,
  },
  mobile: {
    bg: "linear-gradient(135deg, #06b6d4 0%, #0891b2 55%, #0e7490 100%)",
    emblemBg: "#164e63",
    emblemColor: "#22d3ee",
    label: "Mobile Apps",
    youtubeId: "VPvVD8t02U8",
    Icon: IoPhonePortraitOutline,
  },
  ai: {
    bg: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 55%, #4c1d95 100%)",
    emblemBg: "#2e1065",
    emblemColor: "#c084fc",
    label: "AI & ML",
    youtubeId: "_ZvnD93Mr5Q",
    Icon: IoSparklesOutline,
  },
};

export function resolveCourseArtworkKey(course = {}) {
  const text = `${course.slug || ""} ${course.category || ""} ${course.title || ""} ${course.titleEn || ""}`.toLowerCase();
  if (text.includes("flutter") || text.includes("react-native") || text.includes("mobile") || text.includes("android") || text.includes("ios")) {
    return "mobile";
  }
  if (text.includes("docker") || text.includes("aws") || text.includes("cloud") || text.includes("devops") || text.includes("container")) {
    return "cloud";
  }
  if (text.includes("prompt") || text.includes("machine-learning") || text.includes("ai") || text.includes("llm") || text.includes("copilot")) {
    return "ai";
  }
  if (text.includes("security") || text.includes("penetration") || text.includes("owasp") || text.includes("cyber")) {
    return "security";
  }
  if (text.includes("node") || text.includes("express") || text.includes("nestjs") || text.includes("api") || text.includes("backend") || text.includes("sql") || text.includes("database")) {
    return "backend";
  }
  if (text.includes("ux") || text.includes("ui") || text.includes("figma") || text.includes("design")) {
    return "design";
  }
  if (text.includes("python") || text.includes("pandas") || text.includes("data")) {
    return "data";
  }
  if (text.includes("git") || text.includes("portfolio") || text.includes("career") || text.includes("interview")) {
    return "career";
  }
  return "frontend";
}

export default function CourseArtworkBanner({ course = {} }) {
  const { language } = useLanguage();
  const isKm = language === "km";
  const key = resolveCourseArtworkKey(course);
  const theme = ARTWORK_THEMES[key] || ARTWORK_THEMES.frontend;
  const Icon = theme.Icon;

  const ytId = course.youtubeId || theme.youtubeId;
  const primaryThumb =
    course.thumbnailUrl ||
    (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : "");
  const fallbackThumb =
    course.fallbackThumbnailUrl ||
    (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : "");

  const [imgSrc, setImgSrc] = useState(primaryThumb);
  const [imgFailed, setImgFailed] = useState(false);

  const handleImgError = () => {
    if (imgSrc !== fallbackThumb && fallbackThumb) {
      setImgSrc(fallbackThumb);
    } else {
      setImgFailed(true);
    }
  };

  const durationText = isKm
    ? course.durationKm || course.duration || "6 ម៉ោង"
    : course.durationEn || course.duration || "6h 15m";

  return (
    <div
      className="ckl-artwork-banner"
      style={{
        background: theme.bg,
        position: "relative",
        aspectRatio: "16 / 9",
        width: "100%",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
      }}
      aria-hidden="true"
    >
      {!imgFailed && imgSrc ? (
        <>
          <img
            src={imgSrc}
            alt=""
            onError={handleImgError}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transition: "transform 0.35s ease",
            }}
            className="ckl-yt-thumb-img"
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(15,23,42,0) 65%, rgba(15,23,42,0.45) 100%)",
              pointerEvents: "none",
            }}
          />
        </>
      ) : (
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "inline-flex",
            alignItems: "center",
            gap: "14px",
            padding: "14px 22px",
            borderRadius: "20px",
            background: "rgba(255, 255, 255, 0.14)",
            border: "1px solid rgba(255, 255, 255, 0.28)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: theme.emblemBg,
              color: theme.emblemColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
            }}
          >
            <Icon />
          </div>
          <span
            style={{
              color: "#ffffff",
              fontSize: "1.6rem",
              fontWeight: 800,
            }}
          >
            {theme.label}
          </span>
        </div>
      )}

      {/* Clean YouTube-Style Bottom-Right Duration Timestamp */}
      <span
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          zIndex: 3,
          padding: "3px 8px",
          borderRadius: "6px",
          background: "rgba(15, 23, 42, 0.88)",
          color: "#ffffff",
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.01em",
        }}
      >
        ⏱ {durationText}
      </span>
    </div>
  );
}
