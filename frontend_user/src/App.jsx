import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import AuthLayout from "./layouts/AuthLayout";
import RequireAuth from "./components/auth/RequireAuth";
import { RouteLoader } from "./components/ui/LoadingStates";
import {
  NotFoundPage,
  RouteErrorBoundary,
} from "./pages/errors/RouteErrorPage";
import { useGlobleContext } from "./context/GlobleContext";

const Home = lazy(() => import("./pages/home/Home"));
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const Courses = lazy(() => import("./pages/courses/Courses"));
const CourseDetail = lazy(() => import("./pages/courses/CourseDetail"));
const CertificatePage = lazy(() => import("./pages/certificates/CertificatePage"));
const LearningSessions = lazy(() => import("./pages/sessions/LearningSessions"));
const SessionRoom = lazy(() => import("./pages/sessions/SessionRoom"));
const Discover = lazy(() => import("./pages/discover/Discover"));
const DiscoverProfile = lazy(() => import("./pages/discover/DiscoverProfile"));
const SkillRequests = lazy(() => import("./pages/discover/SkillRequests"));
const SkillExchangeHub = lazy(() => import("./pages/exchange/SkillExchangeHub"));
const Jobs = lazy(() => import("./pages/Jobs/Jobs"));
const StudentApplicationTracker = lazy(() => import("./pages/Jobs/StudentApplicationTracker"));
const RecruiterATS = lazy(() => import("./pages/Jobs/RecruiterATS"));
const InternshipDashboard = lazy(() => import("./pages/Jobs/InternshipDashboard"));
const CareerDevelopment = lazy(() => import("./pages/career/CareerDevelopment"));
const Mentorship = lazy(() => import("./pages/mentorship/Mentorship"));
const MentorDetail = lazy(() => import("./pages/mentorship/MentorDetail"));
const Community = lazy(() => import("./pages/community/Community"));
const SkillExchangeDetail = lazy(() => import("./pages/community/SkillExchangeDetail"));
const Forum = lazy(() => import("./pages/forum/Forum"));
const ForumDetail = lazy(() => import("./pages/forum/ForumDetail"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));
const PostJob = lazy(() => import("./pages/recruiter/PostJob"));

// Smart backward-compatible dispatcher for legacy /applications URL
const ApplicationDispatcher = () => {
  const { user } = useGlobleContext();
  if (user?.role === "recruiter") {
    return <Navigate to="/recruiter/candidates" replace />;
  }
  return <Navigate to="/my-applications" replace />;
};
const Profile = lazy(() => import("./pages/profile/Profile"));
const Settings = lazy(() => import("./pages/settings/Settings"));
const Messages = lazy(() => import("./pages/messages/Messages"));
const Notifications = lazy(() => import("./pages/notifications/Notifications"));
const AnalyticsDashboard = lazy(() => import("./pages/analytics/AnalyticsDashboard"));
const AdminPanel = lazy(() => import("./pages/admin/AdminPanel"));
const CalendarPage = lazy(() => import("./pages/calendar/CalendarPage"));
const SearchResultsPage = lazy(() => import("./pages/search/SearchResultsPage"));
const CvStudioPage = lazy(() => import("./pages/career/CvStudioPage"));

const pageElement = (Component, label = "Loading page...") => (
  <Suspense fallback={<RouteLoader label={label} />}>
    <Component />
  </Suspense>
);

const protectedPage = (Component, label, allowedRoles = null) => (
  <RequireAuth allowedRoles={allowedRoles}>
    {pageElement(Component, label)}
  </RequireAuth>
);

const routes = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* 1. Main Platform Layout (with Full Floating Navbar, TabBar & Footer) */}
      <Route
        path="/"
        element={<RootLayout />}
        errorElement={<RouteErrorBoundary />}
      >
        <Route index element={pageElement(Home, "Preparing Smart Community...")} />
        <Route path="search" element={pageElement(SearchResultsPage, "Searching Smart Community...")} />
        <Route path="dashboard" element={protectedPage(Dashboard, "Preparing your dashboard...")} />
        <Route path="courses" element={pageElement(Courses, "Loading courses...")} />
        <Route path="courses/:courseId" element={pageElement(CourseDetail, "Preparing classroom...")} />
        <Route path="certificates/:code" element={pageElement(CertificatePage, "Loading certificate...")} />
        <Route path="sessions" element={pageElement(LearningSessions, "Loading live sessions...")} />
        <Route path="sessions/:sessionId" element={pageElement(LearningSessions, "Loading session...")} />
        <Route path="sessions/:sessionId/room" element={protectedPage(SessionRoom, "Preparing session room...")} />
        {/* Unified Skill Exchange Hub & Backward-Compatible URLs */}
        <Route path="skill-exchange" element={pageElement(SkillExchangeHub, "Preparing Skill Exchange Hub...")} />
        <Route path="exchange" element={pageElement(SkillExchangeHub, "Preparing Skill Exchange Hub...")} />
        <Route path="discover" element={pageElement(() => <SkillExchangeHub initialTab="match" />, "Finding skill partners...")} />
        <Route path="discover/:memberId" element={pageElement(DiscoverProfile, "Loading member profile...")} />
        <Route path="community" element={pageElement(() => <SkillExchangeHub initialTab="match" />, "Loading skill exchanges...")} />
        <Route path="skill-requests" element={protectedPage(() => <SkillExchangeHub initialTab="swaps" />, "Loading skill requests...")} />
        <Route path="community/skill-exchange/:exchangeId" element={protectedPage(SkillExchangeDetail, "Loading skill exchange...")} />
        <Route path="jobs" element={pageElement(Jobs, "Loading opportunities...")} />
        {/* Role-Specific Application Management */}
        <Route
          path="my-applications"
          element={protectedPage(StudentApplicationTracker, "Loading your applications...", ["student", "user", "admin"])}
        />
        <Route
          path="recruiter/candidates"
          element={protectedPage(RecruiterATS, "Loading candidate ATS...", ["recruiter", "admin"])}
        />
        <Route
          path="recruiter/jobs"
          element={protectedPage(() => <RecruiterATS initialView="postings" />, "Loading your job postings...", ["recruiter", "admin"])}
        />
        <Route
          path="recruiter/internships"
          element={protectedPage(() => <RecruiterATS initialView="postings" />, "Loading your job postings...", ["recruiter", "admin"])}
        />
        <Route
          path="internships-dashboard"
          element={protectedPage(InternshipDashboard, "Loading internship dashboard...", ["recruiter", "admin"])}
        />
        <Route
          path="my-posts"
          element={protectedPage(() => <RecruiterATS initialView="postings" />, "Loading your posts...", ["recruiter", "admin"])}
        />
        {/* Legacy Backward-Compatible Redirect */}
        <Route
          path="applications"
          element={protectedPage(ApplicationDispatcher, "Routing to your application workspace...")}
        />

        <Route path="career" element={pageElement(CareerDevelopment, "Loading career roadmap...")} />
        <Route path="cv-studio" element={pageElement(CvStudioPage, "Preparing CV Studio...")} />
        <Route path="cv-builder" element={<Navigate to="/cv-studio" replace />} />
        <Route path="my-cv" element={<Navigate to="/cv-studio" replace />} />
        <Route path="mentorship" element={pageElement(Mentorship, "Loading mentors...")} />
        <Route path="mentorship/:mentorId" element={pageElement(MentorDetail, "Loading mentor profile...")} />
        <Route path="forum" element={pageElement(Forum, "Loading forum...")} />
        <Route path="forum/:postId" element={pageElement(ForumDetail, "Loading discussion...")} />
        <Route
          path="post-job"
          element={protectedPage(PostJob, "Preparing internship form...", ["recruiter", "admin"])}
        />
        <Route path="profile" element={protectedPage(Profile, "Loading your profile...")} />
        <Route path="settings" element={protectedPage(Settings, "Loading settings...")} />
        <Route path="messages" element={protectedPage(Messages, "Loading messages...")} />
        <Route path="messages/:conversationId" element={protectedPage(Messages, "Loading conversation...")} />
        <Route path="notifications" element={protectedPage(Notifications, "Loading notifications...")} />
        <Route path="calendar" element={protectedPage(CalendarPage, "Loading your calendar...")} />
        <Route
          path="analytics"
          element={protectedPage(AnalyticsDashboard, "Loading analytics...", ["admin"])}
        />
        <Route
          path="admin"
          element={protectedPage(AdminPanel, "Loading administration...", ["admin"])}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* 2. Focused Distraction-Free Auth Layout (Minimal Header & Footer) */}
      <Route
        element={<AuthLayout />}
        errorElement={<RouteErrorBoundary />}
      >
        <Route path="login" element={pageElement(Login, "Preparing sign in...")} />
        <Route path="register" element={pageElement(Register, "Preparing registration...")} />
        <Route path="forgot-password" element={pageElement(ForgotPassword, "Loading account recovery...")} />
        <Route path="reset-password" element={pageElement(ResetPassword, "Loading password reset...")} />
        <Route path="verify-email" element={pageElement(VerifyEmail, "Verifying email...")} />
      </Route>
    </>
  ),
);

const App = () => <RouterProvider router={routes} />;

export default App;
