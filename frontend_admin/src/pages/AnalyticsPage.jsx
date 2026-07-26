import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
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
  IoPeopleOutline,
  IoRibbonOutline,
  IoStatsChartOutline,
  IoSwapHorizontalOutline,
} from "react-icons/io5";
import {
  ErrorState,
  LoadingState,
  StatusBadge,
} from "../components/UI";
import { fetchAnalytics } from "../services/api";
import { number, pretty } from "../utils/format";

const colors = ["#0f8a7d", "#3b67e8", "#7c4ee4", "#f59e0b", "#e25572", "#16a66a"];

const AnalyticsPage = () => {
  const { refreshKey } = useOutletContext();
  const [range, setRange] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await fetchAnalytics(range));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load, refreshKey]);

  const roleData = useMemo(
    () =>
      (data?.charts?.roles || []).map((item) => ({
        ...item,
        name: pretty(item.name),
      })),
    [data],
  );
  const applicationData = useMemo(
    () =>
      (data?.charts?.applicationStatuses || []).map((item) => ({
        ...item,
        name: pretty(item.name),
      })),
    [data],
  );

  if (loading && !data) return <LoadingState label="Calculating platform analytics…" />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;

  const summary = data?.summary || {};
  const rates = data?.rates || {};
  const stats = [
    ["Total users", summary.totalUsers, `${number(summary.newUsers)} new`, IoPeopleOutline, "teal"],
    ["Verified mentors", summary.totalMentors, `${number(summary.totalStudents)} students`, IoRibbonOutline, "violet"],
    ["Internships", summary.totalInternships, `${number(summary.openInternships)} open`, IoBriefcaseOutline, "blue"],
    ["Applications", summary.totalApplications, `${number(summary.newApplications)} new`, IoStatsChartOutline, "orange"],
    ["Skill exchanges", summary.totalExchanges, `${number(summary.completedExchanges)} completed`, IoSwapHorizontalOutline, "rose"],
    ["Learning sessions", summary.totalSessions, `${number(summary.registrations)} registrations`, IoCalendarOutline, "green"],
  ];

  return (
    <main className="admin-page">
      <section className="section-heading analytics-heading">
        <div>
          <p className="eyebrow">Decision intelligence</p>
          <h2>Measure platform outcomes</h2>
          <p>
            Explore community growth, learning engagement, mentorship, and
            internship performance using live database metrics.
          </p>
        </div>
        <label className="range-control">
          <span>Reporting period</span>
          <select value={range} onChange={(event) => setRange(event.target.value)}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="12m">Last 12 months</option>
          </select>
        </label>
      </section>

      {error && <div className="inline-alert">{error}</div>}

      <section className="stats-grid analytics-stats">
        {stats.map(([label, value, detail, Icon, tone]) => (
          <article className="stat-card" key={label}>
            <span className={`stat-icon ${tone}`}>
              <Icon />
            </span>
            <div>
              <small>{label}</small>
              <strong>{number(value)}</strong>
              <p>{detail}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <span className="panel-kicker">Growth trend</span>
            <h3>Community activity over time</h3>
            <p>Compare new users, internship applications, exchanges, and sessions.</p>
          </div>
        </header>
        <div className="chart analytics-main-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data?.charts?.growth || []}
              margin={{ top: 10, right: 16, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="growthUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f8a7d" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="#0f8a7d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#e7edf5" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0" }} />
              <Legend />
              <Area type="monotone" dataKey="users" stroke="#0f8a7d" strokeWidth={3} fill="url(#growthUsers)" />
              <Area type="monotone" dataKey="applications" stroke="#3b67e8" strokeWidth={2} fill="transparent" />
              <Area type="monotone" dataKey="exchanges" stroke="#7c4ee4" strokeWidth={2} fill="transparent" />
              <Area type="monotone" dataKey="sessions" stroke="#f59e0b" strokeWidth={2} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="analytics-grid">
        <article className="panel">
          <header className="panel-header">
            <div>
              <h3>Community composition</h3>
              <p>Current active roles across the platform.</p>
            </div>
          </header>
          <div className="chart donut-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={98}
                  paddingAngle={3}
                >
                  {roleData.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="panel">
          <header className="panel-header">
            <div>
              <h3>Application pipeline</h3>
              <p>Current internship application outcomes.</p>
            </div>
          </header>
          <div className="chart donut-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={applicationData} margin={{ left: -20 }}>
                <CartesianGrid vertical={false} strokeDasharray="4 4" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Applications" fill="#3b67e8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="rate-cards">
        {[
          ["Verified community", rates.verification, "Users with confirmed email identities"],
          ["Application success", rates.applicationSuccess, "Approved internship applications"],
          ["Exchange completion", rates.exchangeCompletion, "Skill exchanges completed together"],
          ["Session attendance", rates.sessionAttendance, "Registered learners who attended"],
        ].map(([label, value, description]) => (
          <article key={label}>
            <div>
              <span>{label}</span>
              <strong>{number(value)}%</strong>
            </div>
            <i>
              <b style={{ width: `${Math.min(100, Number(value || 0))}%` }} />
            </i>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <section className="analytics-grid data-lists">
        <article className="panel">
          <header className="panel-header">
            <div>
              <h3>Top internships</h3>
              <p>Opportunities attracting the most learners.</p>
            </div>
          </header>
          <div className="rank-list">
            {(data?.tables?.topInternships || []).length ? (
              data.tables.topInternships.map((item, index) => (
                <div key={item.id}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.company}</small>
                  </div>
                  <p>
                    <b>{number(item.applications)}</b> applications
                  </p>
                  <StatusBadge value={item.status} />
                </div>
              ))
            ) : (
              <p className="compact-empty">No internship performance data yet.</p>
            )}
          </div>
        </article>
        <article className="panel">
          <header className="panel-header">
            <div>
              <h3>Mentor performance</h3>
              <p>Community feedback and completed mentorships.</p>
            </div>
          </header>
          <div className="rank-list">
            {(data?.tables?.mentorPerformance || []).length ? (
              data.tables.mentorPerformance.map((item, index) => (
                <div key={item.id}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.professionalTitle || "Community mentor"}</small>
                  </div>
                  <p>
                    <b>{Number(item.rating || 0).toFixed(1)}</b> rating
                  </p>
                  <span className="role-chip">{number(item.mentorships)} sessions</span>
                </div>
              ))
            ) : (
              <p className="compact-empty">No mentor performance data yet.</p>
            )}
          </div>
        </article>
      </section>
    </main>
  );
};

export default AnalyticsPage;
