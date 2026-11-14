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
import { useLanguage } from "../../context/LanguageContext";
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
  ["7d", "Last 7 days", "7 ថ្ងៃចុងក្រោយ"],
  ["30d", "Last 30 days", "30 ថ្ងៃចុងក្រោយ"],
  ["90d", "Last 90 days", "90 ថ្ងៃចុងក្រោយ"],
  ["12m", "Last 12 months", "12 ខែចុងក្រោយ"],
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
  const { language } = useLanguage();
  const isKm = language === "km";
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
      (analytics?.charts?.roles || []).map((item) => {
        const key = String(item.name || "").toLowerCase();
        const kmMap = {
          student: "សិស្ស/និស្សិត",
          user: "សិស្ស/និស្សិត",
          mentor: "អ្នកណែនាំ",
          recruiter: "អ្នកជ្រើសរើសបុគ្គលិក",
          admin: "អ្នកគ្រប់គ្រង",
        };
        return {
          ...item,
          name: isKm ? kmMap[key] || capitalize(item.name) : capitalize(item.name),
        };
      }),
    [analytics, isKm],
  );
  const applicationData = useMemo(
    () =>
      (analytics?.charts?.applicationStatuses || []).map((item) => {
        const key = String(item.name || "").toLowerCase();
        const kmMap = {
          pending: "កំពុងរង់ចាំ",
          reviewed: "បានពិនិត្យ",
          shortlisted: "ជាប់បញ្ជីសម្រាំង",
          approved: "បានអនុម័ត",
          accepted: "បានទទួលយក",
          rejected: "បានបដិសេធ",
        };
        return {
          ...item,
          name: isKm ? kmMap[key] || capitalize(item.name) : capitalize(item.name),
        };
      }),
    [analytics, isKm],
  );
  const internshipStatusData = useMemo(
    () =>
      (analytics?.charts?.internshipStatuses || []).map((item) => {
        const key = String(item.name || "").toLowerCase();
        const kmMap = {
          open: "កំពុងបើកទទួលពាក្យ",
          filled: "ពេញចំនួន",
          closed: "បានបិទ",
        };
        return {
          ...item,
          name: isKm ? kmMap[key] || capitalize(item.name) : capitalize(item.name),
        };
      }),
    [analytics, isKm],
  );

  const formatActivityType = (rawType) => {
    const key = String(rawType || "").toLowerCase();
    if (!isKm) return capitalize(rawType);
    const map = {
      user: "សមាជិកថ្មី",
      internship: "ឱកាសកម្មសិក្សា",
      application: "ពាក្យស្នើសុំការងារ",
      skill_exchange: "ការផ្លាស់ប្តូរជំនាញ",
      session: "ថ្នាក់រៀនផ្ទាល់",
    };
    return map[key] || capitalize(rawType);
  };

  const formatActivityLabel = (rawLabel, rawType) => {
    const text = String(rawLabel || "");
    if (!isKm) return text;
    if (text.endsWith(" joined the community")) {
      return `${text.replace(" joined the community", "")} បានចូលរួមក្នុងសហគមន៍`;
    }
    if (text.startsWith("Application submitted for ")) {
      return `បានដាក់ពាក្យស្នើសុំការងារ៖ ${text.replace("Application submitted for ", "")}`;
    }
    if (text.startsWith("Learning session: ")) {
      return `ថ្នាក់រៀនផ្ទាល់៖ ${text.replace("Learning session: ", "")}`;
    }
    if (rawType === "internship" && text.includes(" published ")) {
      const [comp, role] = text.split(" published ");
      return `${comp} បានបង្ហោះជ្រើសរើស ${role}`;
    }
    if (rawType === "skill_exchange" && text.includes(" for ")) {
      const [offered, requested] = text.split(" for ");
      return `ប្តូរជំនាញ៖ ${offered} ជាមួយ ${requested}`;
    }
    return text;
  };

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
            <p className="eyebrow">
              {isKm ? "ទិន្នន័យវិភាគប្រព័ន្ធ" : "Administration analytics"}
            </p>
            <h1>
              {isKm
                ? "តាមដានការរីកចម្រើននៃសហគមន៍សិក្សា និងអាជីព"
                : "Understand how the community is growing."}
            </h1>
            <p>
              {isKm
                ? "របាយការណ៍ទិន្នន័យផ្ទាល់អំពីអ្នកប្រើប្រាស់ ជំនាញ អ្នកណែនាំ ឱកាសកម្មសិក្សា ពាក្យស្នើសុំការងារ ការផ្លាស់ប្តូរជំនាញ និងថ្នាក់រៀនផ្ទាល់។"
                : "Live reporting across users, skills, mentors, internships, applications, exchanges, and learning sessions."}
            </p>
          </div>
          <div className="analytics-controls">
            <label>
              {isKm ? "រយៈពេលរបាយការណ៍" : "Reporting range"}
              <select
                value={range}
                onChange={(event) => setRange(event.target.value)}
              >
                {ranges.map(([value, label, labelKm]) => (
                  <option value={value} key={value}>
                    {isKm ? labelKm || label : label}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="btn outline"
              type="button"
              onClick={() => window.print()}
            >
              <IoDocumentTextOutline /> {isKm ? "បោះពុម្ពរបាយការណ៍" : "Print report"}
            </button>
          </div>
        </div>
      </section>

      <section className="section container analytics-content">
        {error && <div className="analytics-error">{error}</div>}
        {loading && !analytics ? (
          <div className="analytics-loading">
            {isKm ? "កំពុងគណនាទិន្នន័យវិភាគប្រព័ន្ធ…" : "Calculating platform analytics…"}
          </div>
        ) : (
          <>
            <div className="analytics-stats-grid">
              <StatCard
                icon={IoPeopleOutline}
                label={isKm ? "អ្នកប្រើប្រាស់សរុប" : "Total users"}
                value={summary.totalUsers}
                detail={`+${number(summary.newUsers)} ${isKm ? "ក្នុងអំឡុងពេលនេះ" : "in this range"}`}
              />
              <StatCard
                icon={IoRibbonOutline}
                label={isKm ? "អ្នកណែនាំផ្លូវការ" : "Verified mentors"}
                value={summary.totalMentors}
                detail={`${number(summary.totalStudents)} ${isKm ? "សិស្ស/និស្សិត" : "learners"}`}
                tone="purple"
              />
              <StatCard
                icon={IoBriefcaseOutline}
                label={isKm ? "ឱកាសកម្មសិក្សា" : "Internships"}
                value={summary.totalInternships}
                detail={`${number(summary.openInternships)} ${isKm ? "កំពុងបើកទទួលពាក្យ" : "currently open"}`}
                tone="orange"
              />
              <StatCard
                icon={IoPersonAddOutline}
                label={isKm ? "ពាក្យស្នើសុំការងារ" : "Applications"}
                value={summary.totalApplications}
                detail={`+${number(summary.newApplications)} ${isKm ? "ក្នុងអំឡុងពេលនេះ" : "in this range"}`}
                tone="blue"
              />
              <StatCard
                icon={IoSwapHorizontalOutline}
                label={isKm ? "ការផ្លាស់ប្តូរជំនាញ" : "Skill exchanges"}
                value={summary.totalExchanges}
                detail={`${number(summary.completedExchanges)} ${isKm ? "បានបញ្ចប់" : "completed"}`}
                tone="green"
              />
              <StatCard
                icon={IoCalendarOutline}
                label={isKm ? "ថ្នាក់រៀនផ្ទាល់" : "Learning sessions"}
                value={summary.totalSessions}
                detail={`${number(summary.registrations)} ${isKm ? "ការចុះឈ្មោះ" : "registrations"}`}
                tone="rose"
              />
              <StatCard
                icon={IoStatsChartOutline}
                label={isKm ? "ការពិភាក្សាក្នុងវេទិកា" : "Forum posts"}
                value={summary.forumPosts}
                detail={isKm ? "ប្រធានបទដែលបានបង្ហោះ" : "Published discussions"}
                tone="cyan"
              />
              <StatCard
                icon={IoTrendingUpOutline}
                label={isKm ? "សារដែលបានផ្ញើ" : "Messages sent"}
                value={summary.messages}
                detail={isKm ? "ការសន្ទនាក្នុងសហគមន៍" : "Community conversations"}
                tone="indigo"
              />
            </div>

            <section className="analytics-panel analytics-growth-panel">
              <div className="analytics-panel-header">
                <div>
                  <h2>{isKm ? "កំណើននៃប្រព័ន្ធ (Platform Growth)" : "Platform growth"}</h2>
                  <p>
                    {isKm
                      ? "អ្នកប្រើប្រាស់ថ្មី និងសកម្មភាពសំខាន់ៗក្នុងអំឡុងពេលដែលបានជ្រើសរើស។"
                      : "New users and key actions during the selected period."}
                  </p>
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
                      name={isKm ? "អ្នកប្រើប្រាស់" : "Users"}
                      stroke="#0f766e"
                      fill="url(#usersGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="applications"
                      name={isKm ? "ពាក្យស្នើសុំការងារ" : "Applications"}
                      stroke="#2563eb"
                      fill="transparent"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="exchanges"
                      name={isKm ? "ការផ្លាស់ប្តូរជំនាញ" : "Skill Exchanges"}
                      stroke="#7c3aed"
                      fill="transparent"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="sessions"
                      name={isKm ? "ថ្នាក់រៀនផ្ទាល់" : "Learning Sessions"}
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
                    <h2>{isKm ? "តួនាទីអ្នកប្រើប្រាស់ (User Roles)" : "User roles"}</h2>
                    <p>
                      {isKm
                        ? "សមាសភាពសមាជិកសកម្មនៅក្នុងសហគមន៍។"
                        : "Active community composition."}
                    </p>
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
                    <h2>{isKm ? "ស្ថានភាពពាក្យស្នើសុំការងារ (Application Pipeline)" : "Application pipeline"}</h2>
                    <p>
                      {isKm
                        ? "លទ្ធផលនៃការដាក់ពាក្យស្នើសុំកម្មសិក្សាបច្ចុប្បន្ន។"
                        : "Current internship application outcomes."}
                    </p>
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
                          name={isKm ? "ពាក្យស្នើសុំ" : "Applications"}
                          fill="#2563eb"
                          radius={[7, 7, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart message={isKm ? "មិនទាន់មានពាក្យស្នើសុំកម្មសិក្សាទេ។" : "No internship applications yet."} />
                  )}
                </div>
              </section>
            </div>

            <div className="analytics-rate-grid">
              {[
                [
                  isKm ? "គណនីបានផ្ទៀងផ្ទាត់" : "Verified users",
                  rates.verification,
                  isKm ? "គណនីដែលបានបញ្ជាក់អ៊ីមែល" : "Profiles with verified email",
                ],
                [
                  isKm ? "អត្រាជោគជ័យពាក្យការងារ" : "Application success",
                  rates.applicationSuccess,
                  isKm ? "ត្រូវបានអនុម័ត ឬទទួលយក" : "Approved or accepted",
                ],
                [
                  isKm ? "ការបញ្ចប់ការប្តូរជំនាញ" : "Exchange completion",
                  rates.exchangeCompletion,
                  isKm ? "វគ្គផ្លាស់ប្តូរជំនាញដែលបានបញ្ចប់" : "Skill exchanges completed",
                ],
                [
                  isKm ? "ការចូលរួមថ្នាក់រៀនផ្ទាល់" : "Session attendance",
                  rates.sessionAttendance,
                  isKm ? "អ្នកចុះឈ្មោះដែលបានចូលរួម" : "Registrations that attended",
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
                    <h2>{isKm ? "ជំនាញពេញនិយម (Popular Skills)" : "Popular skills"}</h2>
                    <p>
                      {isKm
                        ? "ជំនាញបង្រៀន រៀន និងជំនាញបេក្ខជនដែលពេញនិយមបំផុត។"
                        : "Most common teach, learn, and candidate skills."}
                    </p>
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
                          width={125}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="users"
                          name={isKm ? "អ្នកប្រើប្រាស់" : "Users"}
                          fill="#0f766e"
                          radius={[0, 7, 7, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart message={isKm ? "មិនទាន់មានទិន្នន័យជំនាញនៅឡើយទេ។" : "Users have not added profile skills yet."} />
                  )}
                </div>
              </section>

              <section className="analytics-panel">
                <div className="analytics-panel-header">
                  <div>
                    <h2>{isKm ? "ស្ថានភាពឱកាសកម្មសិក្សា" : "Internship status"}</h2>
                    <p>{isKm ? "ស្ថានភាពបើកទទួលពាក្យនៃការងារទាំងអស់។" : "Availability across all postings."}</p>
                  </div>
                </div>
                <div className="analytics-chart">
                  {internshipStatusData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={internshipStatusData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={58}
                          outerRadius={96}
                          paddingAngle={3}
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {internshipStatusData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={colors[(index + 1) % colors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart message={isKm ? "មិនទាន់មានឱកាសកម្មសិក្សាត្រូវបានបង្ហោះទេ។" : "No internships have been posted."} />
                  )}
                </div>
              </section>
            </div>

            <div className="analytics-two-column analytics-tables">
              <section className="analytics-panel">
                <div className="analytics-panel-header">
                  <div>
                    <h2>{isKm ? "ឱកាសកម្មសិក្សាឈានមុខ" : "Top internships"}</h2>
                    <p>{isKm ? "ចាត់ថ្នាក់តាមចំនួនពាក្យស្នើសុំ។" : "Postings ranked by applications."}</p>
                  </div>
                </div>
                <div className="analytics-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{isKm ? "ឱកាសកម្មសិក្សា" : "Internship"}</th>
                        <th>{isKm ? "ពាក្យស្នើសុំ" : "Applications"}</th>
                        <th>{isKm ? "ជោគជ័យ" : "Success"}</th>
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
                    <h2>{isKm ? "សកម្មភាពអ្នកណែនាំ (Mentor Performance)" : "Mentor performance"}</h2>
                    <p>{isKm ? "ការវាយតម្លៃ និងចំនួនវគ្គណែនាំ។" : "Ratings and mentorship activity."}</p>
                  </div>
                </div>
                <div className="analytics-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{isKm ? "អ្នកណែនាំ" : "Mentor"}</th>
                        <th>{isKm ? "ការកក់" : "Bookings"}</th>
                        <th>{isKm ? "ពិន្ទុ" : "Rating"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analytics?.tables?.mentorPerformance || []).map(
                        (item) => (
                          <tr key={item.id}>
                            <td>
                              <strong>{item.name}</strong>
                              <small>
                                {item.profession && !["beginner", "intermediate", "advanced"].includes(String(item.profession).toLowerCase())
                                  ? item.profession
                                  : isKm
                                    ? "អ្នកណែនាំសហគមន៍"
                                    : "Community mentor"}
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
                  <h2>{isKm ? "សកម្មភាពថ្មីៗក្នុងប្រព័ន្ធ" : "Recent platform activity"}</h2>
                  <p>
                    {isKm
                      ? "ព្រឹត្តិការណ៍ និងសកម្មភាពសំខាន់ៗចុងក្រោយនៅក្នុងសហគមន៍។"
                      : "The latest important events across the community."}
                  </p>
                </div>
              </div>
              <div className="analytics-activity-list">
                {(analytics?.tables?.recentActivity || []).map(
                  (item, index) => (
                    <article key={`${item.type}-${item.createdAt}-${index}`}>
                      <span>{index + 1}</span>
                      <div>
                        <strong>{formatActivityLabel(item.label, item.type)}</strong>
                        <small>
                          {formatActivityType(item.type)} ·{" "}
                          {new Date(item.createdAt).toLocaleString(isKm ? "km-KH" : "en-US")}
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
