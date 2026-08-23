import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchSkillExchanges } from "../../services/platformService";
import { getSocket } from "../../services/realtimeService";
import { useLanguage } from "../../context/LanguageContext";

const getInitials = (name) => {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
};

export const NavProfile = ({ user = {}, onLogout }) => {
  const [open, setOpen] = useState(false);
  const [pendingSkillRequests, setPendingSkillRequests] = useState(0);
  const initials = getInitials(user.fullName || user.email || "User");
  const role = user.role || "member";
  const { t } = useLanguage();
  const roleLabel = t(`profile.${role}`);

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
      >
        {user.avatarUrl ? (
          <img className="profile-avatar image" src={user.avatarUrl} alt="" />
        ) : (
          <span className="profile-avatar">{initials}</span>
        )}
        <div className="profile-text">
          <strong>{user.fullName || user.email}</strong>
          <small>{roleLabel}</small>
        </div>
      </button>

      {open && (
        <div className="profile-menu" role="menu">
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
                to="/courses"
                className="profile-menu-item"
                onClick={() => setOpen(false)}
              >
                {t("profile.myCourses")}
              </Link>

              <Link
                to="/applications"
                className="profile-menu-item"
                onClick={() => setOpen(false)}
              >
                {t("profile.myApplications")}
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
