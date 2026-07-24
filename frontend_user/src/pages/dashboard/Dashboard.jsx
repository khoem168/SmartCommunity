import { Link } from "react-router-dom";
import {
  IoBriefcaseOutline,
  IoCalendarOutline,
  IoChatbubbleEllipsesOutline,
  IoCheckmarkCircleOutline,
  IoRibbonOutline,
  IoSchoolOutline,
  IoSwapHorizontalOutline,
  IoTrendingUpOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import { sampleCourses } from "../courses/courseData";
import "./Dashboard.css";

const upcomingEvents = [
  {
    title: "React skill exchange session",
    time: "Today, 7:00 PM",
    type: "Skill Exchange",
  },
  {
    title: "Career roadmap mentorship",
    time: "Tomorrow, 5:30 PM",
    type: "Mentorship",
  },
  {
    title: "Internship interview workshop",
    time: "Friday, 3:00 PM",
    type: "Career",
  },
];

const jobMatches = [
  {
    title: "Frontend Developer Intern",
    company: "Tech Corp",
    match: "92%",
  },
  {
    title: "Junior UI Developer",
    company: "Growth Labs",
    match: "86%",
  },
  {
    title: "Data Analyst Intern",
    company: "DataSmart",
    match: "78%",
  },
];

const roadmapSteps = [
  "Complete one focused course",
  "Create or accept a skill exchange",
  "Book one mentorship session",
  "Apply to matched internships",
];

const DashboardCard = ({ icon: Icon, label, value, tone = "" }) => (
  <article className={`dashboard-stat ${tone}`}>
    <Icon aria-hidden="true" />
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  </article>
);

const Dashboard = () => {
  const { user } = useGlobleContext();

  if (!user) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-empty container">
          <h1>Create an account to open your dashboard.</h1>
          <p>
            Your dashboard tracks learning progress, skill exchange requests,
            mentorship, job matches, and career growth.
          </p>
          <Link className="btn primary" to="/register">
            Create account
          </Link>
        </section>
      </main>
    );
  }

  const skillsToTeach = user.skillsToTeach || [];
  const skillsToLearn = user.skillsToLearn || [];
  const candidateSkills = user.candidateSkills || [];
  const skillTotal =
    user.role === "recruiter"
      ? candidateSkills.length
      : skillsToTeach.length + skillsToLearn.length;
  const learningProgress = Math.min(100, 35 + skillTotal * 8);
  const skillScore = Math.min(100, 50 + skillTotal * 7);

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div className="container dashboard-hero-inner">
          <div>
            <p className="dashboard-role">{user.role} workspace</p>
            <h1>Welcome back, {user.fullName || user.email}</h1>
            <p>
              Your learning, mentorship, exchanges, and career progress are
              organized in one focused workspace.
            </p>
          </div>
          <div className="dashboard-actions">
            {user.role === "admin" && (
              <>
                <Link className="btn outline" to="/admin">
                  Admin panel
                </Link>
                <Link className="btn outline" to="/analytics">
                  Platform analytics
                </Link>
              </>
            )}
            <Link className="btn outline" to="/discover">
              Discover skills
            </Link>
            <Link className="btn primary" to="/profile">
              Update profile
            </Link>
          </div>
        </div>
      </section>

      <section className="section container dashboard-grid">
        <div className="dashboard-stats">
          <DashboardCard
            icon={IoSchoolOutline}
            label="Learning progress"
            value={`${learningProgress}%`}
          />
          <DashboardCard
            icon={IoTrendingUpOutline}
            label="Skill score"
            value={`${skillScore}/100`}
            tone="green"
          />
          <DashboardCard
            icon={IoSwapHorizontalOutline}
            label="Skill goals"
            value={skillTotal}
            tone="blue"
          />
          <DashboardCard
            icon={IoBriefcaseOutline}
            label="Job matches"
            value={jobMatches.length}
            tone="amber"
          />
        </div>

        <section className="dashboard-panel dashboard-wide">
          <div className="dashboard-panel-header">
            <div>
              <h2>Recommended courses</h2>
              <p>Continue courses that match your skill direction.</p>
            </div>
            <Link to="/courses">View courses</Link>
          </div>

          <div className="dashboard-course-list">
            {sampleCourses.map((course) => (
              <article className="dashboard-course" key={course.id}>
                <div>
                  <span>{course.category}</span>
                  <h3>{course.title}</h3>
                  <p>{course.mentor}</p>
                </div>
                <div className="dashboard-progress">
                  <strong>{course.progress}%</strong>
                  <div>
                    <span style={{ width: `${course.progress}%` }} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Upcoming events</h2>
              <p>Sessions and career activities.</p>
            </div>
          </div>

          <div className="dashboard-list">
            {upcomingEvents.map((event) => (
              <article key={event.title}>
                <IoCalendarOutline aria-hidden="true" />
                <div>
                  <h3>{event.title}</h3>
                  <p>{event.type} · {event.time}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Job matches</h2>
              <p>Opportunities aligned with your profile.</p>
            </div>
            <Link to="/jobs">View jobs</Link>
          </div>

          <div className="dashboard-list">
            {jobMatches.map((job) => (
              <article key={`${job.company}-${job.title}`}>
                <IoBriefcaseOutline aria-hidden="true" />
                <div>
                  <h3>{job.title}</h3>
                  <p>{job.company} · {job.match} match</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Career roadmap</h2>
              <p>Next steps for steady progress.</p>
            </div>
          </div>

          <div className="roadmap-list">
            {roadmapSteps.map((step, index) => (
              <article key={step}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Activity summary</h2>
              <p>Your platform movement.</p>
            </div>
          </div>

          <div className="mini-activity-grid">
            <div>
              <IoChatbubbleEllipsesOutline aria-hidden="true" />
              <strong>0</strong>
              <span>Unread messages</span>
            </div>
            <div>
              <IoRibbonOutline aria-hidden="true" />
              <strong>0</strong>
              <span>Certificates</span>
            </div>
            <div>
              <IoCheckmarkCircleOutline aria-hidden="true" />
              <strong>0</strong>
              <span>Completed tasks</span>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
};

export default Dashboard;
