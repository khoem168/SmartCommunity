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
} = require("../controllers/authController");
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

module.exports = router;
