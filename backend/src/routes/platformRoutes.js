const express = require("express");
const {
  bookSkillExchange,
  createSkillExchange,
  getCommunitySkillExchanges,
  getDashboard,
  getMembers,
  getSkillExchanges,
  getStats,
  updateSkillExchangeStatus,
} = require("../controllers/platformController");
const { optionalAuth, requireAuth, requireRole } = require("../middleware/auth");
const {
  confirmSkillExchangeCompletion,
  getSkillExchangeDetail,
  getSkillLearningHistory,
  getSkillMatches,
  updateSkillExchangeProgress,
} = require("../controllers/skillExchangeController");
const {
  createMentorship,
  getMentorApplications,
  getMentorDetail,
  getMentors,
  getMentorships,
  getMyMentorApplication,
  reviewMentorApplication,
  submitMentorApplication,
  submitMentorReview,
  updateMentorshipStatus,
} = require("../controllers/mentorshipController");
const {
  applyInternship,
  createInternship,
  getCompanyProfile,
  getInternshipApplications,
  getInternships,
  getRecruiterInternships,
  updateApplicationStatus,
  updateInternshipStatus,
  uploadCompanyLogo,
  upsertCompanyProfile,
} = require("../controllers/internshipController");
const documentUpload = require("../middleware/documentUpload");
const imageUpload = require("../middleware/imageUpload");
const {
  getCareerArticle,
  getCareerArticles,
  getCareerAssessment,
  getCareerAssessments,
  getCareerOverview,
  getCareerPath,
  getCareerPaths,
  startCareerRoadmap,
  submitCareerAssessment,
  updateRoadmapStep,
} = require("../controllers/careerController");
const {
  acceptForumAnswer,
  createForumAnswer,
  createForumComment,
  createForumPost,
  deleteForumAnswer,
  deleteForumComment,
  deleteForumPost,
  getForumCategories,
  getForumPost,
  getForumPosts,
  toggleAnswerLike,
  togglePostLike,
  updateForumPost,
} = require("../controllers/forumController");
const {
  cancelSessionRegistration,
  createLearningSession,
  getLearningSession,
  getSessionParticipants,
  joinLearningSession,
  leaveLearningSession,
  listLearningSessions,
  registerForSession,
  submitSessionFeedback,
  updateLearningSessionStatus,
} = require("../controllers/learningSessionController");
const {
  deleteNotification,
  deleteReadNotifications,
  getNotificationPreferences,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  registerPushToken,
  unregisterPushToken,
  updateNotificationPreferences,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/stats", getStats);
router.get("/members", getMembers);
router.get("/mentors", getMentors);
router.get("/mentors/:mentorId", getMentorDetail);
router.get("/internships", getInternships);
router.get("/career/paths", getCareerPaths);
router.get("/career/paths/:pathId", getCareerPath);
router.get("/career/articles", getCareerArticles);
router.get("/career/articles/:slug", getCareerArticle);
router.get("/career/assessments", getCareerAssessments);
router.get("/career/assessments/:assessmentId", getCareerAssessment);
router.get("/forum/categories", getForumCategories);
router.get("/forum/posts", optionalAuth, getForumPosts);
router.get("/forum/posts/:postId", optionalAuth, getForumPost);
router.get("/learning-sessions", optionalAuth, listLearningSessions);
router.get("/learning-sessions/:sessionId", optionalAuth, getLearningSession);
router.get("/skill-exchanges/community", getCommunitySkillExchanges);
router.get("/skill-exchanges", requireAuth, getSkillExchanges);
router.get("/skill-matches", requireAuth, getSkillMatches);
router.get("/skill-exchanges/history", requireAuth, getSkillLearningHistory);
router.get("/skill-exchanges/:exchangeId", requireAuth, getSkillExchangeDetail);

router.get("/dashboard", requireAuth, getDashboard);
router.get("/career/overview", requireAuth, getCareerOverview);
router.post("/career/roadmaps", requireAuth, startCareerRoadmap);
router.patch(
  "/career/roadmaps/:roadmapId/steps/:stepId",
  requireAuth,
  updateRoadmapStep,
);
router.post(
  "/career/assessments/:assessmentId/submit",
  requireAuth,
  submitCareerAssessment,
);
router.post("/forum/posts", requireAuth, createForumPost);
router.patch("/forum/posts/:postId", requireAuth, updateForumPost);
router.delete("/forum/posts/:postId", requireAuth, deleteForumPost);
router.post("/forum/posts/:postId/answers", requireAuth, createForumAnswer);
router.post("/forum/posts/:postId/comments", requireAuth, createForumComment);
router.post("/forum/posts/:postId/like", requireAuth, togglePostLike);
router.post("/forum/answers/:answerId/like", requireAuth, toggleAnswerLike);
router.post("/forum/answers/:answerId/accept", requireAuth, acceptForumAnswer);
router.delete("/forum/answers/:answerId", requireAuth, deleteForumAnswer);
router.delete("/forum/comments/:commentId", requireAuth, deleteForumComment);
router.post(
  "/learning-sessions",
  requireAuth,
  requireRole("mentor", "admin"),
  createLearningSession,
);
router.post(
  "/learning-sessions/:sessionId/register",
  requireAuth,
  registerForSession,
);
router.delete(
  "/learning-sessions/:sessionId/register",
  requireAuth,
  cancelSessionRegistration,
);
router.patch(
  "/learning-sessions/:sessionId/status",
  requireAuth,
  updateLearningSessionStatus,
);
router.post(
  "/learning-sessions/:sessionId/attendance/join",
  requireAuth,
  joinLearningSession,
);
router.post(
  "/learning-sessions/:sessionId/attendance/leave",
  requireAuth,
  leaveLearningSession,
);
router.get(
  "/learning-sessions/:sessionId/participants",
  requireAuth,
  getSessionParticipants,
);
router.post(
  "/learning-sessions/:sessionId/feedback",
  requireAuth,
  submitSessionFeedback,
);
router.get(
  "/company-profile/me",
  requireAuth,
  requireRole("recruiter", "admin"),
  getCompanyProfile,
);
router.patch(
  "/company-profile/me",
  requireAuth,
  requireRole("recruiter", "admin"),
  upsertCompanyProfile,
);
router.post(
  "/company-profile/logo",
  requireAuth,
  requireRole("recruiter", "admin"),
  imageUpload.single("logo"),
  uploadCompanyLogo,
);
router.get("/mentor-applications/me", requireAuth, getMyMentorApplication);
router.post("/mentor-applications", requireAuth, submitMentorApplication);
router.get(
  "/mentor-applications",
  requireAuth,
  requireRole("admin"),
  getMentorApplications,
);
router.patch(
  "/mentor-applications/:applicationId",
  requireAuth,
  requireRole("admin"),
  reviewMentorApplication,
);
router.get("/mentorships", requireAuth, getMentorships);
router.post("/mentorships", requireAuth, createMentorship);
router.patch(
  "/mentorships/:mentorshipId/status",
  requireAuth,
  updateMentorshipStatus,
);
router.post(
  "/mentorships/:mentorshipId/reviews",
  requireAuth,
  submitMentorReview,
);
router.post("/skill-exchanges", requireAuth, createSkillExchange);
router.patch(
  "/skill-exchanges/:exchangeId/book",
  requireAuth,
  bookSkillExchange,
);
router.patch(
  "/skill-exchanges/:exchangeId/progress",
  requireAuth,
  updateSkillExchangeProgress,
);
router.post(
  "/skill-exchanges/:exchangeId/complete",
  requireAuth,
  confirmSkillExchangeCompletion,
);
router.patch(
  "/skill-exchanges/:exchangeId/status",
  requireAuth,
  updateSkillExchangeStatus,
);
router.post(
  "/internships",
  requireAuth,
  requireRole("recruiter", "admin"),
  createInternship,
);
router.get(
  "/internships/manage",
  requireAuth,
  requireRole("recruiter", "admin"),
  getRecruiterInternships,
);
router.patch(
  "/internships/:internshipId/status",
  requireAuth,
  requireRole("recruiter", "admin"),
  updateInternshipStatus,
);
router.post(
  "/internships/:internshipId/apply",
  requireAuth,
  requireRole("student"),
  documentUpload.single("resume"),
  applyInternship,
);
router.get("/internship-applications", requireAuth, getInternshipApplications);
router.patch(
  "/internship-applications/:applicationId/status",
  requireAuth,
  requireRole("recruiter", "admin"),
  updateApplicationStatus,
);
router.get("/notifications", requireAuth, getNotifications);
router.patch(
  "/notifications/:notificationId/read",
  requireAuth,
  markNotificationRead,
);
router.patch("/notifications/read-all", requireAuth, markAllNotificationsRead);
router.delete("/notifications/read", requireAuth, deleteReadNotifications);
router.delete(
  "/notifications/:notificationId",
  requireAuth,
  deleteNotification,
);
router.get(
  "/notification-preferences",
  requireAuth,
  getNotificationPreferences,
);
router.patch(
  "/notification-preferences",
  requireAuth,
  updateNotificationPreferences,
);
router.post("/notification-push-token", requireAuth, registerPushToken);
router.delete("/notification-push-token", requireAuth, unregisterPushToken);

module.exports = router;
