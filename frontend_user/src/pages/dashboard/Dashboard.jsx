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
  FiUser,
} from "react-icons/fi";
import { IoSwapHorizontalOutline } from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { fetchDashboard } from "../../services/platformService";
import { RouteLoader } from "../../components/ui/LoadingStates";
import {
  enrichCourseRecord,
  enrichInternshipRecord,
  localizeNotificationRecord,
  localizeSessionRecord,
} from "../../utils/bilingualCatalog";
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

const computeActionItems = (role, data, user, profileProgress, isKm) => {
  const actions = [];

  // 1. RECRUITER ACTIONS
  if (role === "recruiter") {
    const company = data?.company;
    const isCompanyVerified = company?.isVerified;
    const pendingApplicants = Number(data?.pipeline?.pending || 0);
    const shortlistedApplicants = Number(data?.pipeline?.shortlisted || 0);

    if (!isCompanyVerified) {
      actions.push({
        id: "recruiter-verify",
        icon: FiShield,
        title: isKm
          ? "គណនីក្រុមហ៊ុនកំពុងរង់ចាំការផ្ទៀងផ្ទាត់ (Pending Verification)"
          : "Company Profile Pending Verification",
        desc: isKm
          ? "រដ្ឋបាល Admin កំពុងត្រួតពិនិត្យឯកសារក្រុមហ៊ុន។ អ្នកនឹងអាចបង្ហោះការងារបានក្រោយការអនុម័ត។"
          : "Administrators are reviewing your company profile. Job posting unlocks upon approval.",
        badge: isKm ? "រង់ចាំពិនិត្យ" : "Under Review",
        badgeType: "warning",
        to: "/profile",
        actionText: isKm ? "ពិនិត្យ Profile" : "View Profile",
      });
    }

    if (pendingApplicants > 0) {
      actions.push({
        id: "recruiter-pending-apps",
        icon: FiUsers,
        title: isKm
          ? `មានបេក្ខជន ${pendingApplicants} នាក់រង់ចាំការពិនិត្យ CV`
          : `${pendingApplicants} Candidate Applications Awaiting Review`,
        desc: isKm
          ? "និស្សិតបានដាក់ពាក្យចូលកម្មសិក្សារបស់អ្នក · ពិនិត្យប្រវត្តិរូប និងជំនាញឥឡូវនេះ"
          : "New applicants submitted CVs for your open internships · Review profiles now",
        badge: `${pendingApplicants} ${isKm ? "ថ្មី" : "New"}`,
        badgeType: "urgent",
        to: "/recruiter/candidates",
        actionText: isKm ? "ពិនិត្យក្នុង ATS" : "Review in ATS",
      });
    }

    if (shortlistedApplicants > 0) {
      actions.push({
        id: "recruiter-shortlist",
        icon: FiCalendar,
        title: isKm
          ? `បេក្ខជនជាប់ជម្រើស ${shortlistedApplicants} នាក់រង់ចាំកំណត់ថ្ងៃសម្ភាសន៍`
          : `${shortlistedApplicants} Shortlisted Talent Ready for Interview`,
        desc: isKm
          ? "កំណត់កាលបរិច្ឆេទសម្ភាសន៍ និងផ្ញើការណែនាំតាមរយៈប្រព័ន្ធ ATS"
          : "Coordinate interview schedule and send instructions directly via ATS pipeline",
        badge: isKm ? "សម្ភាសន៍" : "Schedule Interview",
        badgeType: "info",
        to: "/recruiter/candidates",
        actionText: isKm ? "កំណត់កាលវិភាគ" : "Open Pipeline",
      });
    }

    if (isCompanyVerified && (!data?.myInternships || data.myInternships.length === 0)) {
      actions.push({
        id: "recruiter-post-job",
        icon: FiBriefcase,
        title: isKm ? "ប្រកាសឱកាសកម្មសិក្សាដំបូងរបស់អ្នក" : "Publish Your First Internship",
        desc: isKm
          ? "ទាក់ទាញនិស្សិតមានជំនាញខ្ពស់ក្នុងសហគមន៍ដោយបង្កើតការងារដំបូង"
          : "Reach qualified students directly by creating your first verified listing",
        badge: isKm ? "ចាប់ផ្តើម" : "Get Started",
        badgeType: "accent",
        to: "/post-job",
        actionText: isKm ? "ប្រកាសការងារ" : "Post Job",
      });
    }
    return actions;
  }

  // 2. MENTOR ACTIONS
  if (role === "mentor") {
    const pendingBookings = (data?.bookings || []).filter((b) => b.status === "pending");
    if (pendingBookings.length > 0) {
      actions.push({
        id: "mentor-pending-bookings",
        icon: FiCalendar,
        title: isKm
          ? `មានការកក់ម៉ោង ${pendingBookings.length} រង់ចាំការអនុម័ត`
          : `${pendingBookings.length} Mentorship Booking Requests Pending`,
        desc: isKm
          ? "សិស្សកំពុងរង់ចាំការយល់ព្រមពីអ្នក ដើម្បីកំណត់កាលបរិច្ឆេទជួបពិភាក្សា"
          : "Students are waiting for your approval to confirm session times",
        badge: isKm ? "បន្ទាន់" : "Action Required",
        badgeType: "urgent",
        to: "/mentorship",
        actionText: isKm ? "ពិនិត្យការកក់" : "Review Bookings",
      });
    }

    const readyBooking = (data?.bookings || []).find((b) => b.status === "active" && b.meeting_link);
    if (readyBooking) {
      actions.push({
        id: `mentor-ready-${readyBooking.id}`,
        icon: FiVideo,
        title: isKm
          ? `វគ្គណែនាំសកម្ម: ${readyBooking.topic}`
          : `Active Mentorship: ${readyBooking.topic}`,
        desc: isKm
          ? `ជាមួយសិស្ស ${readyBooking.student_name} · បន្ទប់វីដេអូបានត្រៀមរួចរាល់`
          : `With ${readyBooking.student_name} · Video meeting room is ready`,
        badge: isKm ? "ត្រៀមជួប" : "Ready to Join",
        badgeType: "success",
        externalUrl: readyBooking.meeting_link,
        to: "/mentorship",
        actionText: isKm ? "ចូលបន្ទប់ប្រជុំ" : "Join Video",
      });
    }

    if (!data?.mentorApplication?.availability) {
      actions.push({
        id: "mentor-availability",
        icon: FiClock,
        title: isKm ? "កំណត់ម៉ោងទំនេរសម្រាប់ណែនាំសិស្ស" : "Set Your Booking Availability",
        desc: isKm
          ? "កំណត់ម៉ោង និងថ្ងៃដែលអ្នកទំនេរ ដើម្បីឱ្យសិស្សអាចកក់ម៉ោងពិគ្រោះបានត្រឹមត្រូវ"
          : "Define your open days and hours so students can schedule sessions without conflict",
        badge: isKm ? "រៀបចំ" : "Setup",
        badgeType: "neutral",
        to: "/profile",
        actionText: isKm ? "កំណត់ម៉ោង" : "Set Hours",
      });
    }
    return actions;
  }

  // 3. ADMIN ACTIONS
  if (role === "admin") {
    const pendingMentors = Number(data?.widgets?.pendingMentors || 0);
    const pendingCompanies = Number(data?.widgets?.pendingCompanies || 0);

    if (pendingMentors > 0) {
      actions.push({
        id: "admin-pending-mentors",
        icon: FiShield,
        title: isKm
          ? `ពាក្យស្នើសុំជា Mentor ចំនួន ${pendingMentors} រង់ចាំការត្រួតពិនិត្យ`
          : `${pendingMentors} Mentor Applications Awaiting Verification`,
        desc: isKm
          ? "ពិនិត្យជំនាញ ឯកសារ និងបទពិសោធន៍របស់អ្នកណែនាំថ្មី"
          : "Verify credentials, portfolio links, and approve eligible mentors",
        badge: `${pendingMentors} ${isKm ? "រង់ចាំពិនិត្យ" : "Pending"}`,
        badgeType: "urgent",
        to: "/admin",
        actionText: isKm ? "ពិនិត្យ" : "Review",
      });
    }

    if (pendingCompanies > 0) {
      actions.push({
        id: "admin-pending-companies",
        icon: FiBriefcase,
        title: isKm
          ? `ក្រុមហ៊ុនចំនួន ${pendingCompanies} រង់ចាំការផ្ទៀងផ្ទាត់សិទ្ធិ`
          : `${pendingCompanies} Company Profiles Pending Verification`,
        desc: isKm
          ? "ផ្ទៀងផ្ទាត់ភាពស្របច្បាប់ និងអនុញ្ញាតសិទ្ធិបង្ហោះការងារ"
          : "Verify employer legitimacy before granting public posting permissions",
        badge: `${pendingCompanies} ${isKm ? "រង់ចាំពិនិត្យ" : "Pending"}`,
        badgeType: "urgent",
        to: "/admin",
        actionText: isKm ? "ផ្ទៀងផ្ទាត់" : "Verify",
      });
    }
    return actions;
  }

  // 4. STUDENT ACTIONS
  const unfinishedRaw = data?.courses?.find((c) => Number(c.progress || 0) < 100);
  if (unfinishedRaw) {
    const unfinishedCourse = enrichCourseRecord(unfinishedRaw, 0);
    const cTitle = isKm ? unfinishedCourse.titleKm : unfinishedCourse.titleEn;
    actions.push({
      id: "course-resume",
      icon: FiBookOpen,
      title: isKm
        ? `បន្តការសិក្សា: ${cTitle}`
        : `Continue: ${cTitle}`,
      desc: isKm
        ? `បានបញ្ចប់ ${unfinishedRaw.progress || 0}% · បន្តមេរៀនបន្ទាប់ភ្លាមៗ`
        : `${unfinishedRaw.progress || 0}% completed · Resume where you left off`,
      badge: isKm ? "កំពុងរៀន" : "In Progress",
      badgeType: "warning",
      to: `/courses/${unfinishedRaw.slug}`,
      actionText: isKm ? "បន្តមេរៀន" : "Resume Lesson",
    });
  }

  const pendingSwap = data?.exchanges?.find((e) => e.status === "pending");
  if (pendingSwap) {
    actions.push({
      id: `swap-${pendingSwap.id}`,
      icon: IoSwapHorizontalOutline,
      title: isKm
        ? `សំណើដោះដូរជំនាញ: ${pendingSwap.skill_requested || "Skill"}`
        : `Skill Swap Request: ${pendingSwap.skill_requested || "Skill"}`,
      desc: isKm
        ? "មានសំណើថ្មីកំពុងរង់ចាំការឆ្លើយតបរបស់អ្នក"
        : "A peer is waiting for your response to start learning",
      badge: isKm ? "ត្រូវឆ្លើយតប" : "Action Required",
      badgeType: "urgent",
      to: "/skill-exchange?tab=swaps",
      actionText: isKm ? "ពិនិត្យសំណើ" : "Review Request",
    });
  }

  const activeApp = data?.applications?.find(
    (a) => a.status === "shortlisted" || a.status === "reviewed"
  );
  if (activeApp) {
    actions.push({
      id: `app-${activeApp.id}`,
      icon: FiBriefcase,
      title: isKm
        ? `ពាក្យសុំការងារបានផ្លាស់ប្តូរ: ${activeApp.title}`
        : `Application Updated: ${activeApp.title}`,
      desc: isKm
        ? `ស្ថានភាព: ${activeApp.status === "shortlisted" ? "ជាប់ជម្រើស (Shortlisted)" : "បានពិនិត្យ"} · ពិនិត្យព័ត៌មានបន្ថែម`
        : `Status: ${activeApp.status} · Check details and interview schedule`,
      badge: activeApp.status,
      badgeType: "info",
      to: "/my-applications",
      actionText: isKm ? "មើលពាក្យសុំ" : "View Application",
    });
  }

  if (profileProgress < 85) {
    actions.push({
      id: "profile-complete",
      icon: FiUser,
      title: isKm ? "បំពេញប្រវត្តិរូប និងជំនាញ" : "Complete Profile & Portfolio",
      desc: isKm
        ? `ប្រវត្តិរូបរបស់អ្នកសម្រេចបាន ${profileProgress}% · បន្ថែម Bio និងជំនាញដើម្បីបង្កើនឱកាសការងារ`
        : `Profile is ${profileProgress}% complete · Add bio and skills to boost job match scores`,
      badge: `${profileProgress}%`,
      badgeType: "neutral",
      to: "/profile",
      actionText: isKm ? "បំពេញប្រវត្តិរូប" : "Edit Profile",
    });
  }

  if (!data?.roadmap) {
    actions.push({
      id: "career-roadmap",
      icon: FiCompass,
      title: isKm ? "ជ្រើសរើសផែនទីបង្ហាញផ្លូវអាជីព" : "Explore Career Roadmaps",
      desc: isKm
        ? "ធ្វើតេស្តវាស់សមត្ថភាព និងជ្រើសរើសផែនទីអាជីពឆ្ពោះទៅកាន់ការងារដែលអ្នកស្រមៃចង់បាន"
        : "Take competency assessment and establish milestone pathways to target jobs",
      badge: isKm ? "ណែនាំ" : "Recommended",
      badgeType: "accent",
      to: "/career",
      actionText: isKm ? "បើកផែនទីអាជីព" : "Start Roadmap",
    });
  }

  return actions.slice(0, 2);
};

const SmartActionCenter = ({ actions, isKm }) => {
  return (
    <section className="sc-action-center">
      <div className="sc-action-center-header">
        <div className="sc-action-center-title">
          <span className="sc-action-center-icon">
            <FiCheckCircle />
          </span>
          <div>
            <h3>{isKm ? "មជ្ឈមណ្ឌលសកម្មភាព" : "Smart Action Center"}</h3>
            <p>{isKm ? "កិច្ចការបន្ទាន់ដែលអ្នកត្រូវធ្វើបន្ទាប់" : "Tasks that require your immediate attention"}</p>
          </div>
        </div>
        <div className="sc-action-header-right">
          <a href="/calendar" className="sc-action-calendar-btn">
            <FiCalendar />
            <span>{isKm ? "កាលវិភាគសកម្មភាព" : "Activity Calendar"}</span>
          </a>
          <span className="sc-action-count-pill">
            {actions.length} {isKm ? "កិច្ចការ" : actions.length === 1 ? "task" : "tasks"}
          </span>
        </div>
      </div>

      {actions.length > 0 ? (
        <div className="sc-action-grid">
          {actions.map((act) => {
            const Icon = act.icon || FiCompass;
            return (
              <div key={act.id} className={`sc-action-item badge-${act.badgeType || "neutral"}`}>
                <div className="sc-action-left">
                  <span className="sc-action-icon-wrap">
                    <Icon />
                  </span>
                  <div className="sc-action-body">
                    <div className="sc-action-title-row">
                      <h4>{act.title}</h4>
                      <span className={`sc-action-badge ${act.badgeType}`}>{act.badge}</span>
                    </div>
                    <p>{act.desc}</p>
                  </div>
                </div>
                <div className="sc-action-right">
                  {act.externalUrl ? (
                    <a href={act.externalUrl} target="_blank" rel="noreferrer" className="sc-action-cta-btn">
                      {act.actionText} <FiArrowRight />
                    </a>
                  ) : (
                    <Link to={act.to} className="sc-action-cta-btn">
                      {act.actionText} <FiArrowRight />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="sc-action-empty-state">
          <span className="sc-empty-sparkle">
            <FiCheckCircle />
          </span>
          <h4>{isKm ? "អ្នកបានបញ្ចប់រាល់កិច្ចការទាំងអស់ហើយ!" : "All caught up! No pending tasks right now."}</h4>
          <p>{isKm ? "មិនមានកិច្ចការបន្ទាន់ដែលរង់ចាំអ្នកនៅពេលនេះទេ។" : "Everything is on track. Explore new courses, mentors, or opportunities below."}</p>
        </div>
      )}
    </section>
  );
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
  const rawFirst =
    user?.fullName?.trim().split(/\s+/)[0] || user?.email?.split("@")[0] || "";
  const formattedFirst =
    rawFirst.length > 1
      ? rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase()
      : rawFirst;
  const firstName =
    effectiveRole === "admin" && rawFirst.toLowerCase() === "smart"
      ? "Admin"
      : formattedFirst;

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
              <strong className="sc-profile-title-text">
                {company?.name || user?.recruiterCompany || "Angkor Tech Ventures"}
              </strong>
              <p style={{ margin: "4px 0 16px", color: "var(--soft)", fontSize: "0.88rem" }}>
                {company?.industry || (isKm ? "បច្ចេកវិទ្យា និងនវានុវត្តន៍" : "Tech & Innovation")} ·{" "}
                {company?.location || (isKm ? "ភ្នំពេញ" : "Phnom Penh")}
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

          {/* Smart Action Center */}
          <SmartActionCenter
            actions={computeActionItems("recruiter", data, user, profileProgress, isKm)}
            isKm={isKm}
          />

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
                    <p style={{ margin: "0 0 14px", fontSize: "0.9rem", color: "var(--soft)", lineHeight: 1.6 }}>
                      {isKm && String(company.description).toLowerCase().includes("fast growing digital venture")
                        ? "ក្រុមហ៊ុនបច្ចេកវិទ្យាឌីជីថលឈានមុខគេដែលកំពុងជ្រើសរើសអ្នកអភិវឌ្ឍន៍កម្មវិធី និងអ្នករចនាផលិតផលវ័យក្មេងដែលមានទេពកោសល្យ។"
                        : company.description}
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
                    {data.notifications.map((rawNotif) => {
                      const notification = localizeNotificationRecord(rawNotif, isKm);
                      return (
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
                      );
                    })}
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
              <strong className="sc-profile-title-text">
                {!mentorApp.professional_title || mentorApp.professional_title.toLowerCase() === "beginner"
                  ? isKm
                    ? "អ្នកណែនាំជំនាញ Full-Stack & Cloud"
                    : "Senior Full-Stack & Cloud Mentor"
                  : mentorApp.professional_title}
              </strong>
              <p style={{ margin: "4px 0 16px", color: "var(--soft)", fontSize: "0.88rem" }}>
                {isKm ? "ម៉ោងណែនាំបត់បែន (Flexible schedule)" : mentorApp.availability || "Flexible schedule"}
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

          {/* Smart Action Center */}
          <SmartActionCenter
            actions={computeActionItems("mentor", data, user, profileProgress, isKm)}
            isKm={isKm}
          />

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
                    {data.notifications.map((rawNotif) => {
                      const notification = localizeNotificationRecord(rawNotif, isKm);
                      return (
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
                      );
                    })}
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
      [FiUsers, widgets.totalUsers ?? widgets.users ?? 0, isKm ? "អ្នកប្រើប្រាស់សរុប" : "Total Users", "/admin"],
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
                {isKm ? "សិទ្ធិគ្រប់គ្រងប្រព័ន្ធពេញលេញ" : "Full system authorization"}
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

          {/* Smart Action Center */}
          <SmartActionCenter
            actions={computeActionItems("admin", data, user, profileProgress, isKm)}
            isKm={isKm}
          />

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
                    {data.notifications.map((rawNotif) => {
                      const notification = localizeNotificationRecord(rawNotif, isKm);
                      return (
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
                      );
                    })}
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
                <FiBookOpen /> {t("refresh.allCourses")} <FiArrowRight />
              </Link>
              <Link to="/cv-studio">
                <FiFileText /> {isKm ? "បង្កើត PDF CV ស្អាត" : "CV Studio"} <FiArrowRight />
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

        {/* Smart Action Center */}
        <SmartActionCenter
          actions={computeActionItems("student", data, user, profileProgress, isKm)}
          isKm={isKm}
        />

        <div className="sc-dashboard-grid">
          <div className="sc-dashboard-main">
            {/* Courses */}
            <section className="sc-panel">
              <header>
                <div>
                  <h2>{t("refresh.myCourses")}</h2>
                </div>
                <Link to="/courses">
                  {t("refresh.viewAll")} <FiArrowRight />
                </Link>
              </header>
              {data?.courses?.length ? (
                <div className="sc-dashboard-list">
                  {data.courses.map((rawCourse, idx) => {
                    const course = enrichCourseRecord(rawCourse, idx);
                    const cTitle = isKm ? course.titleKm : course.titleEn;
                    const cCat = isKm ? course.catKm : course.catEn;
                    return (
                      <Link
                        to={`/courses/${course.slug}`}
                        key={course.id}
                        className="sc-course-row"
                      >
                        <FiBookOpen />
                        <div>
                          <strong>{cTitle}</strong>
                          <span>{cCat}</span>
                        </div>
                        <div>
                          <b>{course.progress || 0}%</b>
                          <i>
                            <em style={{ width: `${course.progress || 0}%` }} />
                          </i>
                        </div>
                        <FiArrowRight />
                      </Link>
                    );
                  })}
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

            {/* Latest Internships */}
            <section className="sc-panel">
              <header>
                <div>
                  <h2>{t("refresh.latestJobs")}</h2>
                </div>
                <Link to="/jobs">
                  {t("refresh.viewAll")} <FiArrowRight />
                </Link>
              </header>
              {data?.opportunities?.length ? (
                <div className="sc-dashboard-list">
                  {data.opportunities.slice(0, 3).map((rawJob, idx) => {
                    const job = enrichInternshipRecord(rawJob, idx);
                    const jTitle = isKm ? job.titleKm : rawJob.title;
                    const jLoc = isKm ? job.locationKm : rawJob.location;
                    return (
                      <Link to="/jobs" key={rawJob.id} className="sc-job-row">
                        <FiBriefcase />
                        <div>
                          <strong>{jTitle}</strong>
                          <span>
                            {rawJob.company ? `${rawJob.company} · ${jLoc}` : jLoc}
                          </span>
                        </div>
                        <FiArrowRight />
                      </Link>
                    );
                  })}
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
                  <h2>{t("refresh.mySchedule")}</h2>
                </div>
                <Link to="/sessions">
                  {t("refresh.viewAll")} <FiArrowRight />
                </Link>
              </header>
              {data?.upcomingEvents?.length ? (
                <div className="sc-dashboard-list">
                  {data.upcomingEvents.slice(0, 3).map((rawSession) => {
                    const session = localizeSessionRecord(rawSession, isKm);
                    return (
                      <Link
                        to={`/sessions/${session.id}`}
                        key={session.id}
                        className="sc-session-row"
                      >
                        <FiCalendar />
                        <div>
                          <strong>{session.displayTitle}</strong>
                          <span>
                            {toDate(session.scheduled_time, language)} ·{" "}
                            {session.mentor_name}
                          </span>
                        </div>
                        <span className={`sc-status ${session.status}`}>
                          {statusLabel(t, session.status)}
                        </span>
                      </Link>
                    );
                  })}
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

            {/* Activity Notifications */}
            <section className="sc-panel">
              <header>
                <div>
                  <h2>{t("refresh.activity")}</h2>
                </div>
                <Link to="/notifications">
                  {t("refresh.viewAll")} <FiArrowRight />
                </Link>
              </header>
              {data?.notifications?.length ? (
                <div className="sc-dashboard-list">
                  {data.notifications.slice(0, 4).map((rawNotif) => {
                    const notification = localizeNotificationRecord(rawNotif, isKm);
                    return (
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
                    );
                  })}
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
