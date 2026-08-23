import { Link } from "react-router-dom";
import {
  IoArrowForward,
  IoBriefcaseOutline,
  IoCalendarOutline,
  IoChatbubbleEllipsesOutline,
  IoCheckmarkCircle,
  IoCompassOutline,
  IoFlameOutline,
  IoPeopleOutline,
  IoPersonCircleOutline,
  IoPlayCircleOutline,
  IoRibbonOutline,
  IoSchoolOutline,
  IoShieldCheckmarkOutline,
  IoSparklesOutline,
  IoSwapHorizontalOutline,
  IoTimeOutline,
  IoTrendingUpOutline,
  IoVideocamOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { sampleCourses } from "../courses/courseData";
import "./Dashboard.css";

const upcomingEvents = [
  {
    id: "session-1",
    titleKey: "eventOneTitle",
    timeKey: "eventOneTime",
    typeKey: "eventOneType",
    to: "/sessions",
    live: true,
    tag: "Live Room",
  },
  {
    id: "session-2",
    titleKey: "eventTwoTitle",
    timeKey: "eventTwoTime",
    typeKey: "eventTwoType",
    to: "/mentorship",
    live: false,
    tag: "1:1 Mentorship",
  },
  {
    id: "session-3",
    titleKey: "eventThreeTitle",
    timeKey: "eventThreeTime",
    typeKey: "eventThreeType",
    to: "/sessions",
    live: false,
    tag: "Workshop",
  },
];

const jobMatches = [
  {
    title: "Frontend Developer Intern",
    company: "ABA Bank Digital Lab",
    match: 94,
    type: "Internship",
    location: "Phnom Penh · Hybrid",
  },
  {
    title: "Junior UI/UX Designer",
    company: "Smart Axiata Tech",
    match: 88,
    type: "Full-time",
    location: "Phnom Penh · On-site",
  },
  {
    title: "Data Analyst & AI Trainee",
    company: "Fintech Innovation Hub",
    match: 82,
    type: "Internship",
    location: "Remote",
  },
];

const roadmapSteps = [
  "roadmapOne",
  "roadmapTwo",
  "roadmapThree",
  "roadmapFour",
];

const quickActions = [
  {
    icon: IoSchoolOutline,
    titleKey: "startLearning",
    descriptionKey: "startLearningDesc",
    to: "/courses",
    tone: "teal",
  },
  {
    icon: IoPeopleOutline,
    titleKey: "findMentor",
    descriptionKey: "findMentorDesc",
    to: "/mentorship",
    tone: "blue",
  },
  {
    icon: IoSwapHorizontalOutline,
    titleKey: "exchangeSkills",
    descriptionKey: "exchangeSkillsDesc",
    to: "/community",
    tone: "violet",
  },
  {
    icon: IoBriefcaseOutline,
    titleKey: "exploreInternships",
    descriptionKey: "exploreInternshipsDesc",
    to: "/jobs",
    tone: "amber",
  },
];

const journeyContent = {
  en: {
    kicker: "Career Pipeline",
    title: "Your 4-Stage Breakthrough Journey",
    description:
      "Follow your structured path: establish your verified profile, master practical skills, connect with industry mentors, and land high-match opportunities.",
    nextAction: "Recommended next step",
    continue: "Continue",
    stages: [
      {
        title: "Profile & Skills Setup",
        text: "Add your career goals and skills so our matchmaking algorithm tailors your roadmap.",
        to: "/profile",
      },
      {
        title: "Master Practical Skills",
        text: "Progress through Smart Academy courses and build hands-on portfolio projects.",
        to: "/courses",
      },
      {
        title: "1:1 Mentorship & Peer Barter",
        text: "Meet verified mentors for portfolio reviews and swap knowledge with peers.",
        to: "/mentorship",
      },
      {
        title: "Land Verified Internships",
        text: "Apply directly to matched companies with your verified skill profile.",
        to: "/jobs",
      },
    ],
  },
  km: {
    kicker: "ដំណាក់កាលអភិវឌ្ឍន៍អាជីព",
    title: "ដំណើរ ៤ ជំហានឆ្ពោះទៅរកភាពជោគជ័យ",
    description:
      "អនុវត្តតាមជំហានដែលបានរៀបចំ៖ បំពេញប្រវត្តិរូប រៀនជំនាញអនុវត្ត ជួបអ្នកណែនាំអាជីព និងដាក់ពាក្យទៅកាន់ឱកាសការងារដែលត្រូវគ្នា។",
    nextAction: "ជំហានបន្ទាប់ដែលណែនាំ",
    continue: "បន្តទៅមុខ",
    stages: [
      {
        title: "បង្កើត Profile & ជំនាញ",
        text: "បន្ថែមគោលដៅ និងជំនាញ ដើម្បីឱ្យប្រព័ន្ធណែនាំផ្លូវអាជីពបានត្រឹមត្រូវ។",
        to: "/profile",
      },
      {
        title: "រៀនជំនាញអនុវត្ត",
        text: "បន្តវគ្គសិក្សា Smart Academy និងបង្កើតគម្រោងស្នាដៃជាក់ស្តែង។",
        to: "/courses",
      },
      {
        title: "ការណែនាំ ១ ទល់ ១ & ប្តូរជំនាញ",
        text: "ជួបអ្នកណែនាំដើម្បីពិនិត្យស្នាដៃ និងចែករំលែកចំណេះដឹងជាមួយមិត្តភក្តិ។",
        to: "/mentorship",
      },
      {
        title: "ទទួលបានការងារ & ហាត់ការ",
        text: "ដាក់ពាក្យផ្ទាល់ទៅកាន់ក្រុមហ៊ុនដៃគូជាមួយប្រវត្តិរូបដែលបានផ្ទៀងផ្ទាត់។",
        to: "/jobs",
      },
    ],
  },
};

const DashboardStat = ({ icon: Icon, label, value, detail, tone, to }) => (
  <Link className={`dashboard-stat-modern ${tone}`} to={to}>
    <div className="stat-modern-top">
      <span className="dashboard-stat-icon">
        <Icon aria-hidden="true" />
      </span>
      <IoArrowForward className="dashboard-stat-arrow" aria-hidden="true" />
    </div>
    <div className="dashboard-stat-copy">
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{detail}</small>
    </div>
  </Link>
);

const Dashboard = () => {
  const { user, isLoading } = useGlobleContext();
  const { language, t } = useLanguage();

  if (isLoading) {
    return (
      <main className="dashboard-page dashboard-loading-page" aria-busy="true">
        <section className="container dashboard-loading">
          <div className="dashboard-loading-hero" />
          <div className="dashboard-loading-stats">
            {Array.from({ length: 4 }, (_, index) => (
              <span key={index} />
            ))}
          </div>
          <div className="dashboard-loading-panels">
            <span />
            <span />
          </div>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-empty container">
          <span>
            <IoCompassOutline aria-hidden="true" />
          </span>
          <h1>{t("dashboard.emptyTitle")}</h1>
          <p>{t("dashboard.emptyDescription")}</p>
          <div>
            <Link className="btn primary" to="/register">
              {t("common.createFreeAccount")}
            </Link>
            <Link className="btn outline" to="/courses">
              {t("common.exploreCourses")}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const role = user.role || "member";
  const firstName =
    user.fullName?.trim().split(/\s+/)[0] ||
    user.email?.split("@")[0] ||
    "there";
  const skillsToTeach = user.skillsToTeach || [];
  const skillsToLearn = user.skillsToLearn || [];
  const candidateSkills = user.candidateSkills || [];
  const skillTotal =
    role === "recruiter"
      ? candidateSkills.length
      : skillsToTeach.length + skillsToLearn.length;
  const learningProgress = Math.min(100, 35 + skillTotal * 8);
  const skillScore = Math.min(100, 50 + skillTotal * 7);
  const profileSignals = [
    user.fullName,
    user.avatarUrl,
    user.bio,
    user.careerGoal,
    skillTotal > 0,
  ];
  const profileCompletion = Math.max(
    20,
    Math.round(
      (profileSignals.filter(Boolean).length / profileSignals.length) * 100,
    ),
  );
  const completedRoadmapSteps = Math.min(
    roadmapSteps.length,
    Math.floor(learningProgress / 25),
  );
  const journey = journeyContent[language] || journeyContent.en;
  const journeyProgress = [
    profileCompletion >= 70,
    learningProgress >= 55,
    skillTotal > 0,
    learningProgress >= 70 || role === "recruiter",
  ];
  const nextJourneyIndex = journeyProgress.findIndex(
    (isComplete) => !isComplete,
  );
  const activeJourneyIndex =
    nextJourneyIndex === -1 ? journey.stages.length - 1 : nextJourneyIndex;
  const activeJourneyStage = journey.stages[activeJourneyIndex];
  const formattedDate = new Intl.DateTimeFormat(
    language === "km" ? "km-KH" : "en",
    {
      weekday: "long",
      month: "short",
      day: "numeric",
    },
  ).format(new Date());
  const roleLabel = t(`profile.${role}`);

  return (
    <main className="dashboard-page">
      {/* 1. HERO COMMAND HEADER */}
      <section className="dashboard-hero">
        <div className="dashboard-hero-glow hero-glow-1" aria-hidden="true" />
        <div className="dashboard-hero-glow hero-glow-2" aria-hidden="true" />

        <div className="container dashboard-hero-inner">
          <div className="dashboard-welcome">
            <div className="dashboard-context">
              <span className="role-badge">
                <IoShieldCheckmarkOutline />
                {t("dashboard.workspace", { role: roleLabel })}
              </span>
              <span className="streak-badge">
                {t("dashboard.learningStreak")}
              </span>
              <span className="date-badge">{formattedDate}</span>
            </div>

            <h1>{t("dashboard.greeting", { name: firstName })}</h1>
            <p>{t("dashboard.intro")}</p>

            <div className="dashboard-actions">
              <Link className="home-btn primary" to="/courses">
                <IoPlayCircleOutline />
                {t("dashboard.continueLearning")}
              </Link>
              <Link className="home-btn secondary" to="/mentorship">
                <IoPeopleOutline />
                {t("dashboard.findMentor")}
              </Link>
              <Link className="home-btn ghost" to="/community">
                <IoSwapHorizontalOutline />
                {t("dashboard.exchangeSkills")}
              </Link>
              {role === "admin" && (
                <Link className="home-btn ghost" to="/admin">
                  {t("common.adminPanel")}
                </Link>
              )}
            </div>
          </div>

          {/* Profile Readiness Glass Card */}
          <aside
            className="dashboard-readiness-card"
            aria-label={t("dashboard.readinessLabel")}
          >
            <div className="readiness-header">
              <div className="readiness-avatar-box">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={firstName}
                    className="user-avatar-img"
                  />
                ) : (
                  <IoPersonCircleOutline />
                )}
              </div>
              <div>
                <span className="readiness-sub">
                  {t("dashboard.readinessLabel")}
                </span>
                <strong className="readiness-val">
                  {t("dashboard.percentComplete", {
                    percent: profileCompletion,
                  })}
                </strong>
              </div>
            </div>

            <div
              className="dashboard-readiness-track"
              role="progressbar"
              aria-label={t("dashboard.completionLabel")}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={profileCompletion}
            >
              <span style={{ width: `${profileCompletion}%` }} />
            </div>

            <p className="readiness-desc">
              {t("dashboard.readinessDescription")}
            </p>

            <div className="readiness-footer">
              <Link to="/profile" className="improve-profile-link">
                {t("dashboard.improveProfile")}
                <IoArrowForward aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* 2. KPI STATS GRID */}
      <div className="container dashboard-content">
        <section
          className="dashboard-stats-grid"
          aria-label={t("dashboard.overviewLabel")}
        >
          <DashboardStat
            icon={IoSchoolOutline}
            label={t("dashboard.learningProgress")}
            value={`${learningProgress}%`}
            detail={t("dashboard.learningProgressDetail")}
            tone="teal"
            to="/courses"
          />
          <DashboardStat
            icon={IoTrendingUpOutline}
            label={t("dashboard.skillScore")}
            value={`${skillScore}/100`}
            detail={t("dashboard.skillScoreDetail")}
            tone="blue"
            to="/profile"
          />
          <DashboardStat
            icon={IoSwapHorizontalOutline}
            label={t("dashboard.skillGoals")}
            value={skillTotal}
            detail={t("dashboard.skillGoalsDetail")}
            tone="violet"
            to="/community"
          />
          <DashboardStat
            icon={IoBriefcaseOutline}
            label={t("dashboard.jobMatches")}
            value={jobMatches.length}
            detail={t("dashboard.jobMatchesDetail")}
            tone="amber"
            to="/jobs"
          />
        </section>

        {/* 3. 4-STAGE CAREER PIPELINE TRACKER */}
        <section className="dashboard-section dashboard-journey-section">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-kicker">{journey.kicker}</span>
              <h2>{journey.title}</h2>
            </div>
            <p>{journey.description}</p>
          </div>

          <div className="dashboard-journey-layout">
            <div className="dashboard-journey-track" aria-label={journey.title}>
              {journey.stages.map((stage, index) => {
                const isComplete = journeyProgress[index];
                const isActive = index === activeJourneyIndex;

                return (
                  <Link
                    className={`dashboard-journey-step ${
                      isComplete ? "complete" : ""
                    } ${isActive ? "active" : ""}`}
                    key={stage.title}
                    to={stage.to}
                  >
                    <span className="dashboard-journey-marker">
                      {isComplete ? <IoCheckmarkCircle /> : index + 1}
                    </span>
                    <div className="journey-step-text">
                      <h3>{stage.title}</h3>
                      <p>{stage.text}</p>
                    </div>
                  </Link>
                );
              })}
            </div>

            <aside className="dashboard-next-action-card">
              <span className="next-action-badge">
                <IoSparklesOutline />
                {journey.nextAction}
              </span>
              <h3>{activeJourneyStage.title}</h3>
              <p>{activeJourneyStage.text}</p>
              <Link
                className="home-btn primary small"
                to={activeJourneyStage.to}
              >
                {journey.continue} <IoArrowForward />
              </Link>
            </aside>
          </div>
        </section>

        {/* 4. QUICK ACTION SHORTCUTS */}
        <section className="dashboard-section dashboard-quick-section">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-kicker">
                {t("dashboard.quickActions")}
              </span>
              <h2>{t("dashboard.quickTitle")}</h2>
            </div>
            <p>{t("dashboard.quickDescription")}</p>
          </div>

          <div className="dashboard-quick-grid">
            {quickActions.map(
              ({ icon: Icon, titleKey, descriptionKey, to, tone }) => (
                <Link
                  className={`dashboard-quick-card ${tone}`}
                  to={to}
                  key={to}
                >
                  <div className="quick-card-icon-wrap">
                    <Icon aria-hidden="true" />
                  </div>
                  <div className="quick-card-body">
                    <h3>{t(`dashboard.${titleKey}`)}</h3>
                    <p>{t(`dashboard.${descriptionKey}`)}</p>
                  </div>
                  <IoArrowForward
                    className="quick-card-arrow"
                    aria-hidden="true"
                  />
                </Link>
              ),
            )}
          </div>
        </section>

        {/* 5. MAIN WORKSPACE 2-COLUMN LAYOUT */}
        <div className="dashboard-layout">
          {/* LEFT COLUMN: ACTIVE COURSES, MILESTONES & RECOMMENDED JOBS */}
          <div className="dashboard-main-col">
            {/* Active Courses Panel */}
            <section className="dashboard-panel dashboard-learning-panel">
              <div className="dashboard-panel-header">
                <div>
                  <span className="dashboard-kicker">
                    {t("dashboard.learning")}
                  </span>
                  <h2>{t("dashboard.continueTitle")}</h2>
                  <p>{t("dashboard.continueDescription")}</p>
                </div>
                <Link to="/courses" className="panel-header-link">
                  {t("dashboard.allCourses")} <IoArrowForward />
                </Link>
              </div>

              <div className="dashboard-course-list">
                {sampleCourses.map((course, index) => (
                  <Link
                    className="dashboard-course-card"
                    to={`/courses/${course.id}`}
                    key={course.id}
                  >
                    <span className="dashboard-course-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="dashboard-course-copy">
                      <span className="course-cat-tag">{course.category}</span>
                      <h3>{course.title}</h3>
                      <p>
                        {course.mentor} · {course.duration}
                      </p>
                    </div>
                    <div className="dashboard-progress-col">
                      <div className="progress-labels">
                        <strong>{course.progress}%</strong>
                        <small>{t("common.complete")}</small>
                      </div>
                      <div
                        className="progress-bar-wrap"
                        role="progressbar"
                        aria-label={t("dashboard.courseProgressLabel", {
                          course: course.title,
                        })}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow={course.progress}
                      >
                        <span style={{ width: `${course.progress}%` }} />
                      </div>
                    </div>
                    <span className="resume-lesson-btn">
                      {t("dashboard.resumeLesson")}
                      <IoArrowForward />
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Career Focus Milestones Panel */}
            <section className="dashboard-panel dashboard-roadmap-panel">
              <div className="dashboard-panel-header">
                <div>
                  <span className="dashboard-kicker">
                    {t("dashboard.careerFocus")}
                  </span>
                  <h2>{t("dashboard.milestonesTitle")}</h2>
                  <p>{t("dashboard.milestonesDescription")}</p>
                </div>
                <Link to="/career" className="panel-header-link">
                  {t("dashboard.fullRoadmap")} <IoArrowForward />
                </Link>
              </div>

              <div className="dashboard-roadmap-list">
                {roadmapSteps.map((stepKey, index) => {
                  const isComplete = index < completedRoadmapSteps;
                  return (
                    <article
                      className={`roadmap-step-item ${isComplete ? "complete" : ""}`}
                      key={stepKey}
                    >
                      <span className="step-num-icon">
                        {isComplete ? (
                          <IoCheckmarkCircle aria-hidden="true" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <div className="step-item-body">
                        <small>{t("common.step", { number: index + 1 })}</small>
                        <p>{t(`dashboard.${stepKey}`)}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Matched Opportunities Panel */}
            <section className="dashboard-panel dashboard-jobs-panel">
              <div className="dashboard-panel-header">
                <div>
                  <span className="dashboard-kicker">
                    {t("dashboard.opportunities")}
                  </span>
                  <h2>{t("dashboard.recommended")}</h2>
                  <p>{t("dashboard.recommendedDescription")}</p>
                </div>
                <Link to="/jobs" className="panel-header-link">
                  {t("dashboard.viewJobs")} <IoArrowForward />
                </Link>
              </div>

              <div className="dashboard-job-list">
                {jobMatches.map((job) => (
                  <Link
                    to="/jobs"
                    className="dashboard-job-card"
                    key={`${job.company}-${job.title}`}
                  >
                    <span className="dashboard-job-icon">
                      <IoBriefcaseOutline aria-hidden="true" />
                    </span>
                    <div className="job-card-details">
                      <h3>{job.title}</h3>
                      <p className="job-company">{job.company}</p>
                      <span className="job-location-tag">{job.location}</span>
                    </div>
                    <div className="job-match-badge">
                      <IoFlameOutline />
                      <strong>
                        {t("dashboard.match", { percent: job.match })}
                      </strong>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: UPCOMING SESSIONS, SKILL EXCHANGE & WEEKLY INSIGHTS */}
          <div className="dashboard-side-col">
            {/* Upcoming Live Sessions Card */}
            <section className="dashboard-panel dashboard-events-panel">
              <div className="dashboard-panel-header">
                <div>
                  <span className="dashboard-kicker">
                    {t("dashboard.schedule")}
                  </span>
                  <h2>{t("dashboard.comingUp")}</h2>
                  <p>{t("dashboard.scheduleDescription")}</p>
                </div>
                <Link to="/sessions" className="panel-header-link">
                  {t("common.viewAll")}
                </Link>
              </div>

              <div className="dashboard-event-list">
                {upcomingEvents.map((event) => (
                  <Link
                    to={event.to}
                    className="dashboard-event-card"
                    key={event.id}
                  >
                    <div className="event-icon-box">
                      {event.live ? (
                        <IoVideocamOutline />
                      ) : (
                        <IoCalendarOutline />
                      )}
                    </div>
                    <div className="event-info">
                      <div className="event-tag-row">
                        <span
                          className={`event-type-chip ${event.live ? "live" : ""}`}
                        >
                          {event.live && <span className="live-ping-dot" />}
                          {t(`dashboard.${event.typeKey}`) || event.tag}
                        </span>
                      </div>
                      <h3>{t(`dashboard.${event.titleKey}`)}</h3>
                      <p>
                        <IoTimeOutline aria-hidden="true" />{" "}
                        {t(`dashboard.${event.timeKey}`)}
                      </p>
                    </div>
                    <span className="join-room-btn">
                      {t("dashboard.joinLiveRoom")}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Active Skill Barter / Exchange Quick Hub */}
            <section className="dashboard-panel dashboard-exchange-panel">
              <div className="dashboard-panel-header">
                <div>
                  <span className="dashboard-kicker">
                    {t("dashboard.activeBarters")}
                  </span>
                  <h2>{t("dashboard.exchangeSkills")}</h2>
                </div>
                <Link to="/community" className="panel-header-link">
                  {t("dashboard.postSkillOffer")} <IoArrowForward />
                </Link>
              </div>

              <div className="exchange-barter-card">
                <div className="barter-swap-row">
                  <div className="barter-tag offer">
                    <small>Offering</small>
                    <strong>JavaScript / React</strong>
                  </div>
                  <div className="barter-icon-circle">
                    <IoSwapHorizontalOutline />
                  </div>
                  <div className="barter-tag need">
                    <small>Seeking</small>
                    <strong>UI/UX Figma</strong>
                  </div>
                </div>
                <p className="barter-desc">
                  Connect peer-to-peer for zero-cost reciprocal coaching in live
                  session rooms.
                </p>
                <Link to="/community" className="home-btn primary full-width">
                  <IoSwapHorizontalOutline />
                  {t("dashboard.exchangeSkills")}
                </Link>
              </div>
            </section>

            {/* Smart Career Insights & Live Activity Hub */}
            <section className="dashboard-insight-card">
              <div className="insight-header">
                <span className="insight-icon-box">
                  <IoSparklesOutline aria-hidden="true" />
                </span>
                <div>
                  <p className="insight-sub">{t("dashboard.weeklyInsight")}</p>
                  <h3>{t("dashboard.weeklyMessage")}</h3>
                </div>
              </div>

              <div className="dashboard-activity-pills">
                <Link to="/messages" className="activity-pill">
                  <IoChatbubbleEllipsesOutline />
                  <span>{t("dashboard.unread", { count: 0 })}</span>
                </Link>
                <Link to="/profile" className="activity-pill">
                  <IoRibbonOutline />
                  <span>{t("dashboard.certificates", { count: 0 })}</span>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
