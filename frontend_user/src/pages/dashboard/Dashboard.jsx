import { Link } from "react-router-dom";
import {
  IoArrowForward,
  IoBriefcaseOutline,
  IoCalendarOutline,
  IoChatbubbleEllipsesOutline,
  IoCheckmarkCircle,
  IoCompassOutline,
  IoPeopleOutline,
  IoPersonCircleOutline,
  IoRibbonOutline,
  IoSchoolOutline,
  IoSparklesOutline,
  IoSwapHorizontalOutline,
  IoTimeOutline,
  IoTrendingUpOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { sampleCourses } from "../courses/courseData";
import "./Dashboard.css";

const upcomingEvents = [
  {
    titleKey: "eventOneTitle",
    timeKey: "eventOneTime",
    typeKey: "eventOneType",
    to: "/community",
  },
  {
    titleKey: "eventTwoTitle",
    timeKey: "eventTwoTime",
    typeKey: "eventTwoType",
    to: "/mentorship",
  },
  {
    titleKey: "eventThreeTitle",
    timeKey: "eventThreeTime",
    typeKey: "eventThreeType",
    to: "/sessions",
  },
];

const jobMatches = [
  {
    title: "Frontend Developer Intern",
    company: "Tech Corp",
    match: 92,
  },
  {
    title: "Junior UI Developer",
    company: "Growth Labs",
    match: 86,
  },
  {
    title: "Data Analyst Intern",
    company: "DataSmart",
    match: 78,
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
    kicker: "Student journey",
    title: "Your path from profile to opportunity",
    description:
      "Follow the flow like a real learning platform: complete your profile, build skills, connect with people, then apply your progress.",
    nextAction: "Recommended next action",
    continue: "Continue",
    stages: [
      {
        title: "Build profile",
        text: "Add your goal and skills so the platform can guide you better.",
        to: "/profile",
      },
      {
        title: "Learn skills",
        text: "Continue guided courses and keep your learning progress visible.",
        to: "/courses",
      },
      {
        title: "Connect",
        text: "Meet mentors and exchange practical knowledge with members.",
        to: "/mentorship",
      },
      {
        title: "Apply",
        text: "Use your progress to find internships and career opportunities.",
        to: "/jobs",
      },
    ],
  },
  km: {
    kicker: "ដំណើររបស់សិស្ស",
    title: "ផ្លូវពី Profile ទៅកាន់ឱកាសអាជីព",
    description:
      "ធ្វើតាម flow ដូចវេបសាយសិក្សាពិត៖ បំពេញ Profile កសាងជំនាញ ភ្ជាប់ទំនាក់ទំនង បន្ទាប់មកយកវឌ្ឍនភាពទៅប្រើសម្រាប់ឱកាសការងារ។",
    nextAction: "ជំហានបន្ទាប់ដែលណែនាំ",
    continue: "បន្ត",
    stages: [
      {
        title: "បង្កើត Profile",
        text: "បន្ថែមគោលដៅ និងជំនាញ ដើម្បីឲ្យវេបសាយណែនាំអ្នកបានល្អជាងមុន។",
        to: "/profile",
      },
      {
        title: "រៀនជំនាញ",
        text: "បន្តវគ្គសិក្សាដែលមានការណែនាំ និងធ្វើឲ្យវឌ្ឍនភាពសិក្សាមើលឃើញច្បាស់។",
        to: "/courses",
      },
      {
        title: "ភ្ជាប់ទំនាក់ទំនង",
        text: "ជួបអ្នកណែនាំ និងប្ដូរចំណេះដឹងអនុវត្តជាមួយសមាជិកផ្សេងៗ។",
        to: "/mentorship",
      },
      {
        title: "ដាក់ពាក្យ",
        text: "ប្រើវឌ្ឍនភាពរបស់អ្នកដើម្បីស្វែងរកឱកាសហាត់ការ និងឱកាសអាជីព។",
        to: "/jobs",
      },
    ],
  },
};

const DashboardStat = ({ icon: Icon, label, value, detail, tone, to }) => (
  <Link className={`dashboard-stat ${tone}`} to={to}>
    <span className="dashboard-stat-icon">
      <Icon aria-hidden="true" />
    </span>
    <span className="dashboard-stat-copy">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </span>
    <IoArrowForward className="dashboard-stat-arrow" aria-hidden="true" />
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
    user.fullName?.trim().split(/\s+/)[0] || user.email?.split("@")[0] || "there";
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
  const nextJourneyIndex = journeyProgress.findIndex((isComplete) => !isComplete);
  const activeJourneyIndex =
    nextJourneyIndex === -1 ? journey.stages.length - 1 : nextJourneyIndex;
  const activeJourneyStage = journey.stages[activeJourneyIndex];
  const formattedDate = new Intl.DateTimeFormat(
    language === "km" ? "km-KH" : "en",
    {
    weekday: "long",
    month: "long",
    day: "numeric",
    },
  ).format(new Date());
  const roleLabel = t(`profile.${role}`);

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div className="container dashboard-hero-inner">
          <div className="dashboard-welcome">
            <div className="dashboard-context">
              <span>{t("dashboard.workspace", { role: roleLabel })}</span>
              <span>{formattedDate}</span>
            </div>
            <h1>{t("dashboard.greeting", { name: firstName })}</h1>
            <p>{t("dashboard.intro")}</p>
            <div className="dashboard-actions">
              <Link className="btn primary" to="/courses">
                {t("dashboard.continueLearning")} <IoArrowForward />
              </Link>
              <Link className="btn dashboard-ghost-button" to="/discover">
                {t("dashboard.discoverPeople")}
              </Link>
              {role === "admin" && (
                <Link className="btn dashboard-ghost-button" to="/admin">
                  {t("common.adminPanel")}
                </Link>
              )}
            </div>
          </div>

          <aside
            className="dashboard-readiness"
            aria-label={t("dashboard.readinessLabel")}
          >
            <div className="dashboard-readiness-heading">
              <span>
                <IoPersonCircleOutline aria-hidden="true" />
              </span>
              <div>
                <p>{t("dashboard.readinessLabel")}</p>
                <strong>
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
            <p>{t("dashboard.readinessDescription")}</p>
            <Link to="/profile">
              {t("dashboard.improveProfile")}{" "}
              <IoArrowForward aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </section>

      <div className="container dashboard-content">
        <section
          className="dashboard-stats"
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
            tone="green"
            to="/profile"
          />
          <DashboardStat
            icon={IoSwapHorizontalOutline}
            label={t("dashboard.skillGoals")}
            value={skillTotal}
            detail={t("dashboard.skillGoalsDetail")}
            tone="blue"
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

        <section className="dashboard-section dashboard-journey-section">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-kicker">{journey.kicker}</span>
              <h2>{journey.title}</h2>
            </div>
            <p>{journey.description}</p>
          </div>

          <div className="dashboard-journey-layout">
            <div
              className="dashboard-journey-track"
              aria-label={journey.title}
            >
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
                    <div>
                      <h3>{stage.title}</h3>
                      <p>{stage.text}</p>
                    </div>
                  </Link>
                );
              })}
            </div>

            <aside className="dashboard-next-action">
              <span>
                <IoSparklesOutline />
                {journey.nextAction}
              </span>
              <h3>{activeJourneyStage.title}</h3>
              <p>{activeJourneyStage.text}</p>
              <Link className="btn primary small" to={activeJourneyStage.to}>
                {journey.continue} <IoArrowForward />
              </Link>
            </aside>
          </div>
        </section>

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
                <Link className={`dashboard-quick-card ${tone}`} to={to} key={to}>
                  <span>
                    <Icon aria-hidden="true" />
                  </span>
                  <div>
                    <h3>{t(`dashboard.${titleKey}`)}</h3>
                    <p>{t(`dashboard.${descriptionKey}`)}</p>
                  </div>
                  <IoArrowForward aria-hidden="true" />
                </Link>
              ),
            )}
          </div>
        </section>

        <div className="dashboard-layout">
          <section className="dashboard-panel dashboard-learning-panel">
            <div className="dashboard-panel-header">
              <div>
                <span className="dashboard-kicker">
                  {t("dashboard.learning")}
                </span>
                <h2>{t("dashboard.continueTitle")}</h2>
                <p>{t("dashboard.continueDescription")}</p>
              </div>
              <Link to="/courses">
                {t("dashboard.allCourses")} <IoArrowForward />
              </Link>
            </div>

            <div className="dashboard-course-list">
              {sampleCourses.map((course, index) => (
                <Link
                  className="dashboard-course"
                  to={`/courses/${course.id}`}
                  key={course.id}
                >
                  <span className="dashboard-course-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="dashboard-course-copy">
                    <span>{course.category}</span>
                    <h3>{course.title}</h3>
                    <p>
                      {course.mentor} · {course.duration}
                    </p>
                  </div>
                  <div className="dashboard-progress">
                    <span>
                      <strong>{course.progress}%</strong>
                      <small>{t("common.complete")}</small>
                    </span>
                    <div
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
                  <IoArrowForward className="dashboard-row-arrow" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>

          <section className="dashboard-panel dashboard-events-panel">
            <div className="dashboard-panel-header">
              <div>
                <span className="dashboard-kicker">
                  {t("dashboard.schedule")}
                </span>
                <h2>{t("dashboard.comingUp")}</h2>
                <p>{t("dashboard.scheduleDescription")}</p>
              </div>
              <Link to="/sessions" aria-label={t("dashboard.viewSessions")}>
                {t("common.viewAll")}
              </Link>
            </div>

            <div className="dashboard-event-list">
              {upcomingEvents.map((event) => (
                <Link to={event.to} key={event.titleKey}>
                  <span className="dashboard-event-icon">
                    <IoCalendarOutline aria-hidden="true" />
                  </span>
                  <div>
                    <span>{t(`dashboard.${event.typeKey}`)}</span>
                    <h3>{t(`dashboard.${event.titleKey}`)}</h3>
                    <p>
                      <IoTimeOutline aria-hidden="true" />{" "}
                      {t(`dashboard.${event.timeKey}`)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="dashboard-panel dashboard-roadmap-panel">
            <div className="dashboard-panel-header">
              <div>
                <span className="dashboard-kicker">
                  {t("dashboard.careerFocus")}
                </span>
                <h2>{t("dashboard.milestonesTitle")}</h2>
                <p>{t("dashboard.milestonesDescription")}</p>
              </div>
              <Link to="/career">
                {t("dashboard.fullRoadmap")} <IoArrowForward />
              </Link>
            </div>

            <div className="dashboard-roadmap-list">
              {roadmapSteps.map((stepKey, index) => {
                const isComplete = index < completedRoadmapSteps;
                return (
                  <article
                    className={isComplete ? "complete" : ""}
                    key={stepKey}
                  >
                    <span>
                      {isComplete ? (
                        <IoCheckmarkCircle aria-hidden="true" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <div>
                      <small>
                        {t("common.step", { number: index + 1 })}
                      </small>
                      <p>{t(`dashboard.${stepKey}`)}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="dashboard-panel dashboard-jobs-panel">
            <div className="dashboard-panel-header">
              <div>
                <span className="dashboard-kicker">
                  {t("dashboard.opportunities")}
                </span>
                <h2>{t("dashboard.recommended")}</h2>
                <p>{t("dashboard.recommendedDescription")}</p>
              </div>
              <Link to="/jobs">{t("dashboard.viewJobs")}</Link>
            </div>

            <div className="dashboard-job-list">
              {jobMatches.map((job) => (
                <Link to="/jobs" key={`${job.company}-${job.title}`}>
                  <span className="dashboard-job-icon">
                    <IoBriefcaseOutline aria-hidden="true" />
                  </span>
                  <div>
                    <h3>{job.title}</h3>
                    <p>{job.company}</p>
                  </div>
                  <strong>
                    {t("dashboard.match", { percent: job.match })}
                  </strong>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className="dashboard-insight">
          <span>
            <IoSparklesOutline aria-hidden="true" />
          </span>
          <div>
            <p>{t("dashboard.weeklyInsight")}</p>
            <h2>{t("dashboard.weeklyMessage")}</h2>
          </div>
          <div className="dashboard-activity-pills">
            <span>
              <IoChatbubbleEllipsesOutline />{" "}
              {t("dashboard.unread", { count: 0 })}
            </span>
            <span>
              <IoRibbonOutline />{" "}
              {t("dashboard.certificates", { count: 0 })}
            </span>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Dashboard;
