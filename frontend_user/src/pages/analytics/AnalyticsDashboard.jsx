import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  IoBriefcaseOutline,
  IoCalendarOutline,
  IoDocumentTextOutline,
  IoPeopleOutline,
  IoPersonAddOutline,
  IoRibbonOutline,
  IoStatsChartOutline,
  IoSwapHorizontalOutline,
  IoTrendingUpOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import { fetchAdminAnalytics } from "../../services/analyticsService";
import "./AnalyticsDashboard.css";

const colors = [
  "#0f766e",
  "#2563eb",
  "#7c3aed",
  "#ea580c",
  "#16a34a",
  "#dc2626",
];
const ranges = [
  ["7d", "Last 7 days"],
  ["30d", "Last 30 days"],
  ["90d", "Last 90 days"],
  ["12m", "Last 12 months"],
];

const number = (value) => new Intl.NumberFormat().format(Number(value || 0));
const capitalize = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const StatCard = ({ icon: Icon, label, value, detail, tone }) => (
  <article className={`analytics-stat ${tone || ""}`}>
    <span>
      <Icon />
    </span>
    <div>
      <small>{label}</small>
      <strong>{number(value)}</strong>
      <p>{detail}</p>
    </div>
  </article>
);

const EmptyChart = ({ message = "No data is available yet." }) => (
  <div className="analytics-empty-chart">{message}</div>
);

const AnalyticsDashboard = () => {
  const { user } = useGlobleContext();
  const [range, setRange] = useState("30d");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    if (user?.role !== "admin") return;
    try {
      setLoading(true);
      setAnalytics(await fetchAdminAnalytics(range));
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load platform analytics.");
    } finally {
      setLoading(false);
    }
  }, [user, range]);

  useEffect(() => {
    Promise.resolve()
      .then(loadAnalytics)
      .catch(() => undefined);
  }, [loadAnalytics]);

  const roleData = useMemo(
    () =>
      (analytics?.charts?.roles || []).map((item) => ({
        ...item,
        name: capitalize(item.name),
      })),
    [analytics],
  );
  const applicationData = useMemo(
    () =>
      (analytics?.charts?.applicationStatuses || []).map((item) => ({
        ...item,
        name: capitalize(item.name),
      })),
    [analytics],
  );

  if (!user) {
    return (
      <main className="analytics-access-state">
        <IoStatsChartOutline size={54} />
        <h1>Login to open analytics</h1>
        <Link className="btn primary" to="/login">
          Login
        </Link>
      </main>
    );
  }
  if (user.role !== "admin") {
    return (
      <main className="analytics-access-state">
        <IoStatsChartOutline size={54} />
        <h1>Administrator access required</h1>
        <p>
          Platform-wide user and business statistics are restricted to
          administrators.
        </p>
        <Link className="btn outline" to="/dashboard">
          Back to dashboard
        </Link>
      </main>
    );
  }

  const summary = analytics?.summary || {};
  const rates = analytics?.rates || {};

  return (
    <main className="analytics-page">
      <section className="analytics-hero">
        <div className="container analytics-hero-inner">
          <div>
            <p className="eyebrow">Administration analytics</p>
            <h1>Understand how the community is growing.</h1>
            <p>
              Live reporting across users, skills, mentors, internships,
              applications, exchanges, and learning sessions.
            </p>
          </div>
          <div className="analytics-controls">
            <label>
              Reporting range
              <select
                value={range}
                onChange={(event) => setRange(event.target.value)}
              >
                {ranges.map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="btn outline"
              type="button"
              onClick={() => window.print()}
            >
              <IoDocumentTextOutline /> Print report
            </button>
          </div>
        </div>
      </section>

      <section className="section container analytics-content">
        {error && <div className="analytics-error">{error}</div>}
        {loading && !analytics ? (
          <div className="analytics-loading">
            Calculating platform analytics…
          </div>
        ) : (
          <>
            <div className="analytics-stats-grid">
              <StatCard
                icon={IoPeopleOutline}
                label="Total users"
                value={summary.totalUsers}
                detail={`+${number(summary.newUsers)} in this range`}
              />
              <StatCard
                icon={IoRibbonOutline}
                label="Verified mentors"
                value={summary.totalMentors}
                detail={`${number(summary.totalStudents)} learners`}
                tone="purple"
              />
              <StatCard
                icon={IoBriefcaseOutline}
                label="Internships"
                value={summary.totalInternships}
                detail={`${number(summary.openInternships)} currently open`}
                tone="orange"
              />
              <StatCard
                icon={IoPersonAddOutline}
                label="Applications"
                value={summary.totalApplications}
                detail={`+${number(summary.newApplications)} in this range`}
                tone="blue"
              />
              <StatCard
                icon={IoSwapHorizontalOutline}
                label="Skill exchanges"
                value={summary.totalExchanges}
                detail={`${number(summary.completedExchanges)} completed`}
                tone="green"
              />
              <StatCard
                icon={IoCalendarOutline}
                label="Learning sessions"
                value={summary.totalSessions}
                detail={`${number(summary.registrations)} registrations`}
                tone="rose"
              />
              <StatCard
                icon={IoStatsChartOutline}
                label="Forum posts"
                value={summary.forumPosts}
                detail="Published discussions"
                tone="cyan"
              />
              <StatCard
                icon={IoTrendingUpOutline}
                label="Messages sent"
                value={summary.messages}
                detail="Community conversations"
                tone="indigo"
              />
            </div>

            <section className="analytics-panel analytics-growth-panel">
              <div className="analytics-panel-header">
                <div>
                  <h2>Platform growth</h2>
                  <p>New users and key actions during the selected period.</p>
                </div>
              </div>
              <div className="analytics-chart tall">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={analytics?.charts?.growth || []}
                    margin={{ top: 10, right: 20, left: -15, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="usersGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#0f766e"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#0f766e"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#0f766e"
                      fill="url(#usersGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="applications"
                      stroke="#2563eb"
                      fill="transparent"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="exchanges"
                      stroke="#7c3aed"
                      fill="transparent"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="sessions"
                      stroke="#ea580c"
                      fill="transparent"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <div className="analytics-two-column">
              <section className="analytics-panel">
                <div className="analytics-panel-header">
                  <div>
                    <h2>User roles</h2>
                    <p>Active community composition.</p>
                  </div>
                </div>
                <div className="analytics-chart">
                  {roleData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={roleData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={62}
                          outerRadius={100}
                          paddingAngle={3}
                        >
                          {roleData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={colors[index % colors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart />
                  )}
                </div>
              </section>

              <section className="analytics-panel">
                <div className="analytics-panel-header">
                  <div>
                    <h2>Application pipeline</h2>
                    <p>Current internship application outcomes.</p>
                  </div>
                </div>
                <div className="analytics-chart">
                  {applicationData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={applicationData} margin={{ left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          name="Applications"
                          fill="#2563eb"
                          radius={[7, 7, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart message="No internship applications yet." />
                  )}
                </div>
              </section>
            </div>

            <div className="analytics-rate-grid">
              {[
                [
                  "Verified users",
                  rates.verification,
                  "Profiles with verified email",
                ],
                [
                  "Application success",
                  rates.applicationSuccess,
                  "Approved or accepted",
                ],
                [
                  "Exchange completion",
                  rates.exchangeCompletion,
                  "Skill exchanges completed",
                ],
                [
                  "Session attendance",
                  rates.sessionAttendance,
                  "Registrations that attended",
                ],
              ].map(([label, value, description]) => (
                <article key={label}>
                  <div
                    className="rate-ring"
                    style={{
                      "--rate": `${Math.min(100, Number(value || 0)) * 3.6}deg`,
                    }}
                  >
                    <span>{value || 0}%</span>
                  </div>
                  <div>
                    <strong>{label}</strong>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="analytics-two-column">
              <section className="analytics-panel">
                <div className="analytics-panel-header">
                  <div>
                    <h2>Popular skills</h2>
                    <p>Most common teach, learn, and candidate skills.</p>
                  </div>
                </div>
                <div className="analytics-chart">
                  {analytics?.charts?.popularSkills?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.charts.popularSkills.slice(0, 8)}
                        layout="vertical"
                        margin={{ left: 30 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                        />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="skill"
                          width={95}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="users"
                          name="Users"
                          fill="#0f766e"
                          radius={[0, 7, 7, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart message="Users have not added profile skills yet." />
                  )}
                </div>
              </section>

              <section className="analytics-panel">
                <div className="analytics-panel-header">
                  <div>
                    <h2>Internship status</h2>
                    <p>Availability across all postings.</p>
                  </div>
                </div>
                <div className="analytics-chart">
                  {analytics?.charts?.internshipStatuses?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.charts.internshipStatuses}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={105}
                          label={({ name, value }) =>
                            `${capitalize(name)}: ${value}`
                          }
                        >
                          {analytics.charts.internshipStatuses.map(
                            (entry, index) => (
                              <Cell
                                key={entry.name}
                                fill={colors[index % colors.length]}
                              />
                            ),
                          )}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart message="No internships have been posted." />
                  )}
                </div>
              </section>
            </div>

            <div className="analytics-two-column analytics-tables">
              <section className="analytics-panel">
                <div className="analytics-panel-header">
                  <div>
                    <h2>Top internships</h2>
                    <p>Postings ranked by applications.</p>
                  </div>
                </div>
                <div className="analytics-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Internship</th>
                        <th>Applications</th>
                        <th>Success</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analytics?.tables?.topInternships || []).map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.title}</strong>
                            <small>{item.company}</small>
                          </td>
                          <td>{item.applications}</td>
                          <td>{item.successful}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="analytics-panel">
                <div className="analytics-panel-header">
                  <div>
                    <h2>Mentor performance</h2>
                    <p>Ratings and mentorship activity.</p>
                  </div>
                </div>
                <div className="analytics-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Mentor</th>
                        <th>Bookings</th>
                        <th>Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analytics?.tables?.mentorPerformance || []).map(
                        (item) => (
                          <tr key={item.id}>
                            <td>
                              <strong>{item.name}</strong>
                              <small>
                                {item.profession || "Community mentor"}
                              </small>
                            </td>
                            <td>{item.mentorships}</td>
                            <td>{item.rating ? `${item.rating}/5` : "—"}</td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <section className="analytics-panel">
              <div className="analytics-panel-header">
                <div>
                  <h2>Recent platform activity</h2>
                  <p>The latest important events across the community.</p>
                </div>
              </div>
              <div className="analytics-activity-list">
                {(analytics?.tables?.recentActivity || []).map(
                  (item, index) => (
                    <article key={`${item.type}-${item.createdAt}-${index}`}>
                      <span>{index + 1}</span>
                      <div>
                        <strong>{item.label}</strong>
                        <small>
                          {capitalize(item.type)} ·{" "}
                          {new Date(item.createdAt).toLocaleString()}
                        </small>
                      </div>
                    </article>
                  ),
                )}
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
};

export default AnalyticsDashboard;
