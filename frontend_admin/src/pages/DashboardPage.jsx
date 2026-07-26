import { useCallback, useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  IoArrowForwardOutline,
  IoBriefcaseOutline,
  IoBusinessOutline,
  IoCheckmarkCircleOutline,
  IoPeopleOutline,
  IoRibbonOutline,
  IoShieldCheckmarkOutline,
  IoTimeOutline,
  IoTrendingUpOutline,
} from "react-icons/io5";
import {
  ErrorState,
  LoadingState,
  StatusBadge,
} from "../components/UI";
import { fetchAnalytics, fetchDashboard } from "../services/api";
import { dateTime, number, pretty } from "../utils/format";

const DashboardPage = () => {
  const { admin, refreshKey } = useOutletContext();
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboard, report] = await Promise.all([
        fetchDashboard(),
        fetchAnalytics("30d"),
      ]);
      setData(dashboard);
      setAnalytics(report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load, refreshKey]);

  if (loading && !data) return <LoadingState label="Preparing your command center…" />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;

  const summary = data?.summary || {};
  const report = analytics?.summary || {};
  const rates = analytics?.rates || {};
  const stats = [
    {
      label: "Community members",
      value: summary.users,
      detail: `${number(report.newUsers)} joined in 30 days`,
      icon: IoPeopleOutline,
      tone: "teal",
    },
    {
      label: "Pending mentors",
      value: summary.pendingMentors,
      detail: "Waiting for verification",
      icon: IoRibbonOutline,
      tone: "violet",
    },
    {
      label: "Open internships",
      value: summary.openInternships,
      detail: `${number(summary.applications)} applications`,
      icon: IoBriefcaseOutline,
      tone: "blue",
    },
    {
      label: "Pending companies",
      value: summary.pendingCompanies,
      detail: "Profiles requiring review",
      icon: IoBusinessOutline,
      tone: "orange",
    },
  ];

  const queues = [
    {
      label: "Mentor applications",
      value: summary.pendingMentors,
      text: "Review expertise and professional background.",
      to: "/reviews",
      icon: IoRibbonOutline,
      tone: "violet",
    },
    {
      label: "Company verification",
      value: summary.pendingCompanies,
      text: "Confirm recruiters before opportunities go live.",
      to: "/reviews",
      icon: IoBusinessOutline,
      tone: "orange",
    },
    {
      label: "Suspended accounts",
      value: summary.suspendedUsers,
      text: "Review account access and restoration requests.",
      to: "/users",
      icon: IoShieldCheckmarkOutline,
      tone: "rose",
    },
  ];

  return (
    <main className="admin-page">
      <section className="welcome-banner">
        <div>
          <p className="eyebrow light">Live administration overview</p>
          <h2>Good to see you, {admin.fullName?.split(" ")[0]}.</h2>
          <p>
            Your community is active. Focus on the verification queue and keep
            opportunity quality high.
          </p>
        </div>
        <div className="welcome-score">
          <span>
            <IoCheckmarkCircleOutline />
          </span>
          <div>
            <small>Platform status</small>
            <strong>Healthy</strong>
            <p>API and database connected</p>
          </div>
        </div>
      </section>

      {error && <div className="inline-alert">{error}</div>}

      <section className="stats-grid">
        {stats.map(({ label, value, detail, icon: Icon, tone }) => (
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

      <section className="dashboard-grid">
        <article className="panel growth-panel">
          <header className="panel-header">
            <div>
              <span className="panel-kicker">
                <IoTrendingUpOutline /> Growth
              </span>
              <h3>Community momentum</h3>
              <p>New members and activity over the last 30 days.</p>
            </div>
            <Link className="text-link" to="/analytics">
              Full analytics <IoArrowForwardOutline />
            </Link>
          </header>
          <div className="chart chart-large">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={analytics?.charts?.growth || []}
                margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="adminUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f8a7d" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0f8a7d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e8edf4" strokeDasharray="4 4" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0" }} />
                <Area
                  type="monotone"
                  dataKey="users"
                  name="New users"
                  stroke="#0f8a7d"
                  strokeWidth={3}
                  fill="url(#adminUsers)"
                />
                <Area
                  type="monotone"
                  dataKey="applications"
                  name="Applications"
                  stroke="#3b67e8"
                  strokeWidth={2}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="rate-row">
            {[
              ["Verification", rates.verification],
              ["Application success", rates.applicationSuccess],
              ["Exchange completion", rates.exchangeCompletion],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{number(value)}%</strong>
                <i>
                  <b style={{ width: `${Math.min(100, Number(value || 0))}%` }} />
                </i>
              </div>
            ))}
          </div>
        </article>

        <article className="panel action-panel">
          <header className="panel-header">
            <div>
              <span className="panel-kicker">
                <IoTimeOutline /> Priority
              </span>
              <h3>Review queue</h3>
              <p>Items that need an administrator decision.</p>
            </div>
          </header>
          <div className="queue-list">
            {queues.map(({ label, value, text, to, icon: Icon, tone }) => (
              <Link to={to} className="queue-item" key={label}>
                <span className={`queue-icon ${tone}`}>
                  <Icon />
                </span>
                <div>
                  <strong>{label}</strong>
                  <p>{text}</p>
                </div>
                <b>{number(value)}</b>
                <IoArrowForwardOutline />
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <span className="panel-kicker">
              <IoShieldCheckmarkOutline /> Governance
            </span>
            <h3>Recent administrator activity</h3>
            <p>Every management action is recorded for accountability.</p>
          </div>
          <Link className="text-link" to="/audit">
            View audit log <IoArrowForwardOutline />
          </Link>
        </header>
        {data?.recentActions?.length ? (
          <div className="activity-list">
            {data.recentActions.map((item) => (
              <div className="activity-item" key={item.id}>
                <span className="activity-dot" />
                <div>
                  <strong>{pretty(item.action)}</strong>
                  <p>
                    {item.adminName} · {pretty(item.entityType)}
                    {item.entityId ? ` #${item.entityId}` : ""}
                  </p>
                </div>
                <StatusBadge value="recorded" />
                <time>{dateTime(item.createdAt)}</time>
              </div>
            ))}
          </div>
        ) : (
          <div className="compact-empty">No administrator actions have been recorded yet.</div>
        )}
      </section>
    </main>
  );
};

export default DashboardPage;
