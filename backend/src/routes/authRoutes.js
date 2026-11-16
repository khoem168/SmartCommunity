const express = require("express");
const {
  forgotPassword,
  googleLogin,
  login,
  me,
  register,
  resendVerification,
  resetPassword,
  updateProfile,
  verifyEmail,
  verifyTwoFactorLogin,
} = require("../controllers/authController");
const twoFactorController = require("../controllers/twoFactorController");
const { requireAuth } = require("../middleware/auth");
const { authLimiter, loginLimiter, tokenRequestLimiter } = require("../middleware/rateLimits");

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/google", loginLimiter, googleLogin);
router.post("/verify-email", tokenRequestLimiter, verifyEmail);
router.post("/resend-verification", tokenRequestLimiter, resendVerification);
router.post("/forgot-password", tokenRequestLimiter, forgotPassword);
router.post("/reset-password", tokenRequestLimiter, resetPassword);
router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, updateProfile);

// Two-factor authentication (authenticator app codes)
router.post("/2fa/verify", loginLimiter, verifyTwoFactorLogin);
router.get("/2fa/status", requireAuth, twoFactorController.getStatus);
router.post("/2fa/setup", requireAuth, twoFactorController.startSetup);
router.post("/2fa/enable", requireAuth, authLimiter, twoFactorController.confirmSetup);
router.post("/2fa/disable", requireAuth, authLimiter, twoFactorController.disable);
router.post("/2fa/recovery-codes", requireAuth, authLimiter, twoFactorController.regenerateRecoveryCodes);

module.exports = router;
