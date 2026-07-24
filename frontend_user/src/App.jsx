import "./index.css";
import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import {
  Courses,
  CourseDetail,
  Dashboard,
  Discover,
  DiscoverProfile,
  Home,
  Jobs,
  InternshipDashboard,
  Mentorship,
  MentorDetail,
  Community,
  SkillExchangeDetail,
  Login,
  Register,
  ForgotPassword,
  ResetPassword,
  VerifyEmail,
  PostJob,
  Profile,
  SkillRequests,
  Messages,
  LearningSessions,
  SessionRoom,
  Settings,
} from "./pages";
import RootLayout from "./layouts/RootLayout";

const CareerDevelopment = lazy(
  () => import("./pages/career/CareerDevelopment"),
);
const Forum = lazy(() => import("./pages/forum/Forum"));
const ForumDetail = lazy(() => import("./pages/forum/ForumDetail"));
const Notifications = lazy(
  () => import("./pages/notifications/Notifications"),
);
const AnalyticsDashboard = lazy(
  () => import("./pages/analytics/AnalyticsDashboard"),
);
const AdminPanel = lazy(() => import("./pages/admin/AdminPanel"));

const routes = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />} errorElement={<h1>Error page</h1>}>
      <Route index element={<Home />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="courses" element={<Courses />} />
      <Route path="courses/:courseId" element={<CourseDetail />} />
      <Route path="sessions" element={<LearningSessions />} />
      <Route path="sessions/:sessionId" element={<LearningSessions />} />
      <Route path="sessions/:sessionId/room" element={<SessionRoom />} />
      <Route path="discover" element={<Discover />} />
      <Route path="discover/:memberId" element={<DiscoverProfile />} />
      <Route path="jobs" element={<Jobs />} />
      <Route
        path="career"
        element={
          <Suspense fallback={<main className="section container">Loading career dashboard...</main>}>
            <CareerDevelopment />
          </Suspense>
        }
      />
      <Route path="applications" element={<InternshipDashboard />} />
      <Route path="my-posts" element={<InternshipDashboard />} />
      <Route path="mentorship" element={<Mentorship />} />
      <Route path="mentorship/:mentorId" element={<MentorDetail />} />
      <Route path="community" element={<Community />} />
      <Route path="forum" element={<Suspense fallback={<main className="section container">Loading community forum...</main>}><Forum /></Suspense>} />
      <Route path="forum/:postId" element={<Suspense fallback={<main className="section container">Loading discussion...</main>}><ForumDetail /></Suspense>} />
      <Route
        path="community/skill-exchange/:exchangeId"
        element={<SkillExchangeDetail />}
      />
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password" element={<ResetPassword />} />
      <Route path="verify-email" element={<VerifyEmail />} />
      <Route path="post-job" element={<PostJob />} />
      <Route path="profile" element={<Profile />} />
      <Route path="settings" element={<Settings />} />
      <Route path="skill-requests" element={<SkillRequests />} />
      <Route path="messages" element={<Messages />} />
      <Route path="messages/:conversationId" element={<Messages />} />
      <Route
        path="notifications"
        element={
          <Suspense fallback={<main className="section container">Loading notifications…</main>}>
            <Notifications />
          </Suspense>
        }
      />
      <Route
        path="analytics"
        element={
          <Suspense fallback={<main className="section container">Loading analytics…</main>}>
            <AnalyticsDashboard />
          </Suspense>
        }
      />
      <Route
        path="admin"
        element={
          <Suspense fallback={<main className="section container">Loading administration…</main>}>
            <AdminPanel />
          </Suspense>
        }
      />
    </Route>,
  ),
);

const App = () => {
  return <RouterProvider router={routes} />;
};

export default App;
