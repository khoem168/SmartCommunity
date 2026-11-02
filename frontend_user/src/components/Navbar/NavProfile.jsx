import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchSkillExchanges } from "../../services/platformService";
import { getSocket } from "../../services/realtimeService";
import { useLanguage } from "../../context/LanguageContext";
import UserAvatar from "../ui/UserAvatar";

export const NavProfile = ({ user = {}, onLogout }) => {
  const [open, setOpen] = useState(false);
  const [pendingSkillRequests, setPendingSkillRequests] = useState(0);
  const role = user.role || "member";
  const { t, language } = useLanguage();
  const isKm = language === "km";
  const roleLabel = t(`profile.${role}`) || role;

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
    <div className="nav-profile" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="profile-pill"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        title={user.fullName || user.email}
      >
        <UserAvatar user={user} className="profile-avatar" />
        <div className="profile-text">
          <strong title={user.fullName || user.email}>
            {user.fullName || user.email}
          </strong>
          <small>{roleLabel}</small>
        </div>
      </button>

      {open && (
        <div className="profile-menu" role="menu">
          {/* Full Name & Role Header Card */}
          <div className="profile-menu-header">
            <UserAvatar user={user} className="profile-menu-header-avatar" />
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

          <Link
            to="/dashboard"
            className="profile-menu-item profile-menu-item-highlight"
            onClick={() => setOpen(false)}
          >
            {isKm ? "ផ្ទាំងការងារ (Workspace)" : "Workspace"}
          </Link>
          <Link
            to="/profile"
            className="profile-menu-item"
            onClick={() => setOpen(false)}
          >
            {t("profile.profile")}
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
            <Link
              to="/mentorship"
              className="profile-menu-item"
              onClick={() => setOpen(false)}
            >
              {t("profile.myMentorships")}
            </Link>
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
