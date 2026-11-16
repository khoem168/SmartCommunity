const express = require("express");
const { getAdminOverview } = require("../controllers/platformController");
const { getAdminAnalytics } = require("../controllers/analyticsController");
const {
  exportAdminReport,
  getAdminDashboard,
  listAdminAuditLogs,
  listAdminCompanies,
  listAdminInternships,
  listAdminMentorApplications,
  listAdminUsers,
  reviewAdminCompany,
  reviewAdminMentorApplication,
  updateAdminInternship,
  updateAdminUser,
} = require("../controllers/adminController");
const { requireAuth, requireRole } = require("../middleware/auth");
const { adminReset, requireAdminTwoFactor } = require("../controllers/twoFactorController");

const router = express.Router();

router.use(requireAuth, requireRole("admin"), requireAdminTwoFactor);
router.get("/overview", getAdminOverview);
router.get("/dashboard", getAdminDashboard);
router.get("/analytics", getAdminAnalytics);
router.get("/users", listAdminUsers);
router.patch("/users/:userId", updateAdminUser);
router.post("/users/:userId/two-factor/reset", adminReset);
router.get("/mentor-applications", listAdminMentorApplications);
router.patch(
  "/mentor-applications/:applicationId",
  reviewAdminMentorApplication,
);
router.get("/companies", listAdminCompanies);
router.patch("/companies/:companyId", reviewAdminCompany);
router.get("/internships", listAdminInternships);
router.patch("/internships/:internshipId", updateAdminInternship);
router.get("/audit-logs", listAdminAuditLogs);
router.get("/reports/:report.csv", exportAdminReport);

module.exports = router;
