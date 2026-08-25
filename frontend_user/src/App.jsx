import "./index.css";
import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import RequireAuth from "./components/auth/RequireAuth";
import { RouteLoader } from "./components/ui/LoadingStates";
import {
  NotFoundPage,
  RouteErrorBoundary,
} from "./pages/errors/RouteErrorPage";
import "./design-refresh.css";

const Home = lazy(() => import("./pages/home/Home"));
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const Courses = lazy(() => import("./pages/courses/Courses"));
const CourseDetail = lazy(() => import("./pages/courses/CourseDetail"));
const LearningSessions = lazy(() => import("./pages/sessions/LearningSessions"));
const SessionRoom = lazy(() => import("./pages/sessions/SessionRoom"));
const Discover = lazy(() => import("./pages/discover/Discover"));
const DiscoverProfile = lazy(() => import("./pages/discover/DiscoverProfile"));
const SkillRequests = lazy(() => import("./pages/discover/SkillRequests"));
const Jobs = lazy(() => import("./pages/Jobs/Jobs"));
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
const Profile = lazy(() => import("./pages/profile/Profile"));
const Settings = lazy(() => import("./pages/settings/Settings"));
const Messages = lazy(() => import("./pages/messages/Messages"));
const Notifications = lazy(() => import("./pages/notifications/Notifications"));
const AnalyticsDashboard = lazy(() => import("./pages/analytics/AnalyticsDashboard"));
const AdminPanel = lazy(() => import("./pages/admin/AdminPanel"));

const pageElement = (Component, label = "Loading page...") => (
  <Suspense fallback={<RouteLoader label={label} />}>
    <Component />
  </Suspense>
);

const protectedPage = (Component, label) => (
  <RequireAuth>{pageElement(Component, label)}</RequireAuth>
);

const routes = createBrowserRouter(
  createRoutesFromElements(
    <Route
      path="/"
      element={<RootLayout />}
      errorElement={<RouteErrorBoundary />}
    >
      <Route index element={pageElement(Home, "Preparing Smart Community...")} />
      <Route path="dashboard" element={protectedPage(Dashboard, "Preparing your dashboard...")} />
      <Route path="courses" element={pageElement(Courses, "Loading courses...")} />
      <Route path="courses/:courseId" element={pageElement(CourseDetail, "Preparing classroom...")} />
      <Route path="sessions" element={pageElement(LearningSessions, "Loading live sessions...")} />
      <Route path="sessions/:sessionId" element={pageElement(LearningSessions, "Loading session...")} />
      <Route path="sessions/:sessionId/room" element={protectedPage(SessionRoom, "Preparing session room...")} />
      <Route path="discover" element={protectedPage(Discover, "Finding community members...")} />
      <Route path="discover/:memberId" element={protectedPage(DiscoverProfile, "Loading member profile...")} />
      <Route path="jobs" element={pageElement(Jobs, "Loading opportunities...")} />
      <Route path="career" element={pageElement(CareerDevelopment, "Loading career roadmap...")} />
      <Route path="applications" element={protectedPage(InternshipDashboard, "Loading your applications...")} />
      <Route path="my-posts" element={protectedPage(InternshipDashboard, "Loading your posts...")} />
      <Route path="mentorship" element={pageElement(Mentorship, "Loading mentors...")} />
      <Route path="mentorship/:mentorId" element={pageElement(MentorDetail, "Loading mentor profile...")} />
      <Route path="community" element={pageElement(Community, "Loading community...")} />
      <Route path="forum" element={pageElement(Forum, "Loading forum...")} />
      <Route path="forum/:postId" element={pageElement(ForumDetail, "Loading discussion...")} />
      <Route path="community/skill-exchange/:exchangeId" element={protectedPage(SkillExchangeDetail, "Loading skill exchange...")} />
      <Route path="login" element={pageElement(Login, "Preparing sign in...")} />
      <Route path="register" element={pageElement(Register, "Preparing registration...")} />
      <Route path="forgot-password" element={pageElement(ForgotPassword, "Loading account recovery...")} />
      <Route path="reset-password" element={pageElement(ResetPassword, "Loading password reset...")} />
      <Route path="verify-email" element={pageElement(VerifyEmail, "Verifying email...")} />
      <Route path="post-job" element={protectedPage(PostJob, "Preparing internship form...")} />
      <Route path="profile" element={protectedPage(Profile, "Loading your profile...")} />
      <Route path="settings" element={protectedPage(Settings, "Loading settings...")} />
      <Route path="skill-requests" element={protectedPage(SkillRequests, "Loading skill requests...")} />
      <Route path="messages" element={protectedPage(Messages, "Loading messages...")} />
      <Route path="messages/:conversationId" element={protectedPage(Messages, "Loading conversation...")} />
      <Route path="notifications" element={protectedPage(Notifications, "Loading notifications...")} />
      <Route path="analytics" element={protectedPage(AnalyticsDashboard, "Loading analytics...")} />
      <Route path="admin" element={protectedPage(AdminPanel, "Loading administration...")} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>,
  ),
);

const App = () => <RouterProvider router={routes} />;

export default App;
