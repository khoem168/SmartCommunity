import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiBell, FiBookOpen, FiBriefcase, FiCalendar, FiCheckCircle, FiCompass, FiRefreshCw } from "react-icons/fi";
import { IoSwapHorizontalOutline } from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { fetchDashboard } from "../../services/platformService";
import { RouteLoader } from "../../components/ui/LoadingStates";
import "./Dashboard.css";

const statusLabel = (t, value) => t(`refresh.${String(value || "").toLowerCase()}`);
const toDate = (value, language) => {
  if (!value) return "";
  const date = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(language === "km" ? "km-KH" : "en", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const Dashboard = () => {
  const { user } = useGlobleContext();
  const { language, t } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await fetchDashboard()); } catch (cause) { setError(cause.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    Promise.resolve().then(load).catch(() => undefined);
  }, [load]);
  const profileProgress = useMemo(() => {
    const skills = user?.skills || {};
    const fields = [user?.fullName, user?.bio, user?.careerGoal, user?.location, user?.avatarUrl, skills.teach?.length, skills.learn?.length];
    return Math.min(100, Math.round((fields.filter(Boolean).length / 7) * 100));
  }, [user]);
  const next = useMemo(() => {
    if (!user?.bio || !user?.careerGoal) return { title: t("refresh.completeProfile"), text: t("refresh.completeProfileText"), to: "/profile", action: t("refresh.editProfile") };
    if (!data?.courses?.length) return { title: t("refresh.libraryTitle"), text: t("refresh.noEnrolled"), to: "/courses", action: t("refresh.allCourses") };
    if (!data?.roadmap) return { title: t("refresh.chooseRoadmap"), text: t("refresh.chooseRoadmapText"), to: "/career", action: t("refresh.openCareer") };
    return { title: t("refresh.continueRoadmap"), text: t("refresh.continueRoadmapText"), to: "/career", action: t("refresh.openCareer") };
  }, [data, t, user]);
  if (loading) return <main className="sc-dashboard"><RouteLoader label={t("refresh.loading")} /></main>;
  if (error) return <main className="sc-dashboard"><section className="sc-dashboard-state"><h1>{t("refresh.loadError")}</h1><p>{error}</p><button type="button" onClick={load}>{t("refresh.retry")}</button></section></main>;
  const widgets = data?.widgets || {};
  const firstName = user?.fullName?.trim().split(/\s+/)[0] || user?.email?.split("@")[0] || "";
  const stats = [[FiBookOpen, widgets.enrolledCourses || 0, t("refresh.enrolledCourses"), "/courses"], [IoSwapHorizontalOutline, widgets.activeExchanges || 0, t("refresh.activeExchanges"), "/skill-requests"], [FiBriefcase, widgets.applications || 0, user?.role === "recruiter" ? t("refresh.candidates") : t("refresh.applications"), "/applications"], [FiBell, widgets.unreadNotifications || 0, t("refresh.unread"), "/notifications"]];
  return <main className="sc-dashboard">
    <section className="sc-dashboard-hero"><div className="container sc-dashboard-hero-inner"><div><p className="sc-dash-kicker">{t("refresh.workspace")}</p><h1>{t("refresh.greeting", { name: firstName })}</h1><p>{t("refresh.dashboardText")}</p><div className="sc-dashboard-actions"><Link to="/courses">{t("refresh.allCourses")} <FiArrowRight /></Link><Link to="/mentorship">{t("refresh.mentorTitle")} <FiArrowRight /></Link>{user?.role === "admin" && <Link to="/admin">{t("refresh.admin")} <FiArrowRight /></Link>}</div></div><aside className="sc-profile-progress"><span>{t("refresh.profile")}</span><strong>{profileProgress}%</strong><div role="progressbar" aria-valuenow={profileProgress} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${profileProgress}%` }} /></div><Link to="/profile">{t("refresh.editProfile")} <FiArrowRight /></Link></aside></div></section>
    <div className="container sc-dashboard-content"><div className="sc-dashboard-top"><p>{t("refresh.workspace")}</p><button type="button" onClick={load}><FiRefreshCw /> {t("refresh.refresh")}</button></div><section className="sc-dashboard-stats">{stats.map(([Icon, value, label, to]) => <Link to={to} key={label}><Icon /><strong>{value}</strong><span>{label}</span><FiArrowRight /></Link>)}</section>
      <section className="sc-next-step"><span><FiCompass /></span><div><p>{t("refresh.nextStep")}</p><h2>{next.title}</h2><small>{next.text}</small></div><Link to={next.to}>{next.action} <FiArrowRight /></Link></section>
      <div className="sc-dashboard-grid"><div className="sc-dashboard-main"><section className="sc-panel"><header><div><p>{t("refresh.myCourses")}</p><h2>{t("refresh.myCourses")}</h2></div><Link to="/courses">{t("refresh.viewAll")} <FiArrowRight /></Link></header>{data?.courses?.length ? <div className="sc-dashboard-list">{data.courses.map((course) => <Link to={`/courses/${course.slug}`} key={course.id} className="sc-course-row"><FiBookOpen /><div><strong>{course.title}</strong><span>{course.category}</span></div><div><b>{course.progress || 0}%</b><i><em style={{ width: `${course.progress || 0}%` }} /></i></div><FiArrowRight /></Link>)}</div> : <div className="sc-panel-empty"><p>{t("refresh.noEnrolled")}</p><Link to="/courses">{t("refresh.allCourses")} <FiArrowRight /></Link></div>}</section>
        <section className="sc-panel"><header><div><p>{t("refresh.roadmap")}</p><h2>{data?.roadmap?.title || t("refresh.noRoadmap")}</h2></div><Link to="/career">{t("refresh.openCareer")} <FiArrowRight /></Link></header>{data?.roadmap ? <div className="sc-roadmap"><div className="sc-roadmap-ring" style={{ "--progress": `${data.roadmap.totalSteps ? (Number(data.roadmap.completedSteps) / Number(data.roadmap.totalSteps)) * 100 : 0}%` }}><span>{data.roadmap.completedSteps}/{data.roadmap.totalSteps}</span></div><p>{t("refresh.stepsComplete", { done: data.roadmap.completedSteps, total: data.roadmap.totalSteps })}</p></div> : <div className="sc-panel-empty"><p>{t("refresh.noRoadmap")}</p><Link to="/career">{t("refresh.openCareer")} <FiArrowRight /></Link></div>}</section>
        <section className="sc-panel"><header><div><p>{t("refresh.latestJobs")}</p><h2>{t("refresh.latestJobs")}</h2></div><Link to="/jobs">{t("refresh.viewAll")} <FiArrowRight /></Link></header>{data?.opportunities?.length ? <div className="sc-dashboard-list">{data.opportunities.map((job) => <Link to="/jobs" key={job.id} className="sc-job-row"><FiBriefcase /><div><strong>{job.title}</strong><span>{job.company || job.location || job.internship_type}</span></div><FiArrowRight /></Link>)}</div> : <div className="sc-panel-empty"><p>{t("refresh.noJobs")}</p></div>}</section></div>
        <aside className="sc-dashboard-side"><section className="sc-panel"><header><div><p>{t("refresh.mySchedule")}</p><h2>{t("refresh.mySchedule")}</h2></div><Link to="/sessions">{t("refresh.viewAll")} <FiArrowRight /></Link></header>{data?.upcomingEvents?.length ? <div className="sc-dashboard-list">{data.upcomingEvents.map((session) => <Link to={`/sessions/${session.id}`} key={session.id} className="sc-session-row"><FiCalendar /><div><strong>{session.title}</strong><span>{toDate(session.scheduled_time, language)} · {session.mentor_name}</span></div><span className={`sc-status ${session.status}`}>{statusLabel(t, session.status)}</span></Link>)}</div> : <div className="sc-panel-empty"><p>{t("refresh.noSessions")}</p><Link to="/sessions">{t("refresh.sessions")} <FiArrowRight /></Link></div>}</section>
          <section className="sc-panel"><header><div><p>{t("refresh.exchangesTitle")}</p><h2>{t("refresh.exchangesTitle")}</h2></div><Link to="/skill-requests">{t("refresh.viewAll")} <FiArrowRight /></Link></header>{data?.exchanges?.length ? <div className="sc-dashboard-list">{data.exchanges.map((exchange) => <Link to={`/community/skill-exchange/${exchange.id}`} key={exchange.id} className="sc-exchange-row"><IoSwapHorizontalOutline /><div><strong>{exchange.skill_requested}</strong><span>{exchange.skill_offered}</span></div><span className={`sc-status ${exchange.status}`}>{statusLabel(t, exchange.status)}</span></Link>)}</div> : <div className="sc-panel-empty"><p>{t("refresh.noExchanges")}</p><Link to="/community">{t("refresh.exchange")} <FiArrowRight /></Link></div>}</section>
          <section className="sc-panel"><header><div><p>{t("refresh.activity")}</p><h2>{t("refresh.activity")}</h2></div><Link to="/notifications">{t("refresh.viewAll")} <FiArrowRight /></Link></header>{data?.notifications?.length ? <div className="sc-dashboard-list">{data.notifications.map((notification) => <Link to={notification.link || "/notifications"} key={notification.id} className={`sc-notification-row ${notification.is_read ? "read" : ""}`}><FiCheckCircle /><div><strong>{notification.title}</strong><span>{notification.message}</span></div></Link>)}</div> : <div className="sc-panel-empty"><p>{t("refresh.noActivity")}</p></div>}</section></aside></div></div>
  </main>;
};
export default Dashboard;
