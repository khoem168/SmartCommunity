import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiBell,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCompass,
  FiFileText,
  FiPlus,
  FiRefreshCw,
  FiShield,
  FiUsers,
  FiVideo,
  FiAlertTriangle,
  FiGlobe,
  FiMail,
} from "react-icons/fi";
import { IoSwapHorizontalOutline } from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { fetchDashboard } from "../../services/platformService";
import { RouteLoader } from "../../components/ui/LoadingStates";
import "./Dashboard.css";

const statusLabel = (t, value) => {
  const v = String(value || "").toLowerCase();
  const direct = t(`refresh.${v}`);
  if (direct && direct !== `refresh.${v}`) return direct;
  return v.charAt(0).toUpperCase() + v.slice(1);
};

const toDate = (value, language) => {
  if (!value) return "";
  const date = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(language === "km" ? "km-KH" : "en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
};

export default function Dashboard() {
  const { user } = useGlobleContext();
  const { language, t } = useLanguage();
  const isKm = language === "km";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await fetchDashboard());
    } catch (cause) {
      setError(cause.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(load).catch(() => undefined);
  }, [load]);

  const profileProgress = useMemo(() => {
    const skills = user?.skills || {};
    const fields = [
      user?.fullName,
      user?.bio,
      user?.careerGoal,
      user?.location,
      user?.avatarUrl,
      skills.teach?.length,
      skills.learn?.length,
    ];
    return Math.min(100, Math.round((fields.filter(Boolean).length / 7) * 100));
  }, [user]);

  const next = useMemo(() => {
    if (!user?.bio || !user?.careerGoal)
      return {
        title: t("refresh.completeProfile"),
        text: t("refresh.completeProfileText"),
        to: "/profile",
        action: t("refresh.editProfile"),
      };
    if (!data?.courses?.length)
      return {
        title: t("refresh.libraryTitle"),
        text: t("refresh.noEnrolled"),
        to: "/courses",
        action: t("refresh.allCourses"),
      };
    if (!data?.roadmap)
      return {
        title: t("refresh.chooseRoadmap"),
        text: t("refresh.chooseRoadmapText"),
        to: "/career",
        action: t("refresh.openCareer"),
      };
    return {
      title: t("refresh.continueRoadmap"),
      text: t("refresh.continueRoadmapText"),
      to: "/career",
      action: t("refresh.openCareer"),
    };
  }, [data, t, user]);

  if (loading) {
    return (
      <main className="sc-dashboard">
        <RouteLoader label={t("refresh.loading")} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="sc-dashboard">
        <section className="sc-dashboard-state">
          <h1>{t("refresh.loadError")}</h1>
          <p>{error}</p>
          <button type="button" onClick={load}>
            {t("refresh.retry")}
          </button>
        </section>
      </main>
    );
  }

  const effectiveRole = data?.role || user?.role || "student";
  const widgets = data?.widgets || {};
  const firstName =
    user?.fullName?.trim().split(/\s+/)[0] || user?.email?.split("@")[0] || "";

  // =========================================================================
  // 1. RECRUITER WORKSPACE
  // =========================================================================
  if (effectiveRole === "recruiter") {
    const company = data?.company || null;
    const isCompanyVerified = company?.isVerified;
    const pipeline = data?.pipeline || {};
    const recruiterStats = [
      [FiBriefcase, widgets.activeInternships || 0, isKm ? "ការងារកំពុងបើក" : "Active Postings", "/my-posts"],
      [FiUsers, widgets.totalApplicants || 0, isKm ? "បេក្ខជនសរុប" : "Total Applicants", "/recruiter/candidates"],
      [FiCheckCircle, widgets.shortlistedApplicants || 0, isKm ? "ជាប់ជម្រើស" : "Shortlisted Talent", "/recruiter/candidates"],
      [FiBell, widgets.unreadNotifications || 0, t("refresh.unread"), "/notifications"],
    ];

    return (
      <main className="sc-dashboard">
        <section className="sc-dashboard-hero">
          <div className="container sc-dashboard-hero-inner">
            <div>
              <p className="sc-dash-kicker">
                {isKm ? "ផ្ទាំងការងារអ្នកជ្រើសរើស" : "Recruiter Workspace"}
              </p>
              <h1>{t("refresh.greeting", { name: firstName })}</h1>
              <p>
                {isKm
                  ? "គ្រប់គ្រងការប្រកាសការងារ ពិនិត្យបេក្ខជននិស្សិត និងតាមដានដំណើរការជ្រើសរើសរបស់អ្នកនៅទីនេះ។"
                  : "Manage your internship opportunities, review candidate applications, and monitor your talent pipeline in real time."}
              </p>
              <div className="sc-dashboard-actions">
                <Link to="/post-job">
                  <FiPlus /> {isKm ? "ប្រកាសកម្មសិក្សាថ្មី" : "Post Internship"} <FiArrowRight />
                </Link>
                <Link to="/my-posts">
                  <FiBriefcase /> {isKm ? "ការងាររបស់ខ្ញុំ" : "My Postings"} <FiArrowRight />
                </Link>
                <Link to="/recruiter/candidates">
                  <FiUsers /> {isKm ? "បេក្ខជនទាំងអស់" : "Candidate ATS"} <FiArrowRight />
                </Link>
              </div>
            </div>

            <aside className="sc-profile-progress">
              <span>{isKm ? "កម្រងព័ត៌មានក្រុមហ៊ុន" : "Company Profile"}</span>
              <strong>{company?.name || user?.recruiterCompany || "Company"}</strong>
              <p style={{ margin: "4px 0 16px", color: "var(--soft)", fontSize: "0.88rem" }}>
                {company?.industry || "Tech & Innovation"} · {company?.location || "Phnom Penh"}
              </p>
              <Link to="/profile">
                {t("refresh.editProfile")} <FiArrowRight />
              </Link>
            </aside>
          </div>
        </section>

        <div className="container sc-dashboard-content">
          {/* Company Verification Banner */}
          {company && !isCompanyVerified ? (
            <div className="sc-banner-glass pending">
              <div className="sc-banner-icon-wrap">
                <FiAlertTriangle />
              </div>
              <div className="sc-banner-content">
                <h4>
                  {isKm
                    ? "គណនីក្រុមហ៊ុនកំពុងរង់ចាំការផ្ទៀងផ្ទាត់ (Pending Verification)"
                    : "Company Profile Pending Verification"}
                </h4>
                <p>
                  {isKm
                    ? "គណនីក្រុមហ៊ុនរបស់អ្នកកំពុងស្ថិតក្នុងការពិនិត្យដោយ Admin។ ក្រោយពេលផ្ទៀងផ្ទាត់រួចរាល់ អ្នកអាចប្រកាសឱកាសការងារ/កម្មសិក្សាជាសាធារណៈបាន។"
                    : "Your company profile is currently being reviewed by administrators. Once approved, your job postings will be published publicly."}
                </p>
              </div>
              <span className="sc-banner-badge">
                <FiClock /> {isKm ? "រង់ចាំការអនុម័ត" : "Pending Review"}
              </span>
            </div>
          ) : company?.isVerified ? (
            <div className="sc-banner-glass verified">
              <div className="sc-banner-icon-wrap">
                <FiCheckCircle />
              </div>
              <div className="sc-banner-content">
                <h4>
                  {isKm
                    ? "ក្រុមហ៊ុនបានផ្ទៀងផ្ទាត់រួចរាល់ (Verified Employer)"
                    : "Verified Company Profile"}
                </h4>
                <p>
                  {isKm
                    ? "គណនីក្រុមហ៊ុនរបស់អ្នកមានសិទ្ធិពេញលេញក្នុងការប្រកាសការងារ និងជ្រើសរើសបុគ្គលិក។"
                    : "Your company has verified authority to post internships and recruit top talent."}
                </p>
              </div>
              <span className="sc-banner-badge">
                <FiCheckCircle /> {isKm ? "ផ្ទៀងផ្ទាត់ហើយ" : "Verified"}
              </span>
            </div>
          ) : null}

          {/* Top Actions & Stats */}
          <div className="sc-dashboard-top">
            <p>{isKm ? "ស្ថិតិជ្រើសរើសបុគ្គលិក" : "Recruitment Overview"}</p>
            <button type="button" onClick={load}>
              <FiRefreshCw /> {t("refresh.refresh")}
            </button>
          </div>

          <section className="sc-dashboard-stats">
            {recruiterStats.map(([Icon, value, label, to]) => (
              <Link to={to} key={label}>
                <Icon />
                <strong>{value}</strong>
                <span>{label}</span>
                <FiArrowRight />
              </Link>
            ))}
          </section>

          {/* Hiring Pipeline Bar */}
          <section className="sc-pipeline-box">
            <div className="sc-pipeline-header">
              <h3>{isKm ? "ដំណើរការជ្រើសរើសបេក្ខជន (Hiring Pipeline)" : "Hiring Pipeline Overview"}</h3>
              <span>{widgets.totalApplicants || 0} {isKm ? "បេក្ខជនសរុប" : "Total Applicants"}</span>
            </div>
            <div className="sc-pipeline-grid">
              <div className="sc-pipeline-step step-pending">
                <strong>{pipeline.pending || 0}</strong>
                <span>{isKm ? "រង់ចាំពិនិត្យ" : "Pending"}</span>
              </div>
              <div className="sc-pipeline-step step-reviewed">
                <strong>{pipeline.reviewed || 0}</strong>
                <span>{isKm ? "បានពិនិត្យ" : "Reviewed"}</span>
              </div>
              <div className="sc-pipeline-step step-shortlisted">
                <strong>{pipeline.shortlisted || 0}</strong>
                <span>{isKm ? "ជាប់ជម្រើស" : "Shortlisted"}</span>
              </div>
              <div className="sc-pipeline-step step-approved">
                <strong>{pipeline.approved || 0}</strong>
                <span>{isKm ? "បានយល់ព្រម" : "Approved"}</span>
              </div>
              <div className="sc-pipeline-step step-rejected">
                <strong>{pipeline.rejected || 0}</strong>
                <span>{isKm ? "បដិសេធ" : "Declined"}</span>
              </div>
            </div>
          </section>

          {/* Main 2-column layout */}
          <div className="sc-dashboard-grid">
            <div className="sc-dashboard-main">
              {/* Recent Applicants */}
              <section className="sc-panel">
                <header>
                  <div>
                    <p>{isKm ? "បេក្ខជនថ្មីៗ" : "Recent Candidates"}</p>
                    <h2>{isKm ? "បេក្ខជនដាក់ពាក្យថ្មីៗ" : "Latest Applications"}</h2>
                  </div>
                  <Link to="/recruiter/candidates">
                    {t("refresh.viewAll")} <FiArrowRight />
                  </Link>
                </header>
                {data?.recentApplicants?.length ? (
                  <div className="sc-dashboard-list">
                    {data.recentApplicants.map((app) => (
                      <div key={app.id} className="sc-applicant-row">
                        <img
                          src={
                            app.student_avatar ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                          }
                          alt={app.student_name}
                          className="sc-applicant-avatar"
                        />
                        <div className="sc-applicant-info">
                          <strong>{app.student_name}</strong>
                          <span>
                            {app.internship_title} · {toDate(app.applied_at, language)}
                          </span>
                        </div>
                        <span className={`sc-status ${app.status}`}>
                          {statusLabel(t, app.status)}
                        </span>
                        <div className="sc-applicant-actions">
                          {app.resume_url && (
                            <a
                              href={app.resume_url}
                              target="_blank"
                              rel="noreferrer"
                              className="sc-resume-btn"
                              title="Download CV"
                            >
                              <FiFileText /> CV
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="sc-panel-empty">
                    <p>{isKm ? "មិនទាន់មានបេក្ខជនដាក់ពាក្យនៅឡើយទេ។" : "No candidates have applied yet."}</p>
                    <Link to="/post-job">
                      <FiPlus /> {isKm ? "ប្រកាសការងារថ្មី" : "Post an Internship"} <FiArrowRight />
                    </Link>
                  </div>
                )}
              </section>

              {/* My Internship Postings */}
              <section className="sc-panel">
                <header>
                  <div>
                    <p>{isKm ? "ការងារដែលបានបង្ហោះ" : "Active Postings"}</p>
                    <h2>{isKm ? "ឱកាសកម្មសិក្សារបស់អ្នក" : "My Internships"}</h2>
                  </div>
                  <Link to="/my-posts">
                    {t("refresh.viewAll")} <FiArrowRight />
                  </Link>
                </header>
                {data?.myInternships?.length ? (
                  <div className="sc-dashboard-list">
                    {data.myInternships.map((job) => (
                      <Link to="/my-posts" key={job.id} className="sc-job-row">
                        <FiBriefcase />
                        <div>
                          <strong>{job.title}</strong>
                          <span>
                            {job.category} · {job.applicants_count || 0}{" "}
                            {isKm ? "បេក្ខជន" : "candidates"} · {job.openings || 1}{" "}
                            {isKm ? "កន្លែង" : "openings"}
                          </span>
                        </div>
                        <span className={`sc-status ${job.status}`}>
                          {statusLabel(t, job.status)}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="sc-panel-empty">
                    <p>
                      {isKm
                        ? "អ្នកមិនទាន់បានប្រកាសការងារនៅឡើយទេ។"
                        : "You have not posted any internships yet."}
                    </p>
                    <Link to="/post-job">
                      <FiPlus /> {isKm ? "ប្រកាសកម្មសិក្សាដំបូង" : "Post your first internship"}{" "}
                      <FiArrowRight />
                    </Link>
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar */}
            <aside className="sc-dashboard-side">
              {/* Company Details */}
              <section className="sc-panel">
                <header>
                  <div>
                    <p>{isKm ? "ព័ត៌មានក្រុមហ៊ុន" : "Company Profile"}</p>
                    <h2>{company?.name || "Company"}</h2>
                  </div>
                  <Link to="/profile">
                    {t("refresh.editProfile")} <FiArrowRight />
                  </Link>
                </header>
                <div className="sc-company-info-card">
                  {company?.description && (
                    <p style={{ margin: "0 0 14px", fontSize: "0.9rem", color: "var(--soft)" }}>
                      {company.description}
                    </p>
                  )}
                  {company?.contactEmail && (
                    <div className="sc-company-meta-item">
                      <FiMail /> <span>{company.contactEmail}</span>
                    </div>
                  )}
                  {company?.website && (
                    <div className="sc-company-meta-item">
                      <FiGlobe />{" "}
                      <a
                        href={
                          company.website.startsWith("http")
                            ? company.website
                            : `https://${company.website}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#2563eb", textDecoration: "none" }}
                      >
                        {company.website}
                      </a>
                    </div>
                  )}
                </div>
              </section>

              {/* Notifications */}
              <section className="sc-panel">
                <header>
                  <div>
                    <p>{t("refresh.activity")}</p>
                    <h2>{t("refresh.activity")}</h2>
                  </div>
                  <Link to="/notifications">
                    {t("refresh.viewAll")} <FiArrowRight />
                  </Link>
                </header>
                {data?.notifications?.length ? (
                  <div className="sc-dashboard-list">
                    {data.notifications.map((notification) => (
                      <Link
                        to={notification.link || "/notifications"}
                        key={notification.id}
                        className={`sc-notification-row ${notification.is_read ? "read" : ""}`}
                      >
                        <FiCheckCircle />
                        <div>
                          <strong>{notification.title}</strong>
                          <span>{notification.message}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="sc-panel-empty">
                    <p>{t("refresh.noActivity")}</p>
                  </div>
                )}
              </section>
            </aside>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================================
  // 2. MENTOR WORKSPACE
  // =========================================================================
  if (effectiveRole === "mentor") {
    const mentorApp = data?.mentorApplication || {};
    const isMentorPending = mentorApp.status === "pending";
    const mentorStats = [
      [FiCalendar, widgets.pendingBookings || 0, isKm ? "ការកក់ម៉ោងរង់ចាំ" : "Pending Bookings", "/mentorship"],
      [FiUsers, widgets.activeMentees || 0, isKm ? "សិស្សកំពុងណែនាំ" : "Active Mentees", "/mentorship"],
      [FiCheckCircle, widgets.completedSessions || 0, isKm ? "វគ្គបានបញ្ចប់" : "Completed Sessions", "/mentorship"],
      [FiVideo, widgets.hostedSessions || 0, isKm ? "ថ្នាក់បង្រៀន Live" : "Live Classes", "/sessions"],
    ];

    return (
      <main className="sc-dashboard">
        <section className="sc-dashboard-hero">
          <div className="container sc-dashboard-hero-inner">
            <div>
              <p className="sc-dash-kicker">
                {isKm ? "ផ្ទាំងការងារអ្នកណែនាំ" : "Mentor Workspace"}
              </p>
              <h1>{t("refresh.greeting", { name: firstName })}</h1>
              <p>
                {isKm
                  ? "គ្រប់គ្រងការណែនាំ 1:1, ទទួលការកក់ម៉ោងពីសិស្ស និងរៀបចំថ្នាក់បង្រៀន Live សម្រាប់សហគមន៍។"
                  : "Manage 1:1 mentorship bookings, connect with aspiring students, and schedule live interactive learning sessions."}
              </p>
              <div className="sc-dashboard-actions">
                <Link to="/mentorship">
                  <FiCalendar /> {isKm ? "ការណែនាំ 1:1" : "1:1 Bookings"} <FiArrowRight />
                </Link>
                <Link to="/sessions">
                  <FiVideo /> {isKm ? "ថ្នាក់រៀនផ្ទាល់ (Live)" : "Live Sessions"} <FiArrowRight />
                </Link>
                <Link to="/profile">
                  {t("refresh.editProfile")} <FiArrowRight />
                </Link>
              </div>
            </div>

            <aside className="sc-profile-progress">
              <span>{isKm ? "តួនាទីអ្នកណែនាំ" : "Mentor Specialization"}</span>
              <strong>{mentorApp.professional_title || "Mentor"}</strong>
              <p style={{ margin: "4px 0 16px", color: "var(--soft)", fontSize: "0.88rem" }}>
                {mentorApp.availability || "Flexible schedule"}
              </p>
              <Link to="/profile">
                {t("refresh.editProfile")} <FiArrowRight />
              </Link>
            </aside>
          </div>
        </section>

        <div className="container sc-dashboard-content">
          {/* Mentor Verification Banner */}
          {isMentorPending && (
            <div className="sc-banner-glass pending">
              <div className="sc-banner-icon-wrap">
                <FiClock />
              </div>
              <div className="sc-banner-content">
                <h4>
                  {isKm
                    ? "ពាក្យស្នើសុំជាអ្នកណែនាំកំពុងរង់ចាំការពិនិត្យ (Mentor Application Pending Review)"
                    : "Mentor Application Under Review"}
                </h4>
                <p>
                  {isKm
                    ? "ក្រុមការងារ Admin កំពុងពិនិត្យលើបទពិសោធន៍ និងជំនាញរបស់អ្នក។ អ្នកនឹងទទួលបានការជូនដំណឹងនៅពេលត្រូវបានអនុម័ត។"
                    : "Our admin team is reviewing your mentorship application. You will be notified once your profile is fully approved to accept public bookings."}
                </p>
              </div>
              <span className="sc-banner-badge">
                <FiClock /> {isKm ? "រង់ចាំអនុម័ត" : "Pending Review"}
              </span>
            </div>
          )}

          {/* Top Actions & Stats */}
          <div className="sc-dashboard-top">
            <p>{isKm ? "ទិដ្ឋភាពទូទៅនៃអ្នកណែនាំ" : "Mentorship Overview"}</p>
            <button type="button" onClick={load}>
              <FiRefreshCw /> {t("refresh.refresh")}
            </button>
          </div>

          <section className="sc-dashboard-stats">
            {mentorStats.map(([Icon, value, label, to]) => (
              <Link to={to} key={label}>
                <Icon />
                <strong>{value}</strong>
                <span>{label}</span>
                <FiArrowRight />
              </Link>
            ))}
          </section>

          {/* Main 2-column layout */}
          <div className="sc-dashboard-grid">
            <div className="sc-dashboard-main">
              {/* Mentorship Booking Requests */}
              <section className="sc-panel">
                <header>
                  <div>
                    <p>{isKm ? "ការស្នើសុំ 1:1 ថ្មីៗ" : "Mentorship Requests"}</p>
                    <h2>{isKm ? "ការកក់ម៉ោងពីសិស្ស" : "1:1 Student Bookings"}</h2>
                  </div>
                  <Link to="/mentorship">
                    {t("refresh.viewAll")} <FiArrowRight />
                  </Link>
                </header>
                {data?.bookings?.length ? (
                  <div className="sc-dashboard-list">
                    {data.bookings.map((booking) => (
                      <div key={booking.id} className="sc-booking-row">
                        <img
                          src={
                            booking.student_avatar ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                          }
                          alt={booking.student_name}
                          className="sc-applicant-avatar"
                        />
                        <div className="sc-applicant-info">
                          <strong>{booking.student_name}</strong>
                          <span>
                            {booking.topic} · {toDate(booking.requested_time, language)}
                          </span>
                        </div>
                        <span className={`sc-status ${booking.status}`}>
                          {statusLabel(t, booking.status)}
                        </span>
                        <div className="sc-applicant-actions">
                          {booking.meeting_link && booking.status === "active" && (
                            <a
                              href={booking.meeting_link}
                              target="_blank"
                              rel="noreferrer"
                              className="sc-video-join-btn"
                              title="Join Video Meeting"
                            >
                              <FiVideo /> {isKm ? "ចូលជួប" : "Join"}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="sc-panel-empty">
                    <p>
                      {isKm
                        ? "មិនទាន់មានសិស្សកក់ម៉ោងណែនាំនៅឡើយទេ។"
                        : "No 1:1 mentorship bookings yet."}
                    </p>
                    <Link to="/mentorship">
                      {isKm ? "មើលផ្ទាំងណែនាំ" : "Go to Mentorship"} <FiArrowRight />
                    </Link>
                  </div>
                )}
              </section>

              {/* Upcoming Live Sessions */}
              <section className="sc-panel">
                <header>
                  <div>
                    <p>{isKm ? "ថ្នាក់រៀនផ្ទាល់" : "Live Sessions"}</p>
                    <h2>{isKm ? "ថ្នាក់ដែលអ្នករៀបចំ" : "Hosted Learning Sessions"}</h2>
                  </div>
                  <Link to="/sessions">
                    {t("refresh.viewAll")} <FiArrowRight />
                  </Link>
                </header>
                {data?.upcomingEvents?.length ? (
                  <div className="sc-dashboard-list">
                    {data.upcomingEvents.map((session) => (
                      <Link
                        to={`/sessions/${session.id}`}
                        key={session.id}
                        className="sc-session-row"
                      >
                        <FiCalendar />
                        <div>
                          <strong>{session.title}</strong>
                          <span>{toDate(session.scheduled_time, language)}</span>
                        </div>
                        <span className={`sc-status ${session.status}`}>
                          {statusLabel(t, session.status)}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="sc-panel-empty">
                    <p>
                      {isKm
                        ? "មិនមានថ្នាក់បង្រៀន Live នាពេលខាងមុខទេ។"
                        : "No scheduled live sessions right now."}
                    </p>
                    <Link to="/sessions">
                      <FiPlus /> {isKm ? "បង្កើតថ្នាក់បង្រៀន Live" : "Schedule a Live Session"}{" "}
                      <FiArrowRight />
                    </Link>
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar */}
            <aside className="sc-dashboard-side">
              {/* Mentor Profile Snapshot */}
              <section className="sc-panel">
                <header>
                  <div>
                    <p>{isKm ? "ប្រវត្តិរូបអ្នកណែនាំ" : "Mentor Bio"}</p>
                    <h2>{user?.fullName}</h2>
                  </div>
                  <Link to="/profile">
                    {t("refresh.editProfile")} <FiArrowRight />
                  </Link>
                </header>
                <div className="sc-company-info-card">
                  <p style={{ margin: "0 0 14px", fontSize: "0.9rem", color: "var(--soft)" }}>
                    {user?.bio || (isKm ? "មិនទាន់មានព័ត៌មានសង្ខេប" : "No bio provided yet.")}
                  </p>
                  <div className="sc-company-meta-item">
                    <FiCalendar /> <span>{mentorApp.availability || "Flexible"}</span>
                  </div>
                </div>
              </section>

              {/* Notifications */}
              <section className="sc-panel">
                <header>
                  <div>
                    <p>{t("refresh.activity")}</p>
                    <h2>{t("refresh.activity")}</h2>
                  </div>
                  <Link to="/notifications">
                    {t("refresh.viewAll")} <FiArrowRight />
                  </Link>
                </header>
                {data?.notifications?.length ? (
                  <div className="sc-dashboard-list">
                    {data.notifications.map((notification) => (
                      <Link
                        to={notification.link || "/notifications"}
                        key={notification.id}
                        className={`sc-notification-row ${notification.is_read ? "read" : ""}`}
                      >
                        <FiCheckCircle />
                        <div>
                          <strong>{notification.title}</strong>
                          <span>{notification.message}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="sc-panel-empty">
                    <p>{t("refresh.noActivity")}</p>
                  </div>
                )}
              </section>
            </aside>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================================
  // 3. ADMIN WORKSPACE
  // =========================================================================
  if (effectiveRole === "admin") {
    const adminStats = [
      [FiUsers, widgets.users || 0, isKm ? "អ្នកប្រើប្រាស់សរុប" : "Total Users", "/admin"],
      [FiShield, widgets.pendingMentors || 0, isKm ? "អ្នកណែនាំរង់ចាំអនុម័ត" : "Pending Mentors", "/admin"],
      [FiBriefcase, widgets.pendingCompanies || 0, isKm ? "ក្រុមហ៊ុនរង់ចាំផ្ទៀងផ្ទាត់" : "Pending Companies", "/admin"],
      [FiCompass, widgets.openInternships || 0, isKm ? "កម្មសិក្សាកំពុងបើក" : "Open Internships", "/admin"],
    ];

    return (
      <main className="sc-dashboard">
        <section className="sc-dashboard-hero">
          <div className="container sc-dashboard-hero-inner">
            <div>
              <p className="sc-dash-kicker">
                {isKm ? "ផ្ទាំងគ្រប់គ្រងប្រព័ន្ធ" : "Admin Governance"}
              </p>
              <h1>{t("refresh.greeting", { name: firstName })}</h1>
              <p>
                {isKm
                  ? "ពិនិត្យការអនុម័តអ្នកណែនាំ ផ្ទៀងផ្ទាត់ក្រុមហ៊ុន គ្រប់គ្រងវគ្គសិក្សា និងតាមដានសុវត្ថិភាពប្រព័ន្ធ។"
                  : "Review mentor applications, verify employer credentials, oversee courses, and audit system security."}
              </p>
              <div className="sc-dashboard-actions">
                <Link to="/admin">
                  <FiShield /> {isKm ? "ផ្ទាំងគ្រប់គ្រង (Admin Panel)" : "Admin Panel"} <FiArrowRight />
                </Link>
                <Link to="/analytics">
                  <FiCompass /> {isKm ? "ស្ថិតិទូទៅ (Analytics)" : "Analytics"} <FiArrowRight />
                </Link>
              </div>
            </div>

            <aside className="sc-profile-progress">
              <span>{isKm ? "តួនាទីសុវត្ថិភាព" : "Security Level"}</span>
              <strong>SuperAdmin</strong>
              <p style={{ margin: "4px 0 16px", color: "var(--soft)", fontSize: "0.88rem" }}>
                Full system authorization
              </p>
              <Link to="/admin">
                {isKm ? "ចូលទៅផ្ទាំង Admin" : "Open Admin Panel"} <FiArrowRight />
              </Link>
            </aside>
          </div>
        </section>

        <div className="container sc-dashboard-content">
          <div className="sc-dashboard-top">
            <p>{isKm ? "ស្ថិតិប្រព័ន្ធទាំងមូល" : "Platform Overview"}</p>
            <button type="button" onClick={load}>
              <FiRefreshCw /> {t("refresh.refresh")}
            </button>
          </div>

          <section className="sc-dashboard-stats">
            {adminStats.map(([Icon, value, label, to]) => (
              <Link to={to} key={label}>
                <Icon />
                <strong>{value}</strong>
                <span>{label}</span>
                <FiArrowRight />
              </Link>
            ))}
          </section>

          <div className="sc-dashboard-grid">
            <div className="sc-dashboard-main">
              {/* Pending Approvals */}
              <section className="sc-panel">
                <header>
                  <div>
                    <p>{isKm ? "ការពិនិត្យ & អនុម័ត" : "Governance Queue"}</p>
                    <h2>{isKm ? "សំណើរង់ចាំការសម្រេចចិត្ត" : "Pending Actions"}</h2>
                  </div>
                  <Link to="/admin">
                    {t("refresh.manage")} <FiArrowRight />
                  </Link>
                </header>
                <div className="sc-dashboard-list">
                  <div className="sc-applicant-row">
                    <FiShield style={{ fontSize: "1.5rem", color: "#f59e0b" }} />
                    <div className="sc-applicant-info">
                      <strong>
                        {widgets.pendingMentors || 0}{" "}
                        {isKm ? "អ្នកណែនាំរង់ចាំការពិនិត្យ" : "Mentor Applications Awaiting Approval"}
                      </strong>
                      <span>{isKm ? "ពិនិត្យជំនាញ និងប្រវត្តិរូប" : "Verify expertise and credentials"}</span>
                    </div>
                    <Link to="/admin" className="sc-resume-btn">
                      {isKm ? "ពិនិត្យ" : "Review"}
                    </Link>
                  </div>

                  <div className="sc-applicant-row">
                    <FiBriefcase style={{ fontSize: "1.5rem", color: "#3b82f6" }} />
                    <div className="sc-applicant-info">
                      <strong>
                        {widgets.pendingCompanies || 0}{" "}
                        {isKm ? "ក្រុមហ៊ុនរង់ចាំការផ្ទៀងផ្ទាត់" : "Company Profiles Pending Verification"}
                      </strong>
                      <span>{isKm ? "ផ្ទៀងផ្ទាត់ឯកសារ និងសិទ្ធិប្រកាសការងារ" : "Review company legitimacy and post rights"}</span>
                    </div>
                    <Link to="/admin" className="sc-resume-btn">
                      {isKm ? "ពិនិត្យ" : "Verify"}
                    </Link>
                  </div>
                </div>
              </section>
            </div>

            <aside className="sc-dashboard-side">
              <section className="sc-panel">
                <header>
                  <div>
                    <p>{t("refresh.activity")}</p>
                    <h2>{t("refresh.activity")}</h2>
                  </div>
                  <Link to="/notifications">
                    {t("refresh.viewAll")} <FiArrowRight />
                  </Link>
                </header>
                {data?.notifications?.length ? (
                  <div className="sc-dashboard-list">
                    {data.notifications.map((notification) => (
                      <Link
                        to={notification.link || "/notifications"}
                        key={notification.id}
                        className={`sc-notification-row ${notification.is_read ? "read" : ""}`}
                      >
                        <FiCheckCircle />
                        <div>
                          <strong>{notification.title}</strong>
                          <span>{notification.message}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="sc-panel-empty">
                    <p>{t("refresh.noActivity")}</p>
                  </div>
                )}
              </section>
            </aside>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================================
  // 4. STUDENT / DEFAULT WORKSPACE
  // =========================================================================
  const studentStats = [
    [FiBookOpen, widgets.enrolledCourses || 0, t("refresh.enrolledCourses"), "/courses"],
    [IoSwapHorizontalOutline, widgets.activeExchanges || 0, t("refresh.activeExchanges"), "/skill-exchange?tab=swaps"],
    [FiBriefcase, widgets.applications || 0, t("refresh.applications"), "/my-applications"],
    [FiBell, widgets.unreadNotifications || 0, t("refresh.unread"), "/notifications"],
  ];

  return (
    <main className="sc-dashboard">
      <section className="sc-dashboard-hero">
        <div className="container sc-dashboard-hero-inner">
          <div>
            <p className="sc-dash-kicker">{t("refresh.workspace")}</p>
            <h1>{t("refresh.greeting", { name: firstName })}</h1>
            <p>{t("refresh.dashboardText")}</p>
            <div className="sc-dashboard-actions">
              <Link to="/courses">
                {t("refresh.allCourses")} <FiArrowRight />
              </Link>
              <Link to="/mentorship">
                {t("refresh.mentorTitle")} <FiArrowRight />
              </Link>
              {user?.role === "admin" && (
                <Link to="/admin">
                  {t("refresh.admin")} <FiArrowRight />
                </Link>
              )}
            </div>
          </div>
          <aside className="sc-profile-progress">
            <span>{t("refresh.profile")}</span>
            <strong>{profileProgress}%</strong>
            <div
              role="progressbar"
              aria-valuenow={profileProgress}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <i style={{ width: `${profileProgress}%` }} />
            </div>
            <Link to="/profile">
              {t("refresh.editProfile")} <FiArrowRight />
            </Link>
          </aside>
        </div>
      </section>

      <div className="container sc-dashboard-content">
        <div className="sc-dashboard-top">
          <p>{t("refresh.workspace")}</p>
          <button type="button" onClick={load}>
            <FiRefreshCw /> {t("refresh.refresh")}
          </button>
        </div>

        <section className="sc-dashboard-stats">
          {studentStats.map(([Icon, value, label, to]) => (
            <Link to={to} key={label}>
              <Icon />
              <strong>{value}</strong>
              <span>{label}</span>
              <FiArrowRight />
            </Link>
          ))}
        </section>

        {data?.courses?.length > 0 && (
          <section className="sc-continue-learning-banner">
            <div className="sc-cl-left">
              <span className="sc-cl-tag">
                <FiBookOpen /> {isKm ? "កំពុងសិក្សា" : "Resume Learning"}
              </span>
              <h3>{data.courses[0].title}</h3>
              <p>
                {data.courses[0].category} · {data.courses[0].progress || 0}% {isKm ? "បានបញ្ចប់" : "Completed"}
              </p>
              <div className="sc-cl-bar">
                <div
                  className="sc-cl-fill"
                  style={{ width: `${Math.max(6, Number(data.courses[0].progress || 0))}%` }}
                />
              </div>
            </div>
            <Link to={`/courses/${data.courses[0].slug}`} className="sc-cl-btn">
              {isKm ? "បន្តការសិក្សា" : "Continue Course"} <FiArrowRight />
            </Link>
          </section>
        )}

        <section className="sc-next-step">
          <span>
            <FiCompass />
          </span>
          <div>
            <p>{t("refresh.nextStep")}</p>
            <h2>{next.title}</h2>
            <small>{next.text}</small>
          </div>
          <Link to={next.to}>
            {next.action} <FiArrowRight />
          </Link>
        </section>

        <div className="sc-dashboard-grid">
          <div className="sc-dashboard-main">
            {/* Courses */}
            <section className="sc-panel">
              <header>
                <div>
                  <p>{t("refresh.myCourses")}</p>
                  <h2>{t("refresh.myCourses")}</h2>
                </div>
                <Link to="/courses">
                  {t("refresh.viewAll")} <FiArrowRight />
                </Link>
              </header>
              {data?.courses?.length ? (
                <div className="sc-dashboard-list">
                  {data.courses.map((course) => (
                    <Link
                      to={`/courses/${course.slug}`}
                      key={course.id}
                      className="sc-course-row"
                    >
                      <FiBookOpen />
                      <div>
                        <strong>{course.title}</strong>
                        <span>{course.category}</span>
                      </div>
                      <div>
                        <b>{course.progress || 0}%</b>
                        <i>
                          <em style={{ width: `${course.progress || 0}%` }} />
                        </i>
                      </div>
                      <FiArrowRight />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="sc-panel-empty">
                  <p>{t("refresh.noEnrolled")}</p>
                  <Link to="/courses">
                    {t("refresh.allCourses")} <FiArrowRight />
                  </Link>
                </div>
              )}
            </section>

            {/* Career Roadmap */}
            <section className="sc-panel">
              <header>
                <div>
                  <p>{t("refresh.roadmap")}</p>
                  <h2>{data?.roadmap?.title || t("refresh.noRoadmap")}</h2>
                </div>
                <Link to="/career">
                  {t("refresh.openCareer")} <FiArrowRight />
                </Link>
              </header>
              {data?.roadmap ? (
                <div className="sc-roadmap">
                  <div
                    className="sc-roadmap-ring"
                    style={{
                      "--progress": `${
                        data.roadmap.totalSteps
                          ? (Number(data.roadmap.completedSteps) /
                              Number(data.roadmap.totalSteps)) *
                            100
                          : 0
                      }%`,
                    }}
                  >
                    <span>
                      {data.roadmap.completedSteps}/{data.roadmap.totalSteps}
                    </span>
                  </div>
                  <p>
                    {t("refresh.stepsComplete", {
                      done: data.roadmap.completedSteps,
                      total: data.roadmap.totalSteps,
                    })}
                  </p>
                </div>
              ) : (
                <div className="sc-panel-empty">
                  <p>{t("refresh.noRoadmap")}</p>
                  <Link to="/career">
                    {t("refresh.openCareer")} <FiArrowRight />
                  </Link>
                </div>
              )}
            </section>

            {/* Latest Internships */}
            <section className="sc-panel">
              <header>
                <div>
                  <p>{t("refresh.latestJobs")}</p>
                  <h2>{t("refresh.latestJobs")}</h2>
                </div>
                <Link to="/jobs">
                  {t("refresh.viewAll")} <FiArrowRight />
                </Link>
              </header>
              {data?.opportunities?.length ? (
                <div className="sc-dashboard-list">
                  {data.opportunities.map((job) => (
                    <Link to="/jobs" key={job.id} className="sc-job-row">
                      <FiBriefcase />
                      <div>
                        <strong>{job.title}</strong>
                        <span>
                          {job.company || job.location || job.internship_type}
                        </span>
                      </div>
                      <FiArrowRight />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="sc-panel-empty">
                  <p>{t("refresh.noJobs")}</p>
                </div>
              )}
            </section>
          </div>

          <aside className="sc-dashboard-side">
            {/* My Schedule */}
            <section className="sc-panel">
              <header>
                <div>
                  <p>{t("refresh.mySchedule")}</p>
                  <h2>{t("refresh.mySchedule")}</h2>
                </div>
                <Link to="/sessions">
                  {t("refresh.viewAll")} <FiArrowRight />
                </Link>
              </header>
              {data?.upcomingEvents?.length ? (
                <div className="sc-dashboard-list">
                  {data.upcomingEvents.map((session) => (
                    <Link
                      to={`/sessions/${session.id}`}
                      key={session.id}
                      className="sc-session-row"
                    >
                      <FiCalendar />
                      <div>
                        <strong>{session.title}</strong>
                        <span>
                          {toDate(session.scheduled_time, language)} ·{" "}
                          {session.mentor_name}
                        </span>
                      </div>
                      <span className={`sc-status ${session.status}`}>
                        {statusLabel(t, session.status)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="sc-panel-empty">
                  <p>{t("refresh.noSessions")}</p>
                  <Link to="/sessions">
                    {t("refresh.sessions")} <FiArrowRight />
                  </Link>
                </div>
              )}
            </section>

            {/* Skill Exchanges */}
            <section className="sc-panel">
              <header>
                <div>
                  <p>{t("refresh.exchangesTitle")}</p>
                  <h2>{t("refresh.exchangesTitle")}</h2>
                </div>
                <Link to="/skill-exchange?tab=swaps">
                  {t("refresh.viewAll")} <FiArrowRight />
                </Link>
              </header>
              {data?.exchanges?.length ? (
                <div className="sc-dashboard-list">
                  {data.exchanges.map((exchange) => (
                    <Link
                      to={`/community/skill-exchange/${exchange.id}`}
                      key={exchange.id}
                      className="sc-exchange-row"
                    >
                      <IoSwapHorizontalOutline />
                      <div>
                        <strong>{exchange.skill_requested}</strong>
                        <span>{exchange.skill_offered}</span>
                      </div>
                      <span className={`sc-status ${exchange.status}`}>
                        {statusLabel(t, exchange.status)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="sc-panel-empty">
                  <p>{t("refresh.noExchanges")}</p>
                  <Link to="/community">
                    {t("refresh.exchange")} <FiArrowRight />
                  </Link>
                </div>
              )}
            </section>

            {/* Activity Notifications */}
            <section className="sc-panel">
              <header>
                <div>
                  <p>{t("refresh.activity")}</p>
                  <h2>{t("refresh.activity")}</h2>
                </div>
                <Link to="/notifications">
                  {t("refresh.viewAll")} <FiArrowRight />
                </Link>
              </header>
              {data?.notifications?.length ? (
                <div className="sc-dashboard-list">
                  {data.notifications.map((notification) => (
                    <Link
                      to={notification.link || "/notifications"}
                      key={notification.id}
                      className={`sc-notification-row ${notification.is_read ? "read" : ""}`}
                    >
                      <FiCheckCircle />
                      <div>
                        <strong>{notification.title}</strong>
                        <span>{notification.message}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="sc-panel-empty">
                  <p>{t("refresh.noActivity")}</p>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
