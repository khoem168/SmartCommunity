import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  IoBriefcaseOutline,
  IoBusinessOutline,
  IoChevronDownOutline,
  IoCloseOutline,
  IoDocumentTextOutline,
  IoGridOutline,
  IoLogOutOutline,
  IoMenuOutline,
  IoNotificationsOutline,
  IoPeopleOutline,
  IoRefreshOutline,
  IoShieldCheckmarkOutline,
  IoStatsChartOutline,
} from "react-icons/io5";
import logo from "./assets/logo/image.png";
import { LoadingState, Toast } from "./components/UI";
import LoginPage from "./pages/LoginPage";
import { clearToken, fetchCurrentAdmin, getToken } from "./services/api";
import { initials } from "./utils/format";
import "./index.css";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const ReviewsPage = lazy(() => import("./pages/ReviewsPage"));
const InternshipsPage = lazy(() => import("./pages/InternshipsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const AuditPage = lazy(() => import("./pages/AuditPage"));

const navigation = [
  { to: "/", label: "Overview", icon: IoGridOutline, end: true },
  { to: "/users", label: "Users", icon: IoPeopleOutline },
  { to: "/reviews", label: "Review center", icon: IoShieldCheckmarkOutline },
  { to: "/internships", label: "Internships", icon: IoBriefcaseOutline },
  { to: "/analytics", label: "Analytics", icon: IoStatsChartOutline },
  { to: "/audit", label: "Audit & reports", icon: IoDocumentTextOutline },
];

const pageMeta = {
  "/": ["Overview", "Monitor platform health and pending work."],
  "/users": ["User management", "Search, verify, assign roles, and protect accounts."],
  "/reviews": ["Review center", "Approve mentors and trusted company profiles."],
  "/internships": ["Internship moderation", "Keep opportunities current and credible."],
  "/analytics": ["Platform analytics", "Understand growth, engagement, and outcomes."],
  "/audit": ["Audit & reports", "Review administrator actions and export records."],
};

const AdminShell = ({ admin, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const meta = pageMeta[location.pathname] || pageMeta["/"];

  const notify = useCallback((message, type = "success") => {
    setToast({ id: Date.now(), message, type });
  }, []);

  const logout = () => {
    clearToken();
    onLogout();
    navigate("/");
  };

  return (
    <div className="admin-app">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <img src={logo} alt="Smart Community" />
          <div>
            <strong>Admin Control</strong>
            <span>Smart Community</span>
          </div>
          <button
            className="sidebar-close"
            type="button"
            onClick={() => setSidebarOpen(false)}
          >
            <IoCloseOutline />
          </button>
        </div>

        <div className="sidebar-caption">Workspace</div>
        <nav className="sidebar-nav">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              to={to}
              end={end}
              key={to}
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={() => {
                setSidebarOpen(false);
                setProfileOpen(false);
              }}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-support">
          <span>
            <IoBusinessOutline />
          </span>
          <strong>System status</strong>
          <p>Connected to the live administration API.</p>
          <i>Operational</i>
        </div>

        <button className="sidebar-logout" type="button" onClick={logout}>
          <IoLogOutOutline />
          Sign out
        </button>
      </aside>
      {sidebarOpen && (
        <button
          className="sidebar-scrim"
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="admin-main">
        <header className="topbar">
          <div className="topbar-title">
            <button
              className="menu-button"
              type="button"
              onClick={() => setSidebarOpen(true)}
            >
              <IoMenuOutline />
            </button>
            <div>
              <h1>{meta[0]}</h1>
              <p>{meta[1]}</p>
            </div>
          </div>
          <div className="topbar-actions">
            <button
              className="icon-button refresh-button"
              type="button"
              title="Refresh page data"
              onClick={() => setRefreshKey((value) => value + 1)}
            >
              <IoRefreshOutline />
            </button>
            <button className="icon-button notification-button" type="button">
              <IoNotificationsOutline />
              <span />
            </button>
            <div className="profile-menu">
              <button
                type="button"
                className="profile-trigger"
                onClick={() => setProfileOpen((value) => !value)}
              >
                <span className="avatar">{initials(admin.fullName)}</span>
                <span>
                  <strong>{admin.fullName}</strong>
                  <small>Administrator</small>
                </span>
                <IoChevronDownOutline />
              </button>
              {profileOpen && (
                <div className="profile-popover">
                  <p>{admin.email}</p>
                  <button type="button" onClick={logout}>
                    <IoLogOutOutline /> Sign out securely
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="page-scroll">
          <Suspense fallback={<LoadingState label="Preparing this workspace…" />}>
            <Outlet context={{ admin, notify, refreshKey }} />
          </Suspense>
        </div>
      </div>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

const AppContent = () => {
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    fetchCurrentAdmin()
      .then(({ user }) => {
        if (user?.role === "admin") setAdmin(user);
        else clearToken();
      })
      .catch(() => clearToken())
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <main className="boot-screen">
        <img src={logo} alt="Smart Community" />
        <span className="spinner" />
        <strong>Securing your admin session…</strong>
      </main>
    );
  }

  if (!admin) return <LoginPage onLogin={setAdmin} />;

  return (
    <Routes>
      <Route
        element={<AdminShell admin={admin} onLogout={() => setAdmin(null)} />}
      >
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="internships" element={<InternshipsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
);

export default App;
