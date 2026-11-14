import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiChevronDown } from "react-icons/fi";
import { fetchSkillExchanges } from "../../services/platformService";
import { getSocket } from "../../services/realtimeService";
import { useLanguage } from "../../context/LanguageContext";
import UserAvatar from "../ui/UserAvatar";

export const NavProfile = ({ user = {}, onLogout }) => {
  const [open, setOpen] = useState(false);
  const [pendingSkillRequests, setPendingSkillRequests] = useState(0);
  const containerRef = useRef(null);
  const role = user.role || "member";
  const { t, language } = useLanguage();
  const isKm = language === "km";
  const roleLabel = t(`profile.${role}`) || role;
  const compactRoleLabel =
    role === "student"
      ? isKm
        ? "សិស្ស"
        : "Student"
      : role === "mentor"
        ? isKm
          ? "អ្នកណែនាំ"
          : "Mentor"
        : role === "recruiter"
          ? isKm
            ? "ក្រុមហ៊ុន"
            : "Recruiter"
          : role === "admin"
            ? "Admin"
            : roleLabel;

  // Click outside and Escape key handler
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const refreshPendingSkillRequests = useCallback(async () => {
    if (!user?.id) {
      setPendingSkillRequests(0);
      return;
    }

    try {
      const requests = await fetchSkillExchanges();
      const pendingIncoming = requests.filter(
        (request) =>
          request.providerId === user.id && request.status === "pending",
      );
      setPendingSkillRequests(pendingIncoming.length);
    } catch {
      setPendingSkillRequests(0);
    }
  }, [user]);

  useEffect(() => {
    Promise.resolve()
      .then(refreshPendingSkillRequests)
      .catch(() => undefined);
  }, [refreshPendingSkillRequests]);

  useEffect(() => {
    if (!open) return;
    Promise.resolve()
      .then(refreshPendingSkillRequests)
      .catch(() => undefined);
  }, [open, refreshPendingSkillRequests]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    const handleNotification = (notification) => {
      if (notification?.type === "skill_exchange") {
        refreshPendingSkillRequests();
      }
    };

    socket.on("notification:new", handleNotification);

    return () => {
      socket.off("notification:new", handleNotification);
    };
  }, [refreshPendingSkillRequests, user]);

  const handleLogout = () => {
    setOpen(false);
    if (onLogout) onLogout();
  };

  return (
    <div className="nav-profile" ref={containerRef}>
      <button
        type="button"
        className={`profile-pill ${open ? "is-open" : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        title={user.fullName || user.email}
      >
        <UserAvatar user={user} size={28} className="profile-avatar" />
        <div className="profile-text">
          <strong title={user.fullName || user.email}>
            {user.fullName || user.email}
          </strong>
          <span className={`profile-inline-role role-${role}`}>
            {compactRoleLabel}
          </span>
        </div>
        <FiChevronDown className={`profile-pill-chevron ${open ? "rotated" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="profile-menu" role="menu">
          {/* Full Name & Role Header Card */}
          <div className="profile-menu-header">
            <UserAvatar user={user} size={38} className="profile-menu-header-avatar" />
            <div className="profile-menu-header-info">
              <strong className="profile-menu-header-name" title={user.fullName || user.email}>
                {user.fullName || user.email}
              </strong>
              <div className="profile-menu-header-meta">
                <span className="profile-role-badge">{roleLabel}</span>
                {user.email && (
                  <span className="profile-email-sub">{user.email}</span>
                )}
              </div>
            </div>
          </div>
          <div className="profile-menu-divider" />

          {/* 1-Click Role-Aware Workspace Jump */}
          <Link
            to={role === "admin" ? "/admin" : "/dashboard"}
            className="profile-menu-item profile-menu-item-highlight"
            onClick={() => setOpen(false)}
          >
            {isKm
              ? role === "admin"
                ? "ផ្ទាំងបញ្ជា Admin (Workspace)"
                : "ផ្ទាំងការងារ (Workspace)"
              : role === "admin"
                ? "Admin Workspace"
                : "My Workspace"}
          </Link>
          <Link
            to="/profile"
            className="profile-menu-item"
            onClick={() => setOpen(false)}
          >
            {t("profile.profile")}
          </Link>
          <Link
            to="/cv-studio"
            className="profile-menu-item"
            onClick={() => setOpen(false)}
            style={{ fontWeight: 700, color: "#2563eb" }}
          >
            <span>{isKm ? "📄 បង្កើត CV ឥតគិតថ្លៃ (Free PDF)" : "📄 Free CV & PDF Builder"}</span>
          </Link>
          <Link
            to="/settings"
            className="profile-menu-item"
            onClick={() => setOpen(false)}
          >
            {t("profile.settings")}
          </Link>
          <Link
            to="/skill-requests"
            className="profile-menu-item"
            onClick={() => setOpen(false)}
          >
            <span>{t("profile.skillRequests")}</span>
            {pendingSkillRequests > 0 && (
              <span className="profile-menu-badge">{pendingSkillRequests}</span>
            )}
          </Link>

          {role === "recruiter" && (
            <>
              <Link
                to="/recruiter/candidates"
                className="profile-menu-item"
                onClick={() => setOpen(false)}
              >
                {isKm ? "បេក្ខជន (Candidate ATS)" : "Candidate ATS"}
              </Link>
              <Link
                to="/post-job"
                className="profile-menu-item"
                onClick={() => setOpen(false)}
              >
                {t("profile.postJob")}
              </Link>
              <Link
                to="/my-posts"
                className="profile-menu-item"
                onClick={() => setOpen(false)}
              >
                {t("profile.internshipDashboard")}
              </Link>
            </>
          )}

          {role === "mentor" && (
            <>
              <Link
                to="/sessions"
                className="profile-menu-item"
                onClick={() => setOpen(false)}
              >
                {isKm ? "ថ្នាក់បង្រៀន Live (Sessions)" : "Live Sessions"}
              </Link>
              <Link
                to="/mentorship"
                className="profile-menu-item"
                onClick={() => setOpen(false)}
              >
                {t("profile.myMentorships")}
              </Link>
            </>
          )}

          {role === "admin" && (
            <>
              <Link
                to="/admin"
                className="profile-menu-item"
                onClick={() => setOpen(false)}
              >
                {t("profile.adminPanel")}
              </Link>
              <Link
                to="/analytics"
                className="profile-menu-item"
                onClick={() => setOpen(false)}
              >
                {t("profile.analyticsDashboard")}
              </Link>
            </>
          )}

          {role === "student" && (
            <>
              <Link
                className="profile-menu-item"
                to="/jobs"
                onClick={() => setOpen(false)}
              >
                {t("profile.exploreInternships")}
              </Link>
              <Link
                to="/my-applications"
                className="profile-menu-item"
                onClick={() => setOpen(false)}
              >
                {t("profile.myApplications")}
              </Link>
              <Link
                to="/courses"
                className="profile-menu-item"
                onClick={() => setOpen(false)}
              >
                {t("profile.myCourses")}
              </Link>
            </>
          )}

          <Link
            to="/forum"
            className="profile-menu-item"
            onClick={() => setOpen(false)}
          >
            {t("profile.communityForum")}
          </Link>

          <button
            className="profile-menu-item"
            type="button"
            onClick={handleLogout}
          >
            {t("profile.logout")}
          </button>
        </div>
      )}
    </div>
  );
};
