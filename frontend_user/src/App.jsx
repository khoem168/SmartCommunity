import "./index.css";
import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import {
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
import RequireAuth from "./components/auth/RequireAuth";

const CareerDevelopment = lazy(
  () => import("./pages/career/CareerDevelopment"),
);
const Courses = lazy(() => import("./pages/courses/Courses"));
const CourseDetail = lazy(() => import("./pages/courses/CourseDetail"));
const Forum = lazy(() => import("./pages/forum/Forum"));
const ForumDetail = lazy(() => import("./pages/forum/ForumDetail"));
const Notifications = lazy(
  () => import("./pages/notifications/Notifications"),
);
const AnalyticsDashboard = lazy(
  () => import("./pages/analytics/AnalyticsDashboard"),
);
const AdminPanel = lazy(() => import("./pages/admin/AdminPanel"));

const protectedElement = (element) => <RequireAuth>{element}</RequireAuth>;

const routes = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />} errorElement={<h1>Error page</h1>}>
      <Route index element={<Home />} />
      <Route path="dashboard" element={protectedElement(<Dashboard />)} />
      <Route
        path="courses"
        element={
          <Suspense fallback={<main className="section container">Loading courses...</main>}>
            <Courses />
          </Suspense>
        }
      />
      <Route
        path="courses/:courseId"
        element={
          <Suspense fallback={<main className="section container">Preparing classroom...</main>}>
            <CourseDetail />
          </Suspense>
        }
      />
      <Route path="sessions" element={<LearningSessions />} />
      <Route path="sessions/:sessionId" element={<LearningSessions />} />
      <Route path="sessions/:sessionId/room" element={protectedElement(<SessionRoom />)} />
      <Route path="discover" element={protectedElement(<Discover />)} />
      <Route path="discover/:memberId" element={protectedElement(<DiscoverProfile />)} />
      <Route path="jobs" element={<Jobs />} />
      <Route
        path="career"
        element={
          <Suspense fallback={<main className="section container">Loading career dashboard...</main>}>
            <CareerDevelopment />
          </Suspense>
        }
      />
      <Route path="applications" element={protectedElement(<InternshipDashboard />)} />
      <Route path="my-posts" element={protectedElement(<InternshipDashboard />)} />
      <Route path="mentorship" element={<Mentorship />} />
      <Route path="mentorship/:mentorId" element={<MentorDetail />} />
      <Route path="community" element={<Community />} />
      <Route
        path="forum"
        element={
          <Suspense fallback={<main className="section container">Loading community forum...</main>}>
            <Forum />
          </Suspense>
        }
      />
      <Route
        path="forum/:postId"
        element={
          <Suspense fallback={<main className="section container">Loading discussion...</main>}>
            <ForumDetail />
          </Suspense>
        }
      />
      <Route
        path="community/skill-exchange/:exchangeId"
        element={protectedElement(<SkillExchangeDetail />)}
      />
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password" element={<ResetPassword />} />
      <Route path="verify-email" element={<VerifyEmail />} />
      <Route path="post-job" element={protectedElement(<PostJob />)} />
      <Route path="profile" element={protectedElement(<Profile />)} />
      <Route path="settings" element={protectedElement(<Settings />)} />
      <Route path="skill-requests" element={protectedElement(<SkillRequests />)} />
      <Route path="messages" element={protectedElement(<Messages />)} />
      <Route path="messages/:conversationId" element={protectedElement(<Messages />)} />
      <Route
        path="notifications"
        element={protectedElement(
          <Suspense fallback={<main className="section container">Loading notifications...</main>}>
            <Notifications />
          </Suspense>,
        )}
      />
      <Route
        path="analytics"
        element={protectedElement(
          <Suspense fallback={<main className="section container">Loading analytics...</main>}>
            <AnalyticsDashboard />
          </Suspense>,
        )}
      />
      <Route
        path="admin"
        element={protectedElement(
          <Suspense fallback={<main className="section container">Loading administration...</main>}>
            <AdminPanel />
          </Suspense>,
        )}
      />
    </Route>,
  ),
);

const App = () => {
  return <RouterProvider router={routes} />;
};

export default App;
